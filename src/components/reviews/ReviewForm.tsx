import React, { useState } from 'react';
import { useAddReview } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  propertyId: string;
  onSuccess?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ propertyId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const { mutate: addReview, isPending } = useAddReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to leave a review',
        variant: 'destructive',
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating before submitting',
        variant: 'destructive',
      });
      return;
    }

    addReview(
      { propertyId, rating, comment },
      {
        onSuccess: () => {
          toast({
            title: 'Review submitted',
            description: 'Thank you for your feedback!',
          });
          setRating(0);
          setComment('');
          if (onSuccess) onSuccess();
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to submit review',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!user) {
    return (
      <div className="p-4 bg-muted/50 rounded-md">
        <p className="text-sm text-center">Please sign in to leave a review</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Write a Review</h3>
      
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
        </span>
      </div>

      <Textarea
        placeholder="Share your experience with this property (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[100px]"
      />

      <Button type="submit" disabled={isPending || rating === 0}>
        {isPending ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
};