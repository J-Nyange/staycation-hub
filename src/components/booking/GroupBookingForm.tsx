import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Utensils, Accessibility, Sparkles } from "lucide-react";

interface GroupBookingFormProps {
  isGroupBooking: boolean;
  onGroupBookingChange: (value: boolean) => void;
  groupType: string;
  onGroupTypeChange: (value: string) => void;
  dietaryRequirements: string;
  onDietaryChange: (value: string) => void;
  accessibilityNeeds: string;
  onAccessibilityChange: (value: string) => void;
  additionalServices: string[];
  onServicesChange: (services: string[]) => void;
  totalGuests: number;
}

const GROUP_TYPES = [
  { value: 'family', label: 'Family Reunion' },
  { value: 'corporate', label: 'Corporate Retreat' },
  { value: 'wedding', label: 'Wedding Party' },
  { value: 'retreat', label: 'Wellness Retreat' },
  { value: 'celebration', label: 'Birthday/Anniversary' },
  { value: 'other', label: 'Other' },
];

const ADDITIONAL_SERVICES = [
  { id: 'catering', label: 'Catering Services', icon: Utensils },
  { id: 'transport', label: 'Airport Transfer', icon: Users },
  { id: 'activities', label: 'Guided Activities', icon: Sparkles },
  { id: 'chef', label: 'Private Chef', icon: Utensils },
];

export default function GroupBookingForm({
  isGroupBooking,
  onGroupBookingChange,
  groupType,
  onGroupTypeChange,
  dietaryRequirements,
  onDietaryChange,
  accessibilityNeeds,
  onAccessibilityChange,
  additionalServices,
  onServicesChange,
  totalGuests,
}: GroupBookingFormProps) {
  const handleServiceToggle = (serviceId: string) => {
    if (additionalServices.includes(serviceId)) {
      onServicesChange(additionalServices.filter(s => s !== serviceId));
    } else {
      onServicesChange([...additionalServices, serviceId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Group Booking Toggle */}
      <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg border border-border">
        <Checkbox
          id="group-booking"
          checked={isGroupBooking}
          onCheckedChange={(checked) => onGroupBookingChange(checked as boolean)}
        />
        <div className="flex-1">
          <label htmlFor="group-booking" className="text-sm font-semibold cursor-pointer flex items-center">
            <Users className="h-4 w-4 mr-2 text-primary" />
            This is a group booking ({totalGuests}+ guests)
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Get special rates and add-on services for large groups
          </p>
        </div>
      </div>

      {isGroupBooking && (
        <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2">
          {/* Group Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Type of Group Event</Label>
            <Select value={groupType} onValueChange={onGroupTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {GROUP_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dietary Requirements */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center">
              <Utensils className="h-4 w-4 mr-2" />
              Dietary Requirements
            </Label>
            <Textarea
              placeholder="E.g., 3 vegetarian, 2 vegan, 1 gluten-free..."
              value={dietaryRequirements}
              onChange={(e) => onDietaryChange(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Accessibility Needs */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center">
              <Accessibility className="h-4 w-4 mr-2" />
              Accessibility Requirements
            </Label>
            <Textarea
              placeholder="E.g., wheelchair access, ground floor rooms..."
              value={accessibilityNeeds}
              onChange={(e) => onAccessibilityChange(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Additional Services */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Additional Services (Optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {ADDITIONAL_SERVICES.map(service => (
                <div
                  key={service.id}
                  className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    additionalServices.includes(service.id)
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <Checkbox
                    checked={additionalServices.includes(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                  />
                  <div className="flex items-center">
                    <service.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{service.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
