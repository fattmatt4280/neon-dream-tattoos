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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          admin_notes: string | null
          client_email: string
          client_name: string
          concept: string
          created_at: string
          id: string
          phone: string | null
          placement: string | null
          preferred_date: string | null
          reference_urls: string[] | null
          size_estimate: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          client_email: string
          client_name: string
          concept: string
          created_at?: string
          id?: string
          phone?: string | null
          placement?: string | null
          preferred_date?: string | null
          reference_urls?: string[] | null
          size_estimate?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          client_email?: string
          client_name?: string
          concept?: string
          created_at?: string
          id?: string
          phone?: string | null
          placement?: string | null
          preferred_date?: string | null
          reference_urls?: string[] | null
          size_estimate?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      flash_designs: {
        Row: {
          claimed: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string
          price_cents: number
          title: string
          updated_at: string
        }
        Insert: {
          claimed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          price_cents?: number
          title: string
          updated_at?: string
        }
        Update: {
          claimed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          price_cents?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      merch_products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string
          price_cents: number
          product_type: Database["public"]["Enums"]["merch_type"]
          stock: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          price_cents?: number
          product_type?: Database["public"]["Enums"]["merch_type"]
          stock?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          price_cents?: number
          product_type?: Database["public"]["Enums"]["merch_type"]
          stock?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          email: string
          id: string
          items: Json
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          total_cents: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          items: Json
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          total_cents: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          items?: Json
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string | null
          featured: boolean
          id: string
          image_url: string
          sort_order: number
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url: string
          sort_order?: number
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string
          sort_order?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      booking_status: "pending" | "confirmed" | "declined" | "completed"
      merch_type: "print" | "sticker" | "apparel" | "other"
      order_status: "pending" | "paid" | "fulfilled" | "cancelled"
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
    Enums: {
      app_role: ["admin", "user"],
      booking_status: ["pending", "confirmed", "declined", "completed"],
      merch_type: ["print", "sticker", "apparel", "other"],
      order_status: ["pending", "paid", "fulfilled", "cancelled"],
    },
  },
} as const
