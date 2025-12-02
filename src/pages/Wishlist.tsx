import { useWishlist } from '@/hooks/useWishlist';
import { useUser } from "@clerk/clerk-react";
import PropertyCard from '@/components/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Wishlist = () => {
  const { user } = useUser();
  const { wishlistItems, isLoading } = useWishlist();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Your Wishlist</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to save properties to your wishlist and access them anytime.
          </p>
          <Link to="/">
            <Button>
              Browse Properties
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Skeleton className="w-8 h-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Your Wishlist</h1>
          <span className="text-muted-foreground">({wishlistItems.length} properties)</span>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-4">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start exploring and save your favorite properties. Click the heart icon on any property to add it to your wishlist.
            </p>
            <Link to="/">
              <Button className="gap-2">
                <Home className="w-4 h-4" />
                Browse Properties
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item: any) => (
              <PropertyCard
                key={item.id}
                id={item.properties.id}
                title={item.properties.title}
                location={item.properties.location}
                price_per_night={item.properties.price_per_night}
                main_image={item.properties.main_image}
                category={item.properties.category}
                guests={0}
                amenities={[]}
                rating={4.5}
                reviews={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;