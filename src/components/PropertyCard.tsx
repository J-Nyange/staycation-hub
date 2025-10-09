import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Star, Users, Wifi, Car, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { usePropertyAvailability } from "@/hooks/useAvailability";
import AuthModal from "@/components/AuthModal";
import ImageCarousel from "@/components/ImageCarousel";

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  guests: number;
  category: "airbnb" | "villa" | "homestay";
  amenities: string[];
  
  // Support both old static format and new database format
  price?: number;
  price_per_night?: number;
  image?: string;
  main_image?: string;
  rating?: number;
  reviews?: number;
  
  // Optional database fields
  description?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const PropertyCard = (property: PropertyCardProps) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { data: availability } = usePropertyAvailability(property.id);

  // Use database properties with fallbacks for compatibility
  const price = property.price || property.price_per_night;
  const images = property.images && property.images.length > 0 
    ? property.images 
    : [property.image || property.main_image || '/src/assets/hero-villa.jpg'];
  const rating = property.rating || 0;
  const reviews = property.reviews || 0;
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

  const handleDetailsClick = () => {
    navigate(`/property/${property.id}`);
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
      <div className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:scale-[1.02]">
        {/* Image Container */}
        <div className="relative overflow-hidden">
          <ImageCarousel
            images={images}
            alt={property.title}
            className="h-64"
          />
          
          {/* Overlay Elements */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex space-x-2">
              <Badge className={categoryColors[property.category]}>
                {categoryLabels[property.category]}
              </Badge>
              <Badge 
                className={
                  availability?.isGenerallyAvailable 
                    ? "bg-green-100 text-green-800 border-green-200" 
                    : "bg-red-100 text-red-800 border-red-200"
                }
              >
                {availability?.isGenerallyAvailable ? "Available" : "Unavailable"}
              </Badge>
            </div>
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

          {/* Rating Badge */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{rating}</span>
              <span className="text-xs text-muted-foreground">({reviews})</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {property.location}
            </div>
          </div>

          {/* Amenities & Guests */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="w-4 h-4 mr-1" />
                {property.guests} guests
              </div>
              {property.amenities.includes("wifi") && (
                <Wifi className="w-4 h-4 text-muted-foreground" />
              )}
              {property.amenities.includes("parking") && (
                <Car className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">${price}</span>
              <span className="text-muted-foreground text-sm ml-1">/ night</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="group"
              onClick={handleDetailsClick}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        trigger={<></>}
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />
    </>
  );
};

export default PropertyCard;