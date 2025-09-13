import { useState } from "react";
import { Calendar as CalendarIcon, MapPin, Users, Search } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/useSearch";

interface SearchWidgetProps {
  className?: string;
  onSearchResults?: (results: any[]) => void;
}

const SearchWidget = ({ className, onSearchResults }: SearchWidgetProps) => {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState({
    adults: 2,
    children: 0,
    infants: 0,
  });
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const totalGuests = guests.adults + guests.children + guests.infants;

  const { data: searchResults, isLoading } = useSearch({
    location: hasSearched ? location : undefined,
    checkIn: hasSearched ? checkIn : undefined,
    checkOut: hasSearched ? checkOut : undefined,
    guests: hasSearched ? totalGuests : undefined,
  });

  const handleGuestChange = (type: keyof typeof guests, increment: boolean) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + (increment ? 1 : -1))
    }));
  };

  const handleSearch = () => {
    setHasSearched(true);
    if (onSearchResults && searchResults) {
      onSearchResults(searchResults);
    }
  };

  return (
    <div className={cn(
      "bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl",
      className
    )}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Location Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">Where</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <Input
              placeholder="Search destinations"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40"
            />
          </div>
        </div>

        {/* Check-in Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">Check-in</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40",
                  !checkIn && "text-white/60"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkIn ? format(checkIn, "MMM dd") : "Add date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                initialFocus
                disabled={(date) => date < new Date()}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Check-out Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">Check-out</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40",
                  !checkOut && "text-white/60"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkOut ? format(checkOut, "MMM dd") : "Add date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                initialFocus
                disabled={(date) => date < new Date() || (checkIn && date <= checkIn)}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guests Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">Guests</label>
          <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
              >
                <Users className="mr-2 h-4 w-4" />
                {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Adults</div>
                    <div className="text-sm text-muted-foreground">Ages 13+</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleGuestChange('adults', false)}
                      disabled={guests.adults <= 1}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{guests.adults}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleGuestChange('adults', true)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Children</div>
                    <div className="text-sm text-muted-foreground">Ages 2-12</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleGuestChange('children', false)}
                      disabled={guests.children <= 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{guests.children}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleGuestChange('children', true)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Infants</div>
                    <div className="text-sm text-muted-foreground">Under 2</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleGuestChange('infants', false)}
                      disabled={guests.infants <= 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{guests.infants}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleGuestChange('infants', true)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search Button */}
      <div className="mt-6">
        <Button 
          onClick={handleSearch}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl"
          size="lg"
          disabled={isLoading}
        >
          <Search className="w-4 h-4 mr-2" />
          {isLoading ? "Searching..." : "Search Properties"}
        </Button>
      </div>
    </div>
  );
};

export default SearchWidget;