import { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PaystackPaymentFormProps {
  onSuccess: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  totalPrice: number;
  email: string;
  bookingId: string;
}

export default function PaystackPaymentForm({ 
  onSuccess, 
  onStart,
  onEnd,
  totalPrice, 
  email, 
  bookingId 
}: PaystackPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Convert to kobo (Paystack uses minor currency units)
  const amountInKobo = Math.round(totalPrice * 100);
  
  // Use useState to ensure reference is only generated once when component mounts
  // This prevents the Paystack popup from freezing/reloading on re-renders
  const [reference] = useState(() => `booking_${bookingId}_${Date.now()}`);

  const config = {
    reference,
    email,
    amount: amountInKobo,
    publicKey: "pk_test_fb1b2723d272883f87a48317d0314621be890bf4",
    currency: 'KES', // Kenyan Shillings - change to NGN for Nigerian Naira
  };

  const onPaystackSuccess = async (response: { reference: string }) => {
    setIsProcessing(true);
    if (onEnd) onEnd(); // Restore modal visibility
    try {
      // Verify payment on backend
      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: {
          reference: response.reference,
          booking_id: bookingId,
        },
      });

      if (error) throw error;

      if (data?.verified) {
        toast({
          title: "Payment Successful! 🎉",
          description: "Your booking is confirmed.",
        });
        onSuccess();
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Payment Verification Failed",
        description: err.message || "Please contact support if you were charged.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onPaystackClose = () => {
    if (onEnd) onEnd(); // Restore modal visibility
    toast({
      variant: "destructive",
      title: "Payment Cancelled",
      description: "You closed the payment window.",
    });
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    if (!config.publicKey) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Paystack is not configured. Please contact support.",
      });
      return;
    }
    
    try {
      if (onStart) onStart(); // Hide modal
      
      // The initializePayment function opens a Paystack popup
      initializePayment({ 
        onSuccess: onPaystackSuccess, 
        onClose: onPaystackClose 
      });
    } catch (error: any) {
      console.error('Paystack initialization error:', error);
      if (onEnd) onEnd(); // Restore on error
      
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to initialize payment. Please try again or check if popups are blocked.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between font-semibold text-lg">
          <span>Total Amount</span>
          <span>KES {totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Secured by Paystack</span>
        </div>

        <Button
          onClick={handlePayment}
          className="w-full"
          disabled={isProcessing}
          size="lg"
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isProcessing ? 'Verifying Payment...' : `Pay KES ${totalPrice.toLocaleString()}`}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your payment is secure and encrypted. You'll be redirected to Paystack to complete payment.
      </p>
    </div>
  );
}
