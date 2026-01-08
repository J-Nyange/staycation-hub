import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Info, CreditCard, CalendarIcon, Shield, AlertCircle, Loader2, Users, Minus, Plus, Clock } from "lucide-react";
import { format, differenceInDays, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";
import PaystackPaymentForm from "@/components/PaystackPaymentForm";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";
import PaymentTypeSelector from "@/components/booking/PaymentTypeSelector";
import GroupBookingForm from "@/components/booking/GroupBookingForm";
import { Property } from "@/hooks/useProperties";

// Initialize Stripe
const stripePromise = loadStripe("pk_test_51N7jPrF6g21qrmupA6EPcdNQT4MJgZ7CZ06DmZBG53E1qPiomYCTFetpwARwbhIWp5AoboY4hAYT0SSx8mR5boPr00QIZnyoOl");

const BOOKING_TIMEOUT_MINUTES = 15;

interface BookingModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BookingModal({ property, open, onOpenChange }: BookingModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<'details' | 'payment'>('details');
  const [hideContent, setHideContent] = useState(false);
  
  // Form State
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState({
    adults: 2,
    children: 0,
    infants: 0,
  });
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");
  const [accommodationExplanation, setAccommodationExplanation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paystack'>('stripe');
  const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full');
  const [clientSecret, setClientSecret] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(BOOKING_TIMEOUT_MINUTES * 60);

  // Group Booking State
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [groupType, setGroupType] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);

  const totalGuests = guests.adults + guests.children + guests.infants;
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights * (property.price_per_night || 0);

  // Deposit calculations
  const depositPercentage = (property as any).deposit_percentage || 30;
  const depositAmount = Math.round(totalPrice * (depositPercentage / 100));
  const balanceAmount = totalPrice - depositAmount;
  const amountToPay = paymentType === 'deposit' ? depositAmount : totalPrice;
  
  // Balance due date (7 days before check-in, or today if within 7 days)
  const balanceDueDate = checkIn ? (() => {
    const dueDate = new Date(checkIn);
    dueDate.setDate(dueDate.getDate() - 7);
    const today = new Date();
    return dueDate > today ? dueDate : today;
  })() : null;

  // Countdown timer effect
  useEffect(() => {
    if (!expiresAt || currentTab !== 'payment') return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        toast({
          variant: "destructive",
          title: "Booking Expired",
          description: "Your booking session has expired. Please try again.",
        });
        onOpenChange(false);
        resetForm();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, currentTab, onOpenChange, toast]);

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGuestChange = (type: keyof typeof guests, increment: boolean) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(type === 'adults' ? 1 : 0, prev[type] + (increment ? 1 : -1))
    }));
  };

  const handleBookingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !checkIn || !checkOut) return;

    setIsLoading(true);

    try {
      // Calculate expiration time (15 minutes from now)
      const expirationTime = addMinutes(new Date(), BOOKING_TIMEOUT_MINUTES);

      // Create booking record with expires_at
      // Use format from date-fns to ensure local date string (avoid UTC shift from toISOString)
      const formattedCheckIn = format(checkIn, 'yyyy-MM-dd');
      const formattedCheckOut = format(checkOut, 'yyyy-MM-dd');

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          property_id: property.id,
          check_in: formattedCheckIn,
          check_out: formattedCheckOut,
          guests: totalGuests,
          total_price: totalPrice,
          special_requests: [
            accommodationExplanation ? `[ACCOMMODATION REQUIREMENT]\n${accommodationExplanation}` : null,
            specialRequests
          ].filter(Boolean).join('\n\n') || null,
          status: 'pending',
          payment_status: 'pending',
          expires_at: expirationTime.toISOString(),
          guest_email: user.primaryEmailAddress?.emailAddress,
          guest_phone: user.primaryPhoneNumber?.phoneNumber,
          // Payment type fields
          payment_type: paymentType,
          deposit_amount: paymentType === 'deposit' ? depositAmount : null,
          deposit_percentage: paymentType === 'deposit' ? depositPercentage : null,
          balance_amount: paymentType === 'deposit' ? balanceAmount : null,
          balance_due_date: paymentType === 'deposit' && balanceDueDate 
            ? format(balanceDueDate, 'yyyy-MM-dd') 
            : null,
          // Group booking fields
          is_group_booking: isGroupBooking,
          group_size: isGroupBooking ? totalGuests : null,
          group_type: isGroupBooking ? groupType : null,
          dietary_requirements: isGroupBooking ? dietaryRequirements : null,
          accessibility_needs: isGroupBooking ? accessibilityNeeds : null,
          additional_services: isGroupBooking && additionalServices.length > 0 
            ? additionalServices 
            : null,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      setBookingId(booking.id);
      setExpiresAt(expirationTime);
      setTimeRemaining(BOOKING_TIMEOUT_MINUTES * 60);

      if (paymentMethod === 'stripe') {
        // Create payment intent for Stripe
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          'create-payment-intent',
          {
            body: {
              property_id: property.id,
              check_in: formattedCheckIn,
              check_out: formattedCheckOut,
              guests: totalGuests,
              total_price: amountToPay,
              special_requests: specialRequests || null,
              booking_id: booking.id,
              payment_type: paymentType,
            },
          }
        );

        if (paymentError) throw paymentError;
        setClientSecret(paymentData.clientSecret);
      }

      setCurrentTab('payment');

      toast({
        title: "Booking Details Saved",
        description: `Please complete payment within ${BOOKING_TIMEOUT_MINUTES} minutes to confirm your booking.`,
      });
      
      // Invalidate availability immediately so calendar updates (even if pending)
      queryClient.invalidateQueries({ queryKey: ['property-availability', property.id] });
      queryClient.invalidateQueries({ queryKey: ['availability', property.id] });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful! 🎉",
      description: "Your booking is confirmed. Check your email for details.",
    });
    // Final invalidation to ensure everything is synced
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['property-availability', property.id] });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuests({ adults: 2, children: 0, infants: 0 });
    setSpecialRequests('');
    setAccommodationExplanation('');
    setCurrentTab('details');
    setBookingId('');
    setClientSecret('');
    setAcceptedTerms(false);
    setPaymentMethod('stripe');
    setPaymentType('full');
    setExpiresAt(null);
    setTimeRemaining(BOOKING_TIMEOUT_MINUTES * 60);
    setHideContent(false);
    // Reset group booking
    setIsGroupBooking(false);
    setGroupType('');
    setDietaryRequirements('');
    setAccessibilityNeeds('');
    setAdditionalServices([]);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open && !hideContent} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Book {property.title}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" disabled={currentTab === 'payment'}>
              <Info className="mr-2 h-4 w-4" />
              Booking Details
            </TabsTrigger>
            <TabsTrigger value="payment" disabled={!bookingId}>
              <CreditCard className="mr-2 h-4 w-4" />
              Payment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-0">
            <form onSubmit={handleBookingDetails} className="space-y-6">
              {/* Date Selection - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Check-in</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 text-base",
                          !checkIn && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {checkIn ? format(checkIn, "MMMM dd, yyyy") : "Select check-in date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={setCheckIn}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Check-out</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 text-base",
                          !checkOut && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {checkOut ? format(checkOut, "MMMM dd, yyyy") : "Select check-out date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={setCheckOut}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today || (checkIn && date <= checkIn);
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Guests Selector */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Guests</Label>
                <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-12 text-base"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      {totalGuests} guest{totalGuests !== 1 ? 's' : ''} 
                      {guests.adults > 0 && ` (${guests.adults} adult${guests.adults !== 1 ? 's' : ''}${guests.children > 0 ? `, ${guests.children} child${guests.children !== 1 ? 'ren' : ''}` : ''}${guests.infants > 0 ? `, ${guests.infants} infant${guests.infants !== 1 ? 's' : ''}` : ''})`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-6 z-50 pointer-events-auto" align="start">
                    <div className="space-y-6">
                      {/* Adults */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-base">Adults</div>
                          <div className="text-sm text-muted-foreground">Ages 13+</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            onClick={() => handleGuestChange('adults', false)}
                            disabled={guests.adults <= 1}
                            type="button"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center font-semibold text-base">{guests.adults}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            onClick={() => handleGuestChange('adults', true)}
                            disabled={totalGuests >= property.guests}
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-base">Children</div>
                          <div className="text-sm text-muted-foreground">Ages 2-12</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            onClick={() => handleGuestChange('children', false)}
                            disabled={guests.children <= 0}
                            type="button"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center font-semibold text-base">{guests.children}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            onClick={() => handleGuestChange('children', true)}
                            disabled={totalGuests >= property.guests}
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Infants */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-base">Infants</div>
                          <div className="text-sm text-muted-foreground">Under 2</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            onClick={() => handleGuestChange('infants', false)}
                            disabled={guests.infants <= 0}
                            type="button"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center font-semibold text-base">{guests.infants}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            onClick={() => handleGuestChange('infants', true)}
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {totalGuests > property.guests && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This property accommodates up to {property.guests} guests. Please provide an explanation for the additional guests.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Group Booking Options */}
              <GroupBookingForm
                isGroupBooking={isGroupBooking}
                onGroupBookingChange={setIsGroupBooking}
                groupType={groupType}
                onGroupTypeChange={setGroupType}
                dietaryRequirements={dietaryRequirements}
                onDietaryChange={setDietaryRequirements}
                accessibilityNeeds={accessibilityNeeds}
                onAccessibilityChange={setAccessibilityNeeds}
                additionalServices={additionalServices}
                onServicesChange={setAdditionalServices}
                totalGuests={totalGuests}
              />

              {/* Accommodation Explanation - Only show if guests exceed capacity */}
              {totalGuests > property.guests && (
                <div className="space-y-2">
                  <Label htmlFor="accommodation-explanation" className="text-base font-semibold text-destructive">
                    Accommodation Explanation (Required)
                  </Label>
                  <Textarea
                    id="accommodation-explanation"
                    placeholder="Please explain how the additional guests will be accommodated. This helps the property owner understand your requirements..."
                    value={accommodationExplanation}
                    onChange={(e) => setAccommodationExplanation(e.target.value)}
                    className="min-h-[80px] border-destructive/20"
                  />
                  <p className="text-xs text-muted-foreground">This property can accommodate {property.guests} guests, but you have selected {totalGuests} guests.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="special-requests" className="text-base font-semibold">Special Requests (Optional)</Label>
                <Textarea
                  id="special-requests"
                  placeholder="Any special requirements or requests..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Payment Type Selection (Full vs Deposit) */}
              {checkIn && checkOut && nights > 0 && (
                <PaymentTypeSelector
                  value={paymentType}
                  onChange={setPaymentType}
                  depositPercentage={depositPercentage}
                  totalPrice={totalPrice}
                  checkInDate={checkIn}
                />
              )}

              {/* Payment Method Selection */}
              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

              {checkIn && checkOut && (
                <div className="bg-muted/50 p-6 rounded-xl space-y-3 border border-border">
                  <div className="flex justify-between text-base">
                    <span>KES {property.price_per_night?.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}</span>
                    <span className="font-semibold">KES {totalPrice.toLocaleString()}</span>
                  </div>
                  
                  {paymentType === 'deposit' && (
                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Deposit ({depositPercentage}%)</span>
                        <span className="font-semibold text-primary">KES {depositAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Balance due later</span>
                        <span>KES {balanceAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-border pt-3 flex justify-between text-lg font-bold">
                    <span>{paymentType === 'deposit' ? 'Due Today' : 'Total'}</span>
                    <span className="text-primary">KES {amountToPay.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {property.cancellation_policy && (
                <Alert className="border-primary/20">
                  <Shield className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    <strong className="font-semibold">Cancellation Policy: </strong>
                    {property.cancellation_policy === 'flexible' && (
                      <span>Full refund if canceled 24 hours before check-in. Cancel within 24 hours for 50% refund.</span>
                    )}
                    {property.cancellation_policy === 'moderate' && (
                      <span>Full refund if canceled 7 days before check-in. Cancel within 7 days for 50% refund.</span>
                    )}
                    {property.cancellation_policy === 'strict' && (
                      <span>50% refund if canceled 7 days before check-in. No refund within 7 days.</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Payment Timeout Notice */}
              <Alert className="border-yellow-500/20 bg-yellow-500/10">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm text-yellow-700">
                  <strong className="font-semibold">Important: </strong>
                  You will have {BOOKING_TIMEOUT_MINUTES} minutes to complete payment after submitting your booking details. 
                  If payment is not completed, the booking will be automatically cancelled.
                </AlertDescription>
              </Alert>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I agree to the{" "}
                  <Link to="/terms-of-service" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  , and understand the cancellation policy.
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={!checkIn || !checkOut || (totalGuests > property.guests && !accommodationExplanation) || !acceptedTerms || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            {/* Countdown Timer */}
            {expiresAt && (
              <Alert className={cn(
                "border-2",
                timeRemaining <= 60 
                  ? "border-red-500 bg-red-500/10" 
                  : timeRemaining <= 300 
                    ? "border-yellow-500 bg-yellow-500/10" 
                    : "border-primary/20 bg-primary/5"
              )}>
                <Clock className={cn(
                  "h-5 w-5",
                  timeRemaining <= 60 
                    ? "text-red-500" 
                    : timeRemaining <= 300 
                      ? "text-yellow-600" 
                      : "text-primary"
                )} />
                <AlertDescription className="text-base">
                  <strong className="font-semibold">Time remaining to complete payment: </strong>
                  <span className={cn(
                    "font-mono text-lg font-bold ml-2",
                    timeRemaining <= 60 
                      ? "text-red-500" 
                      : timeRemaining <= 300 
                        ? "text-yellow-600" 
                        : "text-primary"
                  )}>
                    {formatTimeRemaining(timeRemaining)}
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {paymentMethod === 'stripe' && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm
                  totalPrice={amountToPay}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            )}

            {paymentMethod === 'paystack' && bookingId && user?.primaryEmailAddress?.emailAddress && (
              <PaystackPaymentForm
                bookingId={bookingId}
                totalPrice={amountToPay}
                email={user.primaryEmailAddress.emailAddress}
                onSuccess={handlePaymentSuccess}
                onStart={() => setHideContent(true)}
                onEnd={() => setHideContent(false)}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}