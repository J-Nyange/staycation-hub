import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { SlidersHorizontal, Star } from "lucide-react";
import { Property } from "@/hooks/useProperties";
// Local filtering is now used instead of useAdvancedSearch

export type SortOption = "default" | "price-low-high" | "price-high-low";

export interface FilterOptions {
  priceRange: [number, number];
  guests: number;
  location: string;
  amenities: string[];
  propertyType: string[];
  instantBook: boolean;
  minRating: number;
  bedroomsMin: number;
  bathroomsMin: number;
  sortBy: SortOption;
}

interface FilterSortProps {
  properties: Property[];
  onFilterChange: (filteredProperties: Property[]) => void;
  className?: string;
}

const FilterSort = ({ properties, onFilterChange, className = "" }: FilterSortProps) => {
  // Find min and max prices from properties
  const allPrices = properties.map(p => p.price_per_night);
  const minPrice = Math.min(...allPrices, 50);
  const maxPrice = Math.max(...allPrices, 1000);
  
  // Get all unique locations
  const allLocations = [...new Set(properties.map(p => p.location))];
  
  // Get all unique amenities
  const allAmenities = [...new Set(
    properties.flatMap(p => p.amenities || [])
  )];

  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [minPrice, maxPrice],
    guests: 1,
    location: "",
    amenities: [],
    propertyType: [],
    instantBook: false,
    minRating: 0,
    bedroomsMin: 0,
    bathroomsMin: 0,
    sortBy: "default",
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get all unique property types
  const allPropertyTypes = [...new Set(properties.map(p => p.category))];

  // Apply filters locally to the passed properties instead of fetching from database
  useEffect(() => {
    if (!properties || properties.length === 0) {
      onFilterChange([]);
      return;
    }

    let filteredResults = [...properties];

    // Price range filter
    if (filters.priceRange) {
      filteredResults = filteredResults.filter(p => 
        p.price_per_night >= filters.priceRange[0] && 
        p.price_per_night <= filters.priceRange[1]
      );
    }

    // Guest capacity filter
    if (filters.guests > 1) {
      filteredResults = filteredResults.filter(p => p.guests >= filters.guests);
    }

    // Location filter
    if (filters.location) {
      filteredResults = filteredResults.filter(p => 
        p.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Property type filter
    if (filters.propertyType.length > 0) {
      filteredResults = filteredResults.filter(p => 
        filters.propertyType.includes(p.category)
      );
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      filteredResults = filteredResults.filter(p => 
        filters.amenities.every(amenity => 
          p.amenities && p.amenities.includes(amenity)
        )
      );
    }

    // Instant book filter
    if (filters.instantBook) {
      filteredResults = filteredResults.filter(p => p.instant_book === true);
    }

    // Min rating filter
    if (filters.minRating > 0) {
      filteredResults = filteredResults.filter(p => 
        (p.rating || 0) >= filters.minRating
      );
    }

    // Bedrooms filter
    if (filters.bedroomsMin > 0) {
      filteredResults = filteredResults.filter(p => 
        (p.bedrooms || 0) >= filters.bedroomsMin
      );
    }

    // Bathrooms filter
    if (filters.bathroomsMin > 0) {
      filteredResults = filteredResults.filter(p => 
        (p.bathrooms || 0) >= filters.bathroomsMin
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "price-low-high":
        filteredResults.sort((a, b) => a.price_per_night - b.price_per_night);
        break;
      case "price-high-low":
        filteredResults.sort((a, b) => b.price_per_night - a.price_per_night);
        break;
      default:
        break;
    }
    
    onFilterChange(filteredResults);
  }, [properties, filters, onFilterChange]);

  const handlePriceChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, priceRange: [value[0], value[1]] }));
  };

  const handleGuestsChange = (value: string) => {
    setFilters(prev => ({ ...prev, guests: parseInt(value) }));
  };

  const handleLocationChange = (value: string) => {
    setFilters(prev => ({ ...prev, location: value === "all" ? "" : value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFilters(prev => {
      const updatedAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      
      return { ...prev, amenities: updatedAmenities };
    });
  };

  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value as SortOption }));
  };

  const handlePropertyTypeToggle = (type: string) => {
    setFilters(prev => {
      const updatedTypes = prev.propertyType.includes(type)
        ? prev.propertyType.filter(t => t !== type)
        : [...prev.propertyType, type];
      
      return { ...prev, propertyType: updatedTypes };
    });
  };

  const handleInstantBookToggle = (checked: boolean) => {
    setFilters(prev => ({ ...prev, instantBook: checked }));
  };

  const handleMinRatingChange = (value: string) => {
    setFilters(prev => ({ ...prev, minRating: parseFloat(value) }));
  };

  const handleBedroomsChange = (value: string) => {
    setFilters(prev => ({ ...prev, bedroomsMin: parseInt(value) }));
  };

  const handleBathroomsChange = (value: string) => {
    setFilters(prev => ({ ...prev, bathroomsMin: parseInt(value) }));
  };

  const handleReset = () => {
    setFilters({
      priceRange: [minPrice, maxPrice],
      guests: 1,
      location: "",
      amenities: [],
      propertyType: [],
      instantBook: false,
      minRating: 0,
      bedroomsMin: 0,
      bathroomsMin: 0,
      sortBy: "default",
    });
  };

  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filter & Sort
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter & Sort Properties</SheetTitle>
                <SheetDescription>
                  Customize your search to find the perfect property
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-6 space-y-8">
                {/* Price Range Filter */}
                <div className="space-y-4">
                  <h3 className="font-medium">Price Range</h3>
                  <div className="space-y-2">
                    <Slider
                      defaultValue={[filters.priceRange[0], filters.priceRange[1]]}
                      min={minPrice}
                      max={maxPrice}
                      step={10}
                      value={[filters.priceRange[0], filters.priceRange[1]]}
                      onValueChange={handlePriceChange}
                      className="py-4"
                    />
                    <div className="flex items-center justify-between">
                      <span>KES {filters.priceRange[0]}</span>
                      <span>KES {filters.priceRange[1]}</span>
                    </div>
                  </div>
                </div>
                
                {/* Number of Guests */}
                <div className="space-y-4">
                  <Label htmlFor="guests">Number of Guests</Label>
                  <Select 
                    value={filters.guests.toString()} 
                    onValueChange={handleGuestsChange}
                  >
                    <SelectTrigger id="guests">
                      <SelectValue placeholder="Select guests" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Location Filter */}
                <div className="space-y-4">
                  <Label htmlFor="location">Location</Label>
                  <Select 
                    value={filters.location} 
                    onValueChange={handleLocationChange}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {allLocations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Amenities Filter */}
                <div className="space-y-4">
                  <h3 className="font-medium">Amenities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {allAmenities.slice(0, 10).map(amenity => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`amenity-${amenity}`} 
                          checked={filters.amenities.includes(amenity)}
                          onCheckedChange={() => handleAmenityToggle(amenity)}
                        />
                        <label 
                          htmlFor={`amenity-${amenity}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Property Type Filter */}
                <div className="space-y-4">
                  <h3 className="font-medium">Property Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {allPropertyTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`type-${type}`} 
                          checked={filters.propertyType.includes(type)}
                          onCheckedChange={() => handlePropertyTypeToggle(type)}
                        />
                        <label 
                          htmlFor={`type-${type}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instant Book Toggle */}
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="instant-book">Instant Book</Label>
                    <p className="text-sm text-muted-foreground">
                      Book without waiting for host approval
                    </p>
                  </div>
                  <Switch
                    id="instant-book"
                    checked={filters.instantBook}
                    onCheckedChange={handleInstantBookToggle}
                  />
                </div>

                {/* Minimum Rating Filter */}
                <div className="space-y-4">
                  <Label htmlFor="min-rating">Minimum Rating</Label>
                  <Select 
                    value={filters.minRating.toString()} 
                    onValueChange={handleMinRatingChange}
                  >
                    <SelectTrigger id="min-rating">
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any rating</SelectItem>
                      <SelectItem value="3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          3+ Stars
                        </div>
                      </SelectItem>
                      <SelectItem value="4">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          4+ Stars
                        </div>
                      </SelectItem>
                      <SelectItem value="4.5">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          4.5+ Stars
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bedrooms Filter */}
                <div className="space-y-4">
                  <Label htmlFor="bedrooms">Minimum Bedrooms</Label>
                  <Select 
                    value={filters.bedroomsMin.toString()} 
                    onValueChange={handleBedroomsChange}
                  >
                    <SelectTrigger id="bedrooms">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any</SelectItem>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}+ {num === 1 ? 'Bedroom' : 'Bedrooms'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bathrooms Filter */}
                <div className="space-y-4">
                  <Label htmlFor="bathrooms">Minimum Bathrooms</Label>
                  <Select 
                    value={filters.bathroomsMin.toString()} 
                    onValueChange={handleBathroomsChange}
                  >
                    <SelectTrigger id="bathrooms">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any</SelectItem>
                      {[1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}+ {num === 1 ? 'Bathroom' : 'Bathrooms'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sort Options */}
                <div className="space-y-4">
                  <Label htmlFor="sort">Sort By</Label>
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger id="sort">
                      <SelectValue placeholder="Default sorting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                      <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <SheetFooter>
                <div className="flex w-full space-x-2">
                  <Button variant="outline" onClick={handleReset} className="flex-1">
                    Reset
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1">Apply</Button>
                  </SheetClose>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          
          {/* Quick Sort Dropdown (visible on larger screens) */}
          <div className="hidden md:block">
            <Select 
              value={filters.sortBy} 
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                <SelectItem value="price-high-low">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Active Filters Summary */}
        <div className="text-sm text-muted-foreground">
          {`${properties.length} properties`}
          {filters.location && ` • ${filters.location}`}
          {filters.guests > 1 && ` • ${filters.guests} guests+`}
          {filters.propertyType.length > 0 && ` • ${filters.propertyType.length} types`}
          {filters.amenities.length > 0 && ` • ${filters.amenities.length} amenities`}
          {filters.instantBook && ` • Instant book`}
          {filters.minRating > 0 && ` • ${filters.minRating}+ stars`}
          {filters.bedroomsMin > 0 && ` • ${filters.bedroomsMin}+ beds`}
          {filters.bathroomsMin > 0 && ` • ${filters.bathroomsMin}+ baths`}
        </div>
      </div>
    </div>
  );
};

export default FilterSort;