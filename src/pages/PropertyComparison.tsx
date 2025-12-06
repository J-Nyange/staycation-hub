import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Users, Bed, Bath, Star, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useComparison } from "@/hooks/useComparison";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const PropertyComparison = () => {
  const navigate = useNavigate();
  const { properties, clearComparison, removeFromComparison } = useComparison();

  if (properties.length === 0) {
    return (
      <>
        <SEO
          title="Property Comparison"
          description="Compare multiple properties side by side"
        />
        <Navbar />
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">No Properties to Compare</h1>
            <p className="text-muted-foreground mb-8">
              Add properties to your comparison list to see them side by side
            </p>
            <Button onClick={() => navigate("/")}>
              Browse Properties
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const allAmenities = Array.from(
    new Set(properties.flatMap(p => p.amenities))
  );

  return (
    <>
      <SEO
        title="Compare Properties"
        description={`Comparing ${properties.length} properties side by side`}
      />
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-foreground">
                Compare Properties
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={clearComparison}
            >
              Clear All
            </Button>
          </div>

          {/* Desktop View - Side by Side Cards */}
          <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-12">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={property.main_image || '/placeholder.svg'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromComparison(property.id)}
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{property.title}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.location}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-primary">
                    KES {property.price_per_night}
                    <span className="text-sm text-muted-foreground font-normal">/night</span>
                  </div>
                  {property.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{property.rating.toFixed(1)}</span>
                      {property.reviews && (
                        <span className="text-muted-foreground text-sm">
                          ({property.reviews} reviews)
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {property.guests} guests
                    </div>
                    {property.bedrooms && (
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        {property.bedrooms} beds
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        {property.bathrooms} baths
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/properties/${property.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Comparison</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Feature</TableHead>
                    {properties.map((property) => (
                      <TableHead key={property.id} className="min-w-[200px]">
                        {property.title}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Price per night</TableCell>
                    {properties.map((property) => (
                      <TableCell key={property.id} className="text-primary font-bold">
                        KES {property.price_per_night}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Location</TableCell>
                    {properties.map((property) => (
                      <TableCell key={property.id}>{property.location}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Rating</TableCell>
                    {properties.map((property) => (
                      <TableCell key={property.id}>
                        {property.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {property.rating.toFixed(1)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No rating</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Reviews</TableCell>
                    {properties.map((property) => (
                      <TableCell key={property.id}>
                        {property.reviews || 0} reviews
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Guests</TableCell>
                    {properties.map((property) => (
                      <TableCell key={property.id}>{property.guests}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bedrooms</TableCell>
                    {properties.map((property) => (
                      <TableCell key={property.id}>
                        {property.bedrooms || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bathrooms</TableCell>
                    {properties.map((property) => (
                      <TableCell key={property.id}>
                        {property.bathrooms || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Category</TableCell>
                    {properties.map((property) => (
                      <TableCell key={property.id} className="capitalize">
                        {property.category}
                      </TableCell>
                    ))}
                  </TableRow>
                  {allAmenities.map((amenity) => (
                    <TableRow key={amenity}>
                      <TableCell className="font-medium">{amenity}</TableCell>
                      {properties.map((property) => (
                        <TableCell key={`${property.id}-${amenity}`}>
                          {property.amenities.includes(amenity) ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PropertyComparison;
