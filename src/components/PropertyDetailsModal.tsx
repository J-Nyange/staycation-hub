import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Users, 
  Bed, 
  Bath, 
  Wifi, 
  Car, 
  Star,
  Heart,
  Calendar
} from "lucide-react";
import { Property } from "@/hooks/useProperties";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import AuthModal from "@/components/AuthModal";
import BookingModal from "@/components/BookingModal";

interface PropertyDetailsModalProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PropertyDetailsModal = ({ property, open, onOpenChange }: PropertyDetailsModalProps) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  if (!property) return null;

  const isLiked = isInWishlist(property.id);

  const handleWishlistToggle = () => {
    if (!user) {
      setIsAuthModalOpen(true);
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
      setIsAuthModalOpen(true);
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
            {/* Main Image */}
            <div className="relative">
              <img
                src={property.main_image || '/src/assets/hero-villa.jpg'}
                alt={property.title}
                className="w-full h-64 md:h-80 object-cover rounded-lg"
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

            {/* Property Info */}
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
                    <span className="text-3xl font-bold">${property.price_per_night}</span>
                    <span className="text-muted-foreground ml-1">/ night</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium">4.5</span>
                    <span className="text-sm text-muted-foreground">(12 reviews)</span>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal 
        trigger={<></>}
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />

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