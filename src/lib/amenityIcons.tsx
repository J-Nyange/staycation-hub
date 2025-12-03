import {
  Wifi,
  Car,
  Waves,
  ChefHat,
  Wind,
  Tv,
  WashingMachine,
  Droplets,
  Palmtree,
  Eye,
  Trees,
  Home,
  Fence,
  Flame,
  Dumbbell,
  Utensils,
  Heater,
  Shield,
  Camera,
  Heart,
  PawPrint,
  Accessibility,
  ArrowUpDown,
  Coffee,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";

// Map amenity keys to their corresponding icons
export const amenityIconMap: Record<string, LucideIcon> = {
  // Connectivity & Entertainment
  wifi: Wifi,
  "wi-fi": Wifi,
  internet: Wifi,
  tv: Tv,
  television: Tv,
  "cable tv": Tv,
  
  // Kitchen & Dining
  kitchen: ChefHat,
  "full kitchen": ChefHat,
  kitchenette: ChefHat,
  microwave: ChefHat,
  refrigerator: ChefHat,
  "coffee maker": Coffee,
  coffee: Coffee,
  "dining area": Utensils,
  bbq: Utensils,
  "bbq grill": Utensils,
  grill: Utensils,
  
  // Climate Control
  "air conditioning": Wind,
  "air conditioner": Wind,
  ac: Wind,
  heating: Heater,
  heater: Heater,
  fireplace: Flame,
  fan: Wind,
  
  // Laundry
  washer: WashingMachine,
  "washing machine": WashingMachine,
  dryer: WashingMachine,
  laundry: WashingMachine,
  
  // Outdoor & Views
  pool: Waves,
  "swimming pool": Waves,
  "private pool": Waves,
  "beach access": Palmtree,
  beach: Palmtree,
  "ocean view": Eye,
  "sea view": Eye,
  view: Eye,
  garden: Trees,
  balcony: Home,
  terrace: Home,
  patio: Home,
  yard: Fence,
  "outdoor space": Trees,
  
  // Wellness & Recreation
  "hot tub": Droplets,
  jacuzzi: Droplets,
  spa: Droplets,
  gym: Dumbbell,
  "fitness center": Dumbbell,
  "exercise equipment": Dumbbell,
  
  // Safety & Security
  parking: Car,
  "free parking": Car,
  "private parking": Car,
  garage: Car,
  security: Shield,
  "security system": Shield,
  cctv: Camera,
  "smoke detector": Shield,
  "carbon monoxide detector": Shield,
  "first aid kit": Heart,
  "fire extinguisher": Flame,
  
  // Accessibility
  "pet friendly": PawPrint,
  "pets allowed": PawPrint,
  "wheelchair accessible": Accessibility,
  accessible: Accessibility,
  elevator: ArrowUpDown,
  lift: ArrowUpDown,
};

// Format amenity text for display
export const formatAmenityText = (amenity: string): string => {
  const lowerAmenity = amenity.toLowerCase().trim();
  
  // Special cases for proper formatting
  const specialCases: Record<string, string> = {
    "wifi": "Wi-Fi",
    "wi-fi": "Wi-Fi",
    "tv": "TV",
    "ac": "A/C",
    "bbq": "BBQ",
    "cctv": "CCTV",
    "air conditioning": "Air Conditioning",
    "hot tub": "Hot Tub",
    "bbq grill": "BBQ Grill",
    "coffee maker": "Coffee Maker",
    "washing machine": "Washing Machine",
    "swimming pool": "Swimming Pool",
    "private pool": "Private Pool",
    "beach access": "Beach Access",
    "ocean view": "Ocean View",
    "sea view": "Sea View",
    "free parking": "Free Parking",
    "private parking": "Private Parking",
    "security system": "Security System",
    "smoke detector": "Smoke Detector",
    "carbon monoxide detector": "Carbon Monoxide Detector",
    "first aid kit": "First Aid Kit",
    "fire extinguisher": "Fire Extinguisher",
    "pet friendly": "Pet Friendly",
    "pets allowed": "Pets Allowed",
    "wheelchair accessible": "Wheelchair Accessible",
    "fitness center": "Fitness Center",
    "exercise equipment": "Exercise Equipment",
    "full kitchen": "Full Kitchen",
    "cable tv": "Cable TV",
    "dining area": "Dining Area",
    "outdoor space": "Outdoor Space",
  };
  
  // Check if we have a special case
  if (specialCases[lowerAmenity]) {
    return specialCases[lowerAmenity];
  }
  
  // Handle snake_case and kebab-case
  const formatted = amenity
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  return formatted;
};

// Get icon for amenity (returns Home as fallback)
export const getAmenityIcon = (amenity: string): LucideIcon => {
  const lowerAmenity = amenity.toLowerCase().trim();
  return amenityIconMap[lowerAmenity] || Home;
};
