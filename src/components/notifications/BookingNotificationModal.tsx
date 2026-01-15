import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Mail, 
  Phone, 
  FileText,
  X,
  MessageSquare,
  CheckCircle,
  XCircle,
  Utensils,
  Accessibility
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface BookingData {
  id: string;
  property_title: string;
  property_location: string;
  property_image: string;
  property_description?: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  special_requests?: string;
  accommodation_explanation?: string;
  status: string;
  payment_status: string;
  // Group booking fields
  is_group_booking?: boolean;
  group_type?: string;
  dietary_requirements?: string;
  accessibility_needs?: string;
  additional_services?: string[];
}

interface BookingNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingData?: BookingData;
  isLoading?: boolean;
}

const formatDate = (dateString: string) => {
  if (!dateString || typeof dateString !== 'string') return 'Invalid date';
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (!year || !month || !day || month < 1 || month > 12) return 'Invalid date';
  
  return `${monthNames[month - 1]} ${String(day).padStart(2, '0')}, ${year}`;
};

// Helper to parse accommodation explanation and special requests from combined field
const parseRequestsField = (requestsField: string | undefined | null) => {
  if (!requestsField) return { accommodation: null, special: null };
  
  const accommodationMatch = requestsField.match(/^\[ACCOMMODATION REQUIREMENT\]\n([\s\S]*?)(?:\n\n(.+))?$/);
  
  if (accommodationMatch) {
    return {
      accommodation: accommodationMatch[1],
      special: accommodationMatch[2] || null
    };
  }
  
  return { accommodation: null, special: requestsField };
};

const getPaymentStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    'awaiting_contact': { label: 'Awaiting Contact', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    'pending': { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    'paid': { label: 'Paid', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    'paid_offline': { label: 'Paid Offline', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    'completed': { label: 'Completed', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  };
  
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return <Badge className={config.className}>{config.label}</Badge>;
};

export default function BookingNotificationModal({
  open,
  onOpenChange,
  bookingData,
  isLoading = false,
}: BookingNotificationModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const nights = bookingData
    ? new Date(bookingData.check_out).getTime() -
      new Date(bookingData.check_in).getTime()
    : 0;
  const daysCount = Math.ceil(nights / (1000 * 60 * 60 * 24));

  const handleConfirmBooking = async () => {
    if (!bookingData) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          payment_status: 'paid_offline'
        })
        .eq('id', bookingData.id);

      if (error) throw error;

      toast({
        title: "Booking Confirmed",
        description: "The booking has been confirmed successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeclineBooking = async () => {
    if (!bookingData) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          payment_status: 'cancelled'
        })
        .eq('id', bookingData.id);

      if (error) throw error;

      toast({
        title: "Booking Declined",
        description: "The booking request has been declined.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMessageGuest = () => {
    onOpenChange(false);
    navigate('/messages');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Booking Request Details</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !bookingData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">Booking details not found.</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Property Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {bookingData.property_image && (
                    <img
                      src={bookingData.property_image}
                      alt={bookingData.property_title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {bookingData.property_title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                      <MapPin className="h-4 w-4" />
                      {bookingData.property_location}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{bookingData.status}</Badge>
                      {getPaymentStatusBadge(bookingData.payment_status)}
                      {bookingData.is_group_booking && (
                        <Badge variant="secondary">Group Booking</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Information with Contact Actions */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Guest Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{bookingData.guest_name}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </p>
                      <a 
                        href={`mailto:${bookingData.guest_email}`}
                        className="font-medium text-sm text-primary hover:underline break-all"
                      >
                        {bookingData.guest_email}
                      </a>
                    </div>
                    {bookingData.guest_phone && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          Phone
                        </p>
                        <a 
                          href={`tel:${bookingData.guest_phone}`}
                          className="font-medium text-sm text-primary hover:underline"
                        >
                          {bookingData.guest_phone}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Contact Actions */}
                  <div className="flex gap-2 pt-2">
                    {bookingData.guest_phone && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <a href={`tel:${bookingData.guest_phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call Guest
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <a href={`mailto:${bookingData.guest_email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email Guest
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Information */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Booking Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Check-in</p>
                    <p className="font-medium">{formatDate(bookingData.check_in)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Check-out</p>
                    <p className="font-medium">{formatDate(bookingData.check_out)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Number of Nights</p>
                    <p className="font-medium">{daysCount} night{daysCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Guests</p>
                    <p className="font-medium">{bookingData.guests} guest{bookingData.guests !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Group Booking Details */}
            {bookingData.is_group_booking && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Group Booking Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    {bookingData.group_type && (
                      <div>
                        <p className="text-muted-foreground text-xs">Group Type</p>
                        <p className="font-medium capitalize">{bookingData.group_type}</p>
                      </div>
                    )}
                    {bookingData.dietary_requirements && (
                      <div>
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          <Utensils className="h-3 w-3" />
                          Dietary Requirements
                        </p>
                        <p className="font-medium">{bookingData.dietary_requirements}</p>
                      </div>
                    )}
                    {bookingData.accessibility_needs && (
                      <div>
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          <Accessibility className="h-3 w-3" />
                          Accessibility Needs
                        </p>
                        <p className="font-medium">{bookingData.accessibility_needs}</p>
                      </div>
                    )}
                    {bookingData.additional_services && bookingData.additional_services.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs">Additional Services</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {bookingData.additional_services.map((service) => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Information
                </h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>Estimated Total Price</span>
                    <span className="font-semibold">KES {bookingData.total_price.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Status: {bookingData.payment_status === 'awaiting_contact' 
                      ? 'Guest is waiting for you to contact them about payment' 
                      : bookingData.payment_status}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Special Requests and Accommodation Explanation */}
            {bookingData.special_requests && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Information
                  </h4>
                  {(() => {
                    const { accommodation, special } = parseRequestsField(bookingData.special_requests);
                    return (
                      <div className="space-y-4">
                        {accommodation && (
                          <div>
                            <p className="text-sm font-medium mb-2 text-orange-600">
                              Accommodation Explanation
                            </p>
                            <p className="text-sm text-muted-foreground bg-orange-500/10 p-3 rounded border border-orange-500/20">
                              {accommodation}
                            </p>
                          </div>
                        )}
                        {special && (
                          <div>
                            <p className="text-sm font-medium mb-2">Special Requests</p>
                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                              {special}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {bookingData.payment_status === 'awaiting_contact' && (
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={handleConfirmBooking}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleDeclineBooking}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline Request
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleMessageGuest}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Guest
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
