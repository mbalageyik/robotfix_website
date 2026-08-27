export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_demo: boolean
          logo_path: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_demo?: boolean
          logo_path?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_demo?: boolean
          logo_path?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_demo: boolean
          name: string
          parent_id: string | null
          slug: string
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_demo?: boolean
          name: string
          parent_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_demo?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      device_models: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          is_demo: boolean
          name: string
          notes: string | null
          slug: string
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          notes?: string | null
          slug: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          notes?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      product_compatibility: {
        Row: {
          created_at: string
          device_model_id: string
          product_id: string
          verified_note: string | null
        }
        Insert: {
          created_at?: string
          device_model_id: string
          product_id: string
          verified_note?: string | null
        }
        Update: {
          created_at?: string
          device_model_id?: string
          product_id?: string
          verified_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_compatibility_device_model_id_fkey"
            columns: ["device_model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compatibility_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string
          created_at: string
          display_order: number
          id: string
          is_primary: boolean
          product_id: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          product_id: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          product_id?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_marketplace_links: {
        Row: {
          created_at: string
          custom_label: string | null
          display_order: number
          id: string
          is_active: boolean
          link_target: Database["public"]["Enums"]["marketplace_link_target"]
          marketplace: Database["public"]["Enums"]["marketplace"]
          product_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          custom_label?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          link_target: Database["public"]["Enums"]["marketplace_link_target"]
          marketplace: Database["public"]["Enums"]["marketplace"]
          product_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          custom_label?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          link_target?: Database["public"]["Enums"]["marketplace_link_target"]
          marketplace?: Database["public"]["Enums"]["marketplace"]
          product_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_marketplace_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_specs: {
        Row: {
          created_at: string
          display_order: number
          id: string
          label: string
          product_id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          label: string
          product_id: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          product_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability: Database["public"]["Enums"]["availability_status"]
          box_contents: string | null
          brand_id: string | null
          category_id: string | null
          compare_at_price_minor: number | null
          created_at: string
          currency: string
          display_order: number
          id: string
          installation_notes: string | null
          is_demo: boolean
          is_featured: boolean
          is_original: boolean | null
          long_description: string | null
          name: string
          price_minor: number | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          availability?: Database["public"]["Enums"]["availability_status"]
          box_contents?: string | null
          brand_id?: string | null
          category_id?: string | null
          compare_at_price_minor?: number | null
          created_at?: string
          currency?: string
          display_order?: number
          id?: string
          installation_notes?: string | null
          is_demo?: boolean
          is_featured?: boolean
          is_original?: boolean | null
          long_description?: string | null
          name: string
          price_minor?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          availability?: Database["public"]["Enums"]["availability_status"]
          box_contents?: string | null
          brand_id?: string | null
          category_id?: string | null
          compare_at_price_minor?: number | null
          created_at?: string
          currency?: string
          display_order?: number
          id?: string
          installation_notes?: string | null
          is_demo?: boolean
          is_featured?: boolean
          is_original?: boolean | null
          long_description?: string | null
          name?: string
          price_minor?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      related_products: {
        Row: {
          created_at: string
          display_order: number
          product_id: string
          related_product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          product_id: string
          related_product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          product_id?: string
          related_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_products_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          display_order: number
          icon_key: string | null
          id: string
          is_demo: boolean
          long_description: string | null
          name: string
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon_key?: string | null
          id?: string
          is_demo?: boolean
          long_description?: string | null
          name: string
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon_key?: string | null
          id?: string
          is_demo?: boolean
          long_description?: string | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_updated_at: { Args: { target_table: unknown }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      product_is_public: {
        Args: { target_product_id: string }
        Returns: boolean
      }
      slugify: { Args: { input: string }; Returns: string }
    }
    Enums: {
      admin_role: "owner" | "editor"
      availability_status: "in_stock" | "limited" | "on_order" | "out_of_stock"
      marketplace: "amazon" | "hepsiburada" | "trendyol" | "pazarama" | "other"
      marketplace_link_target: "product" | "store"
      publication_status: "draft" | "active" | "passive" | "archived"
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
      admin_role: ["owner", "editor"],
      availability_status: ["in_stock", "limited", "on_order", "out_of_stock"],
      marketplace: ["amazon", "hepsiburada", "trendyol", "pazarama", "other"],
      marketplace_link_target: ["product", "store"],
      publication_status: ["draft", "active", "passive", "archived"],
    },
  },
} as const

