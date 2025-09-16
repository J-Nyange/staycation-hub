import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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
import { SlidersHorizontal } from "lucide-react";
import { Property } from "@/hooks/useProperties";

export type SortOption = "default" | "price-low-high" | "price-high-low" | "rating";

export interface FilterOptions {
  priceRange: [number, number];
  guests: number;
  location: string;
  amenities: string[];
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
    sortBy: "default",
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Apply filters and sorting
  useEffect(() => {
    let filteredResults = [...properties];
    
    // Filter by price range
    filteredResults = filteredResults.filter(
      (property) => 
        property.price_per_night >= filters.priceRange[0] && 
        property.price_per_night <= filters.priceRange[1]
    );
    
    // Filter by guests
    if (filters.guests > 1) {
      filteredResults = filteredResults.filter(
        (property) => property.guests >= filters.guests
      );
    }
    
    // Filter by location
    if (filters.location) {
      filteredResults = filteredResults.filter(
        (property) => property.location === filters.location
      );
    }
    
    // Filter by amenities
    if (filters.amenities.length > 0) {
      filteredResults = filteredResults.filter((property) => {
        return filters.amenities.every(amenity => 
          property.amenities && property.amenities.includes(amenity)
        );
      });
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case "price-low-high":
        filteredResults.sort((a, b) => a.price_per_night - b.price_per_night);
        break;
      case "price-high-low":
        filteredResults.sort((a, b) => b.price_per_night - a.price_per_night);
        break;
      case "rating":
        // Assuming properties have a rating field, or using a default value
        filteredResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        // Default sorting (could be by creation date or featured status)
        break;
    }
    
    onFilterChange(filteredResults);
  }, [filters, properties, onFilterChange]);

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

  const handleReset = () => {
    setFilters({
      priceRange: [minPrice, maxPrice],
      guests: 1,
      location: "",
      amenities: [],
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
                      <span>${filters.priceRange[0]}</span>
                      <span>${filters.priceRange[1]}</span>
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
                      <SelectItem value="rating">Best Rating</SelectItem>
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
                <SelectItem value="rating">Best Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Active Filters Summary */}
        <div className="text-sm text-muted-foreground">
          {properties.length} properties
          {filters.location && ` • ${filters.location}`}
          {filters.guests > 1 && ` • ${filters.guests} guests+`}
          {filters.amenities.length > 0 && ` • ${filters.amenities.length} amenities`}
        </div>
      </div>
    </div>
  );
};

export default FilterSort;