import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Property {
  id: string;
  title: string;
  description: string | null;
  location: string;
  price_per_night: number;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  category: 'airbnb' | 'villa' | 'homestay';
  amenities: string[];
  images: string[];
  main_image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_id?: string | null;
  rating?: number;
  review_count?: number;
  // New fields from Phase 1-5
  commission_rate?: number;
  cancellation_policy?: string;
  latitude?: number | null;
  longitude?: number | null;
  property_type?: string | null;
  instant_book?: boolean;
}

export type PropertyCategory = 'airbnb' | 'villa' | 'homestay' | 'all';

export const useProperties = (category?: PropertyCategory | string) => {
  return useQuery({
    queryKey: ['properties', category],
    queryFn: async () => {
      // Fetch all active properties first
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, description, location, price_per_night, guests, bedrooms, bathrooms, category, amenities, images, main_image, is_active, created_at, updated_at, cancellation_policy, latitude, longitude, property_type, instant_book, deposit_percentage, is_featured, group_booking_enabled, max_group_size, group_discount_percentage, owner_id')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      let properties = data as Property[];
      
      // Apply client-side category filtering
      if (category && category !== 'all') {
        const categoryLower = category.toLowerCase();
        properties = properties.filter(p => 
          p.category?.toLowerCase() === categoryLower
        );
      }
      
      // Then get ratings for all properties in one batch
      if (properties.length > 0) {
        const propertyIds = properties.map(p => p.id);
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('property_id, rating')
          .in('property_id', propertyIds);
          
        // Calculate average ratings
        const ratingsMap = new Map();
        const countMap = new Map();
        
        if (reviewsData) {
          reviewsData.forEach(review => {
            const { property_id, rating } = review;
            if (!ratingsMap.has(property_id)) {
              ratingsMap.set(property_id, 0);
              countMap.set(property_id, 0);
            }
            ratingsMap.set(property_id, ratingsMap.get(property_id) + rating);
            countMap.set(property_id, countMap.get(property_id) + 1);
          });
          
          // Add ratings to properties
          properties.forEach(property => {
            const totalRating = ratingsMap.get(property.id) || 0;
            const count = countMap.get(property.id) || 0;
            if (count > 0) {
              property.rating = parseFloat((totalRating / count).toFixed(1));
              property.review_count = count;
            }
          });
        }
      }

      return properties;
    },
  });
};

export const useProperty = (id: string) => {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as Property;
    },
    enabled: !!id,
  });
};