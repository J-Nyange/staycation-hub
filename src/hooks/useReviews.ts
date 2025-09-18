import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
  id: string;
  user_id: string;
  property_id: string;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  // Join with profiles
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export const useReviews = (propertyId: string) => {
  return useQuery({
    queryKey: ['reviews', propertyId],
    queryFn: async () => {
      // First get the reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        throw reviewsError;
      }

      // Then fetch user profiles for these reviews
      const reviews = [...reviewsData];
      
      // Get unique user IDs from reviews
      const userIds = [...new Set(reviews.map(review => review.user_id))];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', userIds);
        
        if (profilesError) {
          throw profilesError;
        }
        
        // Create a map of user_id to profile data
        const profileMap = new Map();
        profilesData.forEach(profile => {
          profileMap.set(profile.user_id, {
            full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            avatar_url: profile.avatar_url
          });
        });
        
        // Add profile data to each review
        reviews.forEach(review => {
          review.profiles = profileMap.get(review.user_id) || { 
            full_name: 'Anonymous User', 
            avatar_url: null 
          };
        });
      }

      return reviews as Review[];
    },
  });
};

export const useAddReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      propertyId, 
      rating, 
      comment 
    }: { 
      propertyId: string; 
      rating: number; 
      comment: string;
    }) => {
      if (!user) {
        throw new Error('You must be logged in to leave a review');
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          property_id: propertyId,
          rating,
          comment,
        })
        .select();

      if (error) {
        throw error;
      }

      return data[0] as Review;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      reviewId, 
      propertyId 
    }: { 
      reviewId: string; 
      propertyId: string;
    }) => {
      if (!user) {
        throw new Error('You must be logged in to delete a review');
      }

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return { reviewId, propertyId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};

export const usePropertyRating = (propertyId: string) => {
  return useQuery({
    queryKey: ['property-rating', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('property_id', propertyId);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return { rating: 0, count: 0 };
      }

      const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / data.length;

      return {
        rating: parseFloat(averageRating.toFixed(1)),
        count: data.length
      };
    },
  });
};