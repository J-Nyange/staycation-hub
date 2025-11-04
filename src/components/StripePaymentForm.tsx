import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface StripePaymentFormProps {
  onSuccess: () => void;
  totalPrice: number;
}

export default function StripePaymentForm({ onSuccess, totalPrice }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation`,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: error.message,
        });
      } else {
        onSuccess();
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between font-semibold text-lg">
          <span>Total Amount</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isProcessing ? 'Processing Payment...' : `Pay $${totalPrice.toFixed(2)}`}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your payment is secure and encrypted. We never store your card details.
      </p>
    </form>
  );
}
