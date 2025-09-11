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
}

export const useProperties = (category?: string) => {
  return useQuery({
    queryKey: ['properties', category],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as Property[];
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