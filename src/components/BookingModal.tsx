import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Info, CalendarIcon, Shield, AlertCircle, Loader2, Users, Minus, Plus, CheckCircle, Phone } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import GroupBookingForm from "@/components/booking/GroupBookingForm";
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

  // Group Booking State
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [groupType, setGroupType] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [additionalServices, setAdditionalServices] = useState<string[]>([]);

  const totalGuests = guests.adults + guests.children + guests.infants;
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights * (property.price_per_night || 0);

  const handleGuestChange = (type: keyof typeof guests, increment: boolean) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(type === 'adults' ? 1 : 0, prev[type] + (increment ? 1 : -1))
    }));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !checkIn || !checkOut) return;

    setIsLoading(true);

    try {
      const formattedCheckIn = format(checkIn, 'yyyy-MM-dd');
      const formattedCheckOut = format(checkOut, 'yyyy-MM-dd');

      // Create booking record with awaiting_contact status
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
          payment_status: 'awaiting_contact',
          guest_email: user.primaryEmailAddress?.emailAddress,
          guest_phone: user.primaryPhoneNumber?.phoneNumber,
          guest_name: user.fullName || user.firstName || 'Guest',
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

      // Send notification to property owner
      try {
        await supabase.functions.invoke('notify-owner-booking-request', {
          body: { booking_id: booking.id }
        });
      } catch (notifyError) {
        console.error('Failed to send owner notification:', notifyError);
        // Don't fail the booking if notification fails
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['property-availability', property.id] });
      queryClient.invalidateQueries({ queryKey: ['availability', property.id] });
      
      // Show success state
      setIsSuccess(true);
      
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

  // Success State
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="text-center py-8 space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Booking Request Sent!</h2>
              <p className="text-muted-foreground">
                Your request has been sent to the property owner. They will contact you within 24 hours to discuss pricing and arrange payment.
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg text-left space-y-2">
              <h3 className="font-semibold">Request Summary</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Property:</span> {property.title}</p>
                <p><span className="text-muted-foreground">Dates:</span> {checkIn && format(checkIn, "MMM dd, yyyy")} - {checkOut && format(checkOut, "MMM dd, yyyy")}</p>
                <p><span className="text-muted-foreground">Guests:</span> {totalGuests}</p>
                <p><span className="text-muted-foreground">Estimated Price:</span> KES {totalPrice.toLocaleString()}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Final price may vary after discussion with the owner
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>The owner will call or email you soon</span>
            </div>
            
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request to Book {property.title}</DialogTitle>
          <DialogDescription>
            Fill in your details and the property owner will contact you to arrange payment.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmitRequest} className="space-y-6">
          {/* No Payment Notice */}
          <Alert className="border-green-500/20 bg-green-500/10">
            <Info className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-700 dark:text-green-300">
              <strong className="font-semibold">No payment required now!</strong>{" "}
              After you submit this request, the property owner will contact you to discuss pricing and arrange payment. You will not be charged through this website.
            </AlertDescription>
          </Alert>

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

          {/* Price Estimate */}
          {checkIn && checkOut && (
            <div className="bg-muted/50 p-6 rounded-xl space-y-3 border border-border">
              <div className="flex justify-between text-base">
                <span>KES {property.price_per_night?.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}</span>
                <span className="font-semibold">KES {totalPrice.toLocaleString()}</span>
              </div>
              
              <div className="border-t border-border pt-3 flex justify-between text-lg font-bold">
                <span>Estimated Total</span>
                <span className="text-primary">KES {totalPrice.toLocaleString()}</span>
              </div>
              
              <p className="text-xs text-muted-foreground">
                * Final price may vary after discussion with the property owner
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
            disabled={!checkIn || !checkOut || (totalGuests > property.guests && !accommodationExplanation) || !acceptedTerms || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending Request...
              </>
            ) : (
              "Submit Booking Request"
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            You will not be charged. The property owner will contact you to discuss and arrange payment.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
