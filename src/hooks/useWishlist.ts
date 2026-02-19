import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useWishlist = () => {
  const { user, isLoaded, isSignedIn } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          created_at,
          properties (
            id,
            title,
            location,
            price_per_night,
            main_image,
            category
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching wishlist:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!user && isSignedIn,
  });

  const addToWishlist = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          property_id: propertyId
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({
        title: "Added to Wishlist",
        description: "Property has been saved to your wishlist.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  }).mutate;

  const removeFromWishlist = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({
        title: "Removed from Wishlist",
        description: "Property has been removed from your wishlist.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  }).mutate;

  const isInWishlist = (propertyId: string) => {
    return wishlistItems.some((item: any) => item.properties.id === propertyId);
  };

  return {
    wishlistItems,
    isLoading: isLoading || !isLoaded,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  };
};
