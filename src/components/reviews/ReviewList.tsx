import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, BadgeCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewListProps {
  propertyId: string;
}

export default function ReviewList({ propertyId }: ReviewListProps) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch profile data separately
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', review.user_id)
            .single();
          return { ...review, profiles: profile };
        })
      );
      
      return reviewsWithProfiles;
    },
  });

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)}</div>;
  }

  if (!reviews || reviews.length === 0) {
    return <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">No reviews yet.</p></CardContent></Card>;
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
        <div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-3">
                  <Avatar><AvatarFallback>{review.profiles?.first_name?.[0] || 'U'}</AvatarFallback></Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{review.profiles?.first_name || 'Anonymous'}</p>
                      {review.is_verified && <BadgeCheck className="h-4 w-4 text-green-600" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              {review.comment && <p className="text-sm">{review.comment}</p>}
              {review.review_response && (
                <div className="bg-muted p-3 rounded-lg mt-3">
                  <p className="font-semibold text-sm mb-1">Property owner response:</p>
                  <p className="text-sm">{review.review_response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
