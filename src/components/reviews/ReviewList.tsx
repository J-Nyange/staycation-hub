import React from 'react';
import { useReviews } from '@/hooks/useReviews';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewListProps {
  propertyId: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({ propertyId }) => {
  const { data: reviews, isLoading, error } = useReviews(propertyId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Reviews</h3>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading reviews: {error.message}</div>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="py-4">
        <h3 className="text-lg font-semibold mb-2">Reviews</h3>
        <p className="text-muted-foreground">No reviews yet. Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-4">Reviews ({reviews.length})</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={review.profiles?.avatar_url || ''} />
                    <AvatarFallback>
                      {review.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{review.profiles?.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-1">{review.rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {review.comment ? (
                <p className="text-sm">{review.comment}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No comment provided</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};