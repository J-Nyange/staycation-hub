export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string | null
          id: string
          property_id: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          id?: string
          property_id: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          id?: string
          property_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          commission_amount: number | null
          created_at: string
          guests: number
          id: string
          payment_status: string | null
          payout_status: string | null
          property_id: string
          special_requests: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in: string
          check_out: string
          commission_amount?: number | null
          created_at?: string
          guests: number
          id?: string
          payment_status?: string | null
          payout_status?: string | null
          property_id: string
          special_requests?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in?: string
          check_out?: string
          commission_amount?: number | null
          created_at?: string
          guests?: number
          id?: string
          payment_status?: string | null
          payout_status?: string | null
          property_id?: string
          special_requests?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booking_id: string | null
          created_at: string | null
          guest_id: string
          id: string
          owner_id: string
          property_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          guest_id: string
          id?: string
          owner_id: string
          property_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          guest_id?: string
          id?: string
          owner_id?: string
          property_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_agreements: {
        Row: {
          accepted_at: string
          agreement_type: string
          id: string
          ip_address: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          agreement_type: string
          id?: string
          ip_address?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          agreement_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string | null
          id: string
          payment_method: string | null
          status: string
          stripe_payment_intent_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payment_method?: string | null
          status: string
          stripe_payment_intent_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          stripe_payment_intent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_terms_at: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          id: string
          is_property_owner: boolean | null
          last_name: string | null
          pending_payout: number | null
          phone: string | null
          preferred_language: string | null
          stripe_connect_account_id: string | null
          stripe_customer_id: string | null
          total_earnings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_terms_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          is_property_owner?: boolean | null
          last_name?: string | null
          pending_payout?: number | null
          phone?: string | null
          preferred_language?: string | null
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_terms_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          is_property_owner?: boolean | null
          last_name?: string | null
          pending_payout?: number | null
          phone?: string | null
          preferred_language?: string | null
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          cancellation_policy: string | null
          category: string
          commission_rate: number | null
          created_at: string
          description: string | null
          guests: number
          id: string
          images: string[] | null
          instant_book: boolean | null
          is_active: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          main_image: string | null
          owner_id: string | null
          price_per_night: number
          property_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          cancellation_policy?: string | null
          category: string
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          guests?: number
          id?: string
          images?: string[] | null
          instant_book?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          main_image?: string | null
          owner_id?: string | null
          price_per_night: number
          property_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          cancellation_policy?: string | null
          category?: string
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          guests?: number
          id?: string
          images?: string[] | null
          instant_book?: boolean | null
          is_active?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          main_image?: string | null
          owner_id?: string | null
          price_per_night?: number
          property_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_earnings: {
        Row: {
          booking_id: string
          commission_amount: number
          created_at: string
          gross_amount: number
          id: string
          net_amount: number
          payout_date: string | null
          payout_status: string | null
          property_id: string
          stripe_transfer_id: string | null
        }
        Insert: {
          booking_id: string
          commission_amount: number
          created_at?: string
          gross_amount: number
          id?: string
          net_amount: number
          payout_date?: string | null
          payout_status?: string | null
          property_id: string
          stripe_transfer_id?: string | null
        }
        Update: {
          booking_id?: string
          commission_amount?: number
          created_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          payout_date?: string | null
          payout_status?: string | null
          property_id?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_earnings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_earnings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          helpful_count: number | null
          id: string
          is_verified: boolean | null
          photos: string[] | null
          property_id: string
          rating: number
          review_response: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_verified?: boolean | null
          photos?: string[] | null
          property_id: string
          rating: number
          review_response?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_verified?: boolean | null
          photos?: string[] | null
          property_id?: string
          rating?: number
          review_response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_pricing: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          price_per_night: number
          property_id: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          price_per_night: number
          property_id: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          price_per_night?: number
          property_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_pricing_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
