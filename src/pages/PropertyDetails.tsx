import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Users, Wifi, Car, Star, ArrowLeft, Heart,
  BedDouble, Bath, Home
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { usePropertyAvailability } from "@/hooks/useAvailability";
import BookingModal from "@/components/BookingModal";
import AuthModal from "@/components/AuthModal";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";
import ImageCarousel from "@/components/ImageCarousel";
import { generatePropertySchema, generateBreadcrumbSchema } from "@/lib/structuredData";

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { data: availability } = usePropertyAvailability(id || "");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleWishlistToggle = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (isInWishlist(id || "")) {
      removeFromWishlist(id || "");
    } else {
      addToWishlist(id || "");
    }
  };

  const handleBookNowClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsBookingModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-muted rounded-3xl"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Property not found</h1>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = property.images && property.images.length > 0 
    ? property.images 
    : [property.main_image || '/src/assets/hero-villa.jpg'];

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

  const propertySchema = generatePropertySchema({
    id: property.id,
    title: property.title,
    description: property.description || "",
    image: property.main_image || "",
    pricePerNight: property.price_per_night,
    location: property.location,
    amenities: property.amenities || [],
    latitude: property.latitude || undefined,
    longitude: property.longitude || undefined,
  });

  const breadcrumbSchema = generateBreadcrumbSchema({
    items: [
      { name: "Home", url: "https://villahorizon.com" },
      { name: categoryLabels[property.category as keyof typeof categoryLabels], url: `https://villahorizon.com/${property.category}` },
      { name: property.title, url: `https://villahorizon.com/property/${property.id}` },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${property.title} - ${property.location}`}
        description={property.description || `Book ${property.title} in ${property.location}. ${property.guests} guests, ${property.bedrooms} bedrooms. Starting from KES ${property.price_per_night}/night.`}
        keywords={`${property.location}, ${property.category}, ${property.property_type}, Kenya accommodation, ${property.amenities?.join(", ")}`}
        image={property.main_image || ""}
        url={window.location.href}
      />
      <script type="application/ld+json">
        {JSON.stringify(propertySchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      <Navbar />
      
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Image Gallery */}
        <div className="mb-8">
          <ImageCarousel
            images={images}
            alt={property.title}
            className="h-96 lg:h-[500px] rounded-3xl"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={categoryColors[property.category as keyof typeof categoryColors]}>
                  {categoryLabels[property.category as keyof typeof categoryLabels]}
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
              
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{property.title}</h1>
              
              <div className="flex items-center gap-6 text-muted-foreground mb-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  {property.location}
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4">Property Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Guests</p>
                    <p className="font-semibold">{property.guests}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BedDouble className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="font-semibold">{property.bedrooms || 1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Bath className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-semibold">{property.bathrooms || 1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-semibold capitalize">{property.category}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4">About This Property</h2>
              <div className="prose prose-sm max-w-none">
                {property.description?.split('\n').map((paragraph, index) => (
                  paragraph.trim() && <p key={index} className="mb-3 leading-relaxed">{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities?.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {amenity.toLowerCase() === "wifi" && <Wifi className="w-5 h-5 text-primary" />}
                    {amenity.toLowerCase() === "parking" && <Car className="w-5 h-5 text-primary" />}
                    <span className="capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-6">Guest Reviews</h2>
              <ReviewList propertyId={property.id} />
              {user && (
                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
                  <ReviewForm propertyId={property.id} />
                </div>
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card p-6 rounded-2xl shadow-luxury">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold">${property.price_per_night}</span>
                  <span className="text-muted-foreground">/ night</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  variant="luxury" 
                  className="w-full"
                  size="lg"
                  onClick={handleBookNowClick}
                  disabled={!availability?.isGenerallyAvailable}
                >
                  {availability?.isGenerallyAvailable ? "Book Now" : "Unavailable"}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleWishlistToggle}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isInWishlist(property.id) ? "fill-current text-red-500" : ""}`} />
                  {isInWishlist(property.id) ? "Saved" : "Save to Wishlist"}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground">
                <p className="mb-2">You won't be charged yet</p>
                <p>Free cancellation within 48 hours of booking</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <BookingModal
        property={{
          ...property,
          price: property.price_per_night
        } as any}
        open={isBookingModalOpen}
        onOpenChange={setIsBookingModalOpen}
      />
      
      <AuthModal
        trigger={<></>}
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />
    </div>
  );
};

export default PropertyDetails;
