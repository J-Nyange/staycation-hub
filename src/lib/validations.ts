import { z } from 'zod';

// Booking validation schema
export const bookingSchema = z.object({
  checkIn: z.date({
    required_error: "Check-in date is required",
  }),
  checkOut: z.date({
    required_error: "Check-out date is required",
  }),
  adults: z.number().min(1, "At least 1 adult is required").max(20, "Maximum 20 adults allowed"),
  children: z.number().min(0).max(20, "Maximum 20 children allowed"),
  infants: z.number().min(0).max(10, "Maximum 10 infants allowed"),
  specialRequests: z.string().max(2000, "Special requests must be under 2000 characters").optional(),
  accommodationExplanation: z.string().max(1000, "Explanation must be under 1000 characters").optional(),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
  // Group booking fields
  isGroupBooking: z.boolean().optional(),
  groupType: z.string().max(100).optional(),
  dietaryRequirements: z.string().max(1000).optional(),
  accessibilityNeeds: z.string().max(1000).optional(),
  additionalServices: z.array(z.string()).optional(),
}).refine(data => data.checkOut > data.checkIn, {
  message: "Check-out must be after check-in",
  path: ["checkOut"],
}).refine(data => (data.adults + data.children + data.infants) <= 50, {
  message: "Maximum 50 total guests allowed",
  path: ["adults"],
});

// Property validation schema
export const propertySchema = z.object({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be under 100 characters")
    .trim(),
  description: z.string()
    .min(100, "Description must be at least 100 characters")
    .max(5000, "Description must be under 5000 characters")
    .trim(),
  location: z.string()
    .min(3, "Location must be at least 3 characters")
    .max(200, "Location must be under 200 characters")
    .trim(),
  category: z.enum(['airbnb', 'villa', 'homestay'], {
    required_error: "Please select a category",
  }),
  price_per_night: z.number()
    .positive("Price must be greater than 0")
    .max(1000000, "Price must be under 1,000,000"),
  guests: z.number()
    .int("Guests must be a whole number")
    .min(1, "Must allow at least 1 guest")
    .max(50, "Maximum 50 guests allowed"),
  bedrooms: z.number()
    .int("Bedrooms must be a whole number")
    .min(0)
    .max(50, "Maximum 50 bedrooms")
    .optional()
    .nullable(),
  bathrooms: z.number()
    .min(0)
    .max(50, "Maximum 50 bathrooms")
    .optional()
    .nullable(),
  images: z.array(z.string().url("Must be a valid URL"))
    .min(3, "At least 3 images are required")
    .max(20, "Maximum 20 images allowed"),
  amenities: z.array(z.string().max(50)).max(30).optional(),
  is_active: z.boolean().optional(),
});

// Review validation schema
export const reviewSchema = z.object({
  rating: z.number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z.string()
    .max(1000, "Comment must be under 1000 characters")
    .trim()
    .optional(),
});

// Transfer ownership validation schema
export const transferOwnershipSchema = z.object({
  selectedUserId: z.string().min(1, "Please select a user"),
  confirmText: z.literal("TRANSFER", {
    errorMap: () => ({ message: "Type TRANSFER to confirm" }),
  }),
});

// Type exports
export type BookingFormData = z.infer<typeof bookingSchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type TransferOwnershipFormData = z.infer<typeof transferOwnershipSchema>;

// Helper to validate and extract errors
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T; errors: null } | { success: false; errors: Record<string, string>; data: null } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: null };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  
  return { success: false, errors, data: null };
}
