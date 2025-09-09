import { Heart, MapPin, Star, Users, Wifi, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  guests: number;
  image: string;
  category: "airbnb" | "villa" | "homestay";
  amenities: string[];
  isLiked?: boolean;
}

const PropertyCard = ({
  title,
  location,
  price,
  rating,
  reviews,
  guests,
  image,
  category,
  amenities,
  isLiked = false,
}: PropertyCardProps) => {
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
    <div className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 hover:scale-[1.02]">
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Overlay Elements */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <Badge className={categoryColors[category]}>
            {categoryLabels[category]}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
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
            {title}
          </h3>
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {location}
          </div>
        </div>

        {/* Amenities & Guests */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-1" />
              {guests} guests
            </div>
            {amenities.includes("wifi") && (
              <Wifi className="w-4 h-4 text-muted-foreground" />
            )}
            {amenities.includes("parking") && (
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
            variant="luxury" 
            size="sm"
            className="group"
          >
            Book Now
            <div className="w-0 group-hover:w-4 overflow-hidden transition-all duration-300">
              <Star className="w-4 h-4 ml-2" />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;