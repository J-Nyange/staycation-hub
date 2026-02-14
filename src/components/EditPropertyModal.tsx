import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Property } from "@/hooks/useProperties";
import { propertySchema, validateForm } from "@/lib/validations";
import { geocodeAddress } from "@/utils/geocoding";

interface EditPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  onSuccess?: () => void;
}

const EditPropertyModal = ({ open, onOpenChange, property, onSuccess }: EditPropertyModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "",
    price_per_night: "",
    guests: "",
    bedrooms: "",
    bathrooms: "",
    images: [] as string[],
    amenities: [] as string[],
    is_active: true,
  });

  const { toast } = useToast();

  const availableAmenities = [
    "wifi",
    "parking",
    "pool",
    "kitchen",
    "air_conditioning",
    "beach_access",
    "gym",
    "spa",
    "restaurant",
    "bar"
  ];

  useEffect(() => {
    if (property && open) {
      setFormData({
        title: property.title,
        description: property.description || "",
        location: property.location,
        category: property.category,
        price_per_night: property.price_per_night.toString(),
        guests: property.guests.toString(),
        bedrooms: property.bedrooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        images: property.images || [],
        amenities: property.amenities || [],
        is_active: property.is_active ?? true,
      });
      setErrors({});
    }
  }, [property, open]);

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked 
        ? [...prev.amenities, amenity]
        : prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter valid images (non-empty strings)
    const validImages = formData.images.filter(img => img.trim() !== '');

    // Validate with Zod schema
    const validation = validateForm(propertySchema, {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      category: formData.category || undefined,
      price_per_night: formData.price_per_night ? parseFloat(formData.price_per_night) : undefined,
      guests: formData.guests ? parseInt(formData.guests) : undefined,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
      images: validImages,
      amenities: formData.amenities,
      is_active: formData.is_active,
    });

    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: firstError,
      });
      return;
    }

    const validatedData = validation.data;
    setErrors({});
    setIsLoading(true);

    try {
      // Auto-geocode if location changed
      let latitude: number | null = property.latitude ?? null;
      let longitude: number | null = property.longitude ?? null;
      if (validatedData.location !== property.location || (!latitude && !longitude)) {
        const geoResult = await geocodeAddress(validatedData.location);
        if (geoResult) {
          latitude = geoResult.lat;
          longitude = geoResult.lon;
        }
      }

      const { error } = await supabase
        .from('properties')
        .update({
          title: validatedData.title,
          description: validatedData.description,
          location: validatedData.location,
          category: validatedData.category,
          price_per_night: validatedData.price_per_night,
          guests: validatedData.guests,
          bedrooms: validatedData.bedrooms,
          bathrooms: validatedData.bathrooms,
          main_image: validatedData.images[0],
          images: validatedData.images,
          amenities: validatedData.amenities || [],
          is_active: validatedData.is_active,
          latitude,
          longitude,
        })
        .eq('id', property.id);

      if (error) throw error;

      toast({
        title: "Property Updated",
        description: "Your property has been successfully updated.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update property. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="active">Property Status</Label>
              <p className="text-sm text-muted-foreground">
                {formData.is_active ? "Active - Visible to guests" : "Inactive - Hidden from listings"}
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Property Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={100}
                required
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                maxLength={200}
                required
                className={errors.location ? "border-destructive" : ""}
              />
              {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description * (minimum 100 characters)</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
              minLength={100}
              maxLength={5000}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            <p className="text-sm text-muted-foreground">
              {formData.description.length}/100 characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="homestay">Homestay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price per Night (USD) *</Label>
              <Input
                id="edit-price"
                type="number"
                min="1"
                max="1000000"
                value={formData.price_per_night}
                onChange={(e) => setFormData(prev => ({ ...prev, price_per_night: e.target.value }))}
                required
                className={errors.price_per_night ? "border-destructive" : ""}
              />
              {errors.price_per_night && <p className="text-sm text-destructive">{errors.price_per_night}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-guests">Max Guests *</Label>
              <Input
                id="edit-guests"
                type="number"
                min="1"
                max="50"
                value={formData.guests}
                onChange={(e) => setFormData(prev => ({ ...prev, guests: e.target.value }))}
                required
                className={errors.guests ? "border-destructive" : ""}
              />
              {errors.guests && <p className="text-sm text-destructive">{errors.guests}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                value={formData.bedrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Property Images * (minimum 3 required)</Label>
            {formData.images.map((image, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`image-${index}`}>Image {index + 1} URL</Label>
                <Input
                  id={`image-${index}`}
                  type="url"
                  value={image}
                  onChange={(e) => {
                    const newImages = [...formData.images];
                    newImages[index] = e.target.value;
                    setFormData(prev => ({ ...prev, images: newImages }));
                  }}
                  placeholder="https://example.com/image.jpg"
                  required={index < 3}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, images: [...prev.images, ""] }))}
              className="mt-2"
            >
              Add Another Image
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${amenity}`}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                  />
                  <Label htmlFor={`edit-${amenity}`} className="text-sm capitalize">
                    {amenity.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPropertyModal;
