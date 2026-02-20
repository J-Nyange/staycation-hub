import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Users, 
  Bed, 
  Bath, 
  Wifi, 
  Car, 
  Star,
  Heart,
  Calendar,
  MessageSquare
} from "lucide-react";
import { Property } from "@/hooks/useProperties";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { usePropertyRating } from "@/hooks/useReviews";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";
import BookingModal from "@/components/BookingModal";
import ImageCarousel from "@/components/ImageCarousel";

interface PropertyDetailsModalProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PropertyDetailsModal = ({ property, open, onOpenChange }: PropertyDetailsModalProps) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const { user, openSignIn } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { data: ratingData } = usePropertyRating(property?.id || "");

  if (!property) return null;

  const isLiked = isInWishlist(property.id);
  const rating = ratingData?.rating || 0;
  const reviewCount = ratingData?.count || 0;

  const handleWishlistToggle = () => {
    if (!user) {
      openSignIn();
      return;
    }

    if (isLiked) {
      removeFromWishlist(property.id);
    } else {
      addToWishlist(property.id);
    }
  };

  const handleBookingClick = () => {
    if (!user) {
      openSignIn();
      return;
    }
    setIsBookingModalOpen(true);
  };

  const categoryColors = {
    airbnb: "bg-primary/10 text-primary border-primary/20",
    villa: "bg-accent/10 text-accent-foreground border-accent/20",
    homestay: "bg-secondary/10 text-secondary border-secondary/20",
  };

  const categoryLabels = {
    airbnb: "Airbnb",
    villa: "Villa",
    homestay: "Homestay",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{property.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Image Carousel */}
            <div className="relative">
              <ImageCarousel
                images={property.images && property.images.length > 0 
                  ? property.images 
                  : (property.main_image ? [property.main_image] : ['/src/assets/hero-villa.jpg'])
                }
                alt={property.title}
                className="h-64 md:h-80"
              />
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <Badge className={categoryColors[property.category]}>
                  {categoryLabels[property.category]}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWishlistToggle}
                  className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white ${
                    isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-1">
                  Reviews
                  {reviewCount > 0 && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {reviewCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      {property.location}
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        {property.guests} guests
                      </div>
                      {property.bedrooms && (
                        <div className="flex items-center text-sm">
                          <Bed className="w-4 h-4 mr-1" />
                          {property.bedrooms} beds
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center text-sm">
                          <Bath className="w-4 h-4 mr-1" />
                          {property.bathrooms} baths
                        </div>
                      )}
                    </div>

                    {property.description && (
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground">{property.description}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold mb-2">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center space-x-1 text-sm text-muted-foreground">
                            {amenity === "wifi" && <Wifi className="w-4 h-4" />}
                            {amenity === "parking" && <Car className="w-4 h-4" />}
                            <span className="capitalize">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-3xl font-bold">KES {property.price_per_night}</span>
                        <span className="text-muted-foreground ml-1">/ night</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                        {reviewCount > 0 && (
                          <span className="text-sm text-muted-foreground">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <Button 
                      onClick={handleBookingClick}
                      className="w-full"
                      size="lg"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Reserve Now
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-2">
                      You won't be charged yet
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="pt-4 space-y-6">
                <ReviewList propertyId={property.id} />
                <Separator />
                <ReviewForm propertyId={property.id} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      {user && property && (
        <BookingModal
          property={property}
          open={isBookingModalOpen}
          onOpenChange={setIsBookingModalOpen}
        />
      )}
    </>
  );
};

export default PropertyDetailsModal;