import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ComparisonProperty {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  guests: number;
  bedrooms?: number;
  bathrooms?: number;
  rating?: number;
  reviews?: number;
  amenities: string[];
  main_image?: string;
  category: string;
}

interface ComparisonStore {
  properties: ComparisonProperty[];
  addToComparison: (property: ComparisonProperty) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
  isInComparison: (id: string) => boolean;
}

export const useComparison = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      properties: [],
      addToComparison: (property) => {
        const current = get().properties;
        if (current.length >= 4) {
          return; // Maximum 4 properties for comparison
        }
        if (!current.find(p => p.id === property.id)) {
          set({ properties: [...current, property] });
        }
      },
      removeFromComparison: (id) => {
        set({ properties: get().properties.filter(p => p.id !== id) });
      },
      clearComparison: () => {
        set({ properties: [] });
      },
      isInComparison: (id) => {
        return get().properties.some(p => p.id === id);
      },
    }),
    {
      name: 'property-comparison',
    }
  )
);
