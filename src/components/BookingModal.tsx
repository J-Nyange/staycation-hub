import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Info, CalendarIcon, Shield, AlertCircle, Loader2, Users, Minus, Plus, CheckCircle, Phone, Mail, User, CreditCard, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import GroupBookingForm from "@/components/booking/GroupBookingForm";
import PaystackPaymentForm from "@/components/PaystackPaymentForm";
import { Property } from "@/hooks/useProperties";

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
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Booking mode
  const [bookingMode, setBookingMode] = useState<'pay_now' | 'pay_later'>('pay_now');
  const [paymentStep, setPaymentStep] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [modalHidden, setModalHidden] = useState(false);
  
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

  // Guest Contact Info
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [contactErrors, setContactErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  // Group Booking State
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [groupType, setGroupType] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);

  const totalGuests = guests.adults + guests.children + guests.infants;
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights * (property.price_per_night || 0);
  const discountedPrice = Math.round(totalPrice * 0.95);
  const discountAmount = totalPrice - discountedPrice;
  const finalPrice = bookingMode === 'pay_now' ? discountedPrice : totalPrice;

  const handleGuestChange = (type: keyof typeof guests, increment: boolean) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(type === 'adults' ? 1 : 0, prev[type] + (increment ? 1 : -1))
    }));
  };

  // Pre-populate guest contact info from Clerk
  useEffect(() => {
    if (user) {
      setGuestName(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "");
      setGuestEmail(user.primaryEmailAddress?.emailAddress || "");
      setGuestPhone(user.primaryPhoneNumber?.phoneNumber || "");
    }
  }, [user]);

  const validateContactInfo = (): boolean => {
    const errors: { name?: string; email?: string; phone?: string } = {};
    
    if (!guestName.trim() || guestName.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmail.trim() || !emailRegex.test(guestEmail.trim())) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!guestPhone.trim() || guestPhone.trim().length < 10) {
      errors.phone = "Phone number must be at least 10 characters";
    }
    
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !checkIn || !checkOut) return;

    if (!validateContactInfo()) {
      toast({
        variant: "destructive",
        title: "Missing Contact Information",
        description: "Please fill in all required contact fields.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formattedCheckIn = format(checkIn, 'yyyy-MM-dd');
      const formattedCheckOut = format(checkOut, 'yyyy-MM-dd');

      const isPayNow = bookingMode === 'pay_now';

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          property_id: property.id,
          check_in: formattedCheckIn,
          check_out: formattedCheckOut,
          guests: totalGuests,
          total_price: finalPrice,
          special_requests: [
            accommodationExplanation ? `[ACCOMMODATION REQUIREMENT]\n${accommodationExplanation}` : null,
            specialRequests
          ].filter(Boolean).join('\n\n') || null,
          status: 'pending',
          payment_status: isPayNow ? 'pending' : 'awaiting_contact',
          guest_email: guestEmail.trim(),
          guest_phone: guestPhone.trim(),
          guest_name: guestName.trim(),
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

      // Send notification to property owner
      try {
        await supabase.functions.invoke('notify-owner-booking-request', {
          body: { booking_id: booking.id }
        });
      } catch (_notifyError) {
        // Don't fail the booking if notification fails
      }
      
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['property-availability', property.id] });
      queryClient.invalidateQueries({ queryKey: ['availability', property.id] });
      
      if (isPayNow) {
        setCreatedBookingId(booking.id);
        setPaymentStep(true);
      } else {
        setIsSuccess(true);
      }
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuests({ adults: 2, children: 0, infants: 0 });
    setSpecialRequests('');
    setAccommodationExplanation('');
    setAcceptedTerms(false);
    setIsSuccess(false);
    setBookingMode('pay_now');
    setPaymentStep(false);
    setCreatedBookingId(null);
    setModalHidden(false);
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setContactErrors({});
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

  const handlePaymentSuccess = () => {
    setModalHidden(false);
    setPaymentStep(false);
    setIsSuccess(true);
  };

  // Success State
  if (isSuccess) {
    const isPayNow = bookingMode === 'pay_now';
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="text-center py-8 space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {isPayNow ? "Booking Confirmed!" : "Booking Request Sent!"}
              </h2>
              <p className="text-muted-foreground">
                {isPayNow 
                  ? "Your payment was successful and your booking is confirmed."
                  : "Your request has been sent to the property owner. They will contact you within 24 hours to discuss pricing and arrange payment."
                }
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg text-left space-y-2">
              <h3 className="font-semibold">Request Summary</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Property:</span> {property.title}</p>
                <p><span className="text-muted-foreground">Dates:</span> {checkIn && format(checkIn, "MMM dd, yyyy")} - {checkOut && format(checkOut, "MMM dd, yyyy")}</p>
                <p><span className="text-muted-foreground">Guests:</span> {totalGuests}</p>
                <p>
                  <span className="text-muted-foreground">
                    {isPayNow ? "Amount Paid:" : "Estimated Price:"}
                  </span>{" "}
                  KES {finalPrice.toLocaleString()}
                  {isPayNow && discountAmount > 0 && (
                    <span className="text-green-600 text-xs ml-2">(saved KES {discountAmount.toLocaleString()})</span>
                  )}
                </p>
              </div>
              {!isPayNow && (
                <p className="text-xs text-muted-foreground mt-2">
                  * Final price may vary after discussion with the owner
                </p>
              )}
            </div>
            
            {!isPayNow && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>The owner will call or email you soon</span>
              </div>
            )}
            
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Payment Step (Pay Now with Paystack)
  if (paymentStep && createdBookingId) {
    return (
      <Dialog open={open && !modalHidden} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Complete Payment
            </DialogTitle>
            <DialogDescription>
              Pay securely via Paystack to confirm your booking instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-1">
              <p><span className="text-muted-foreground">Property:</span> {property.title}</p>
              <p><span className="text-muted-foreground">Dates:</span> {checkIn && format(checkIn, "MMM dd")} - {checkOut && format(checkOut, "MMM dd, yyyy")}</p>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                <span className="font-semibold">Total</span>
                <div className="text-right">
                  <span className="line-through text-muted-foreground text-xs mr-2">KES {totalPrice.toLocaleString()}</span>
                  <span className="font-bold text-primary">KES {discountedPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {guestEmail && (
              <PaystackPaymentForm
                bookingId={createdBookingId}
                totalPrice={discountedPrice}
                email={guestEmail}
                onSuccess={handlePaymentSuccess}
                onStart={() => setModalHidden(true)}
                onEnd={() => setModalHidden(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Book {property.title}</DialogTitle>
          <DialogDescription>
            Choose how you'd like to book — pay now for a discount or request to book.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmitRequest} className="space-y-6">
          {/* Booking Mode Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBookingMode('pay_now')}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all",
                bookingMode === 'pay_now'
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Pay Now</span>
              </div>
              <p className="text-xs text-muted-foreground">Instant confirmation</p>
              <span className="absolute top-2 right-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Save 5%
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBookingMode('pay_later')}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                bookingMode === 'pay_later'
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Pay Later</span>
              </div>
              <p className="text-xs text-muted-foreground">Owner contacts you</p>
            </button>
          </div>

          {bookingMode === 'pay_now' && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                <strong className="font-semibold">Save 5% when you pay instantly!</strong>{" "}
                Your booking will be confirmed immediately after payment via Paystack.
              </AlertDescription>
            </Alert>
          )}

          {bookingMode === 'pay_later' && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                <strong className="font-semibold">No payment required now!</strong>{" "}
                The property owner will contact you to discuss pricing and arrange payment.
              </AlertDescription>
            </Alert>
          )}

          {/* Guest Contact Information */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-base">Your Contact Information</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {bookingMode === 'pay_later' 
                ? "The property owner will use this information to contact you about your booking."
                : "We'll send your booking confirmation to this contact info."}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="guest-name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guest-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (contactErrors.name) setContactErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  className={cn(contactErrors.name && "border-destructive")}
                />
                {contactErrors.name && (
                  <p className="text-xs text-destructive">{contactErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={guestEmail}
                  onChange={(e) => {
                    setGuestEmail(e.target.value);
                    if (contactErrors.email) setContactErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={cn(contactErrors.email && "border-destructive")}
                />
                {contactErrors.email && (
                  <p className="text-xs text-destructive">{contactErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guest-phone"
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={guestPhone}
                  onChange={(e) => {
                    setGuestPhone(e.target.value);
                    if (contactErrors.phone) setContactErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  className={cn(contactErrors.phone && "border-destructive")}
                />
                {contactErrors.phone && (
                  <p className="text-xs text-destructive">{contactErrors.phone}</p>
                )}
              </div>
            </div>
          </div>

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
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => handleGuestChange('adults', false)} disabled={guests.adults <= 1} type="button">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-semibold text-base">{guests.adults}</span>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => handleGuestChange('adults', true)} disabled={totalGuests >= property.guests} type="button">
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
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => handleGuestChange('children', false)} disabled={guests.children <= 0} type="button">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-semibold text-base">{guests.children}</span>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => handleGuestChange('children', true)} disabled={totalGuests >= property.guests} type="button">
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
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => handleGuestChange('infants', false)} disabled={guests.infants <= 0} type="button">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-semibold text-base">{guests.infants}</span>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => handleGuestChange('infants', true)} type="button">
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

          {/* Accommodation Explanation */}
          {totalGuests > property.guests && (
            <div className="space-y-2">
              <Label htmlFor="accommodation-explanation" className="text-base font-semibold text-destructive">
                Accommodation Explanation (Required)
              </Label>
              <Textarea
                id="accommodation-explanation"
                placeholder="Please explain how the additional guests will be accommodated..."
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

          {/* Price Estimate */}
          {checkIn && checkOut && (
            <div className="bg-muted/50 p-6 rounded-xl space-y-3 border border-border">
              <div className="flex justify-between text-base">
                <span>KES {property.price_per_night?.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}</span>
                <span className="font-semibold">KES {totalPrice.toLocaleString()}</span>
              </div>
              
              {bookingMode === 'pay_now' && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>5% instant payment discount</span>
                  <span>- KES {discountAmount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="border-t border-border pt-3 flex justify-between text-lg font-bold">
                <span>{bookingMode === 'pay_now' ? 'Total to Pay' : 'Estimated Total'}</span>
                <div className="text-right">
                  {bookingMode === 'pay_now' && discountAmount > 0 && (
                    <span className="line-through text-muted-foreground text-sm mr-2">KES {totalPrice.toLocaleString()}</span>
                  )}
                  <span className="text-primary">KES {finalPrice.toLocaleString()}</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {bookingMode === 'pay_now' 
                  ? "You'll be redirected to Paystack to complete payment securely."
                  : "* Final price may vary after discussion with the property owner"}
              </p>
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
            disabled={!checkIn || !checkOut || !guestName.trim() || !guestEmail.trim() || !guestPhone.trim() || (totalGuests > property.guests && !accommodationExplanation) || !acceptedTerms || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {bookingMode === 'pay_now' ? 'Creating Booking...' : 'Sending Request...'}
              </>
            ) : (
              bookingMode === 'pay_now' ? "Proceed to Payment" : "Submit Booking Request"
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            {bookingMode === 'pay_now'
              ? "You'll pay securely via Paystack. 5% discount applied automatically."
              : "You will not be charged. The property owner will contact you to discuss and arrange payment."}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
