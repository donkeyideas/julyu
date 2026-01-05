/**
 * Database Types
 * Generated from Supabase schema
 * Run: npm run db:generate
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          location: unknown | null
          created_at: string
          last_login: string | null
          subscription_tier: 'free' | 'premium' | 'enterprise'
          stripe_customer_id: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          phone?: string | null
          location?: unknown | null
          created_at?: string
          last_login?: string | null
          subscription_tier?: 'free' | 'premium' | 'enterprise'
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          location?: unknown | null
          created_at?: string
          last_login?: string | null
          subscription_tier?: 'free' | 'premium' | 'enterprise'
          stripe_customer_id?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          max_stores: number | null
          max_drive_time: number | null
          time_value_per_hour: number | null
          dietary_restrictions: Json | null
          preferred_retailers: Json | null
          excluded_retailers: Json | null
          notification_preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          max_stores?: number | null
          max_drive_time?: number | null
          time_value_per_hour?: number | null
          dietary_restrictions?: Json | null
          preferred_retailers?: Json | null
          excluded_retailers?: Json | null
          notification_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          max_stores?: number | null
          max_drive_time?: number | null
          time_value_per_hour?: number | null
          dietary_restrictions?: Json | null
          preferred_retailers?: Json | null
          excluded_retailers?: Json | null
          notification_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          brand: string | null
          category: string | null
          subcategory: string | null
          upc: string | null
          size: string | null
          unit: string | null
          attributes: Json | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          brand?: string | null
          category?: string | null
          subcategory?: string | null
          upc?: string | null
          size?: string | null
          unit?: string | null
          attributes?: Json | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string | null
          category?: string | null
          subcategory?: string | null
          upc?: string | null
          size?: string | null
          unit?: string | null
          attributes?: Json | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          retailer: string
          store_number: string | null
          name: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          location: unknown | null
          phone: string | null
          hours: Json | null
          services: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          retailer: string
          store_number?: string | null
          name?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          location?: unknown | null
          phone?: string | null
          hours?: Json | null
          services?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          retailer?: string
          store_number?: string | null
          name?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          location?: unknown | null
          phone?: string | null
          hours?: Json | null
          services?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      prices: {
        Row: {
          id: string
          product_id: string
          store_id: string
          price: number
          sale_price: number | null
          currency: string | null
          effective_date: string
          expires_at: string | null
          source: string | null
          confidence: number | null
          verified_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          store_id: string
          price: number
          sale_price?: number | null
          currency?: string | null
          effective_date?: string
          expires_at?: string | null
          source?: string | null
          confidence?: number | null
          verified_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          store_id?: string
          price?: number
          sale_price?: number | null
          currency?: string | null
          effective_date?: string
          expires_at?: string | null
          source?: string | null
          confidence?: number | null
          verified_count?: number | null
          created_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          store_id: string | null
          image_url: string
          total_amount: number | null
          tax_amount: number | null
          purchase_date: string | null
          ocr_status: 'pending' | 'processing' | 'complete' | 'failed' | null
          ocr_result: Json | null
          ocr_confidence: number | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          store_id?: string | null
          image_url: string
          total_amount?: number | null
          tax_amount?: number | null
          purchase_date?: string | null
          ocr_status?: 'pending' | 'processing' | 'complete' | 'failed' | null
          ocr_result?: Json | null
          ocr_confidence?: number | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string | null
          image_url?: string
          total_amount?: number | null
          tax_amount?: number | null
          purchase_date?: string | null
          ocr_status?: 'pending' | 'processing' | 'complete' | 'failed' | null
          ocr_result?: Json | null
          ocr_confidence?: number | null
          created_at?: string
          processed_at?: string | null
        }
      }
      shopping_lists: {
        Row: {
          id: string
          user_id: string
          name: string | null
          created_at: string
          updated_at: string
          last_analyzed_at: string | null
          is_template: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          created_at?: string
          updated_at?: string
          last_analyzed_at?: string | null
          is_template?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          created_at?: string
          updated_at?: string
          last_analyzed_at?: string | null
          is_template?: boolean | null
        }
      }
      list_items: {
        Row: {
          id: string
          list_id: string
          user_input: string
          matched_product_id: string | null
          quantity: number | null
          unit: string | null
          match_confidence: number | null
          alternative_matches: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          user_input: string
          matched_product_id?: string | null
          quantity?: number | null
          unit?: string | null
          match_confidence?: number | null
          alternative_matches?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          user_input?: string
          matched_product_id?: string | null
          quantity?: number | null
          unit?: string | null
          match_confidence?: number | null
          alternative_matches?: Json | null
          created_at?: string
        }
      }
      comparisons: {
        Row: {
          id: string
          list_id: string
          user_id: string | null
          results: Json
          best_option: Json | null
          alternatives: Json | null
          total_savings: number | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          list_id: string
          user_id?: string | null
          results: Json
          best_option?: Json | null
          alternatives?: Json | null
          total_savings?: number | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          list_id?: string
          user_id?: string | null
          results?: Json
          best_option?: Json | null
          alternatives?: Json | null
          total_savings?: number | null
          created_at?: string
          expires_at?: string | null
        }
      }
      price_alerts: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          target_price: number
          current_price: number | null
          is_active: boolean | null
          triggered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          target_price: number
          current_price?: number | null
          is_active?: boolean | null
          triggered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          target_price?: number
          current_price?: number | null
          is_active?: boolean | null
          triggered_at?: string | null
          created_at?: string
        }
      }
      partner_retailers: {
        Row: {
          id: string
          retailer_name: string
          api_type: string | null
          api_credentials: Json | null
          revenue_share_percent: number | null
          contract_start: string | null
          contract_end: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          retailer_name: string
          api_type?: string | null
          api_credentials?: Json | null
          revenue_share_percent?: number | null
          contract_start?: string | null
          contract_end?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          retailer_name?: string
          api_type?: string | null
          api_credentials?: Json | null
          revenue_share_percent?: number | null
          contract_start?: string | null
          contract_end?: string | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      affiliate_transactions: {
        Row: {
          id: string
          user_id: string | null
          partner_id: string | null
          order_total: number | null
          commission_amount: number | null
          commission_rate: number | null
          transaction_date: string | null
          status: 'pending' | 'confirmed' | 'paid' | null
          external_order_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          partner_id?: string | null
          order_total?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          transaction_date?: string | null
          status?: 'pending' | 'confirmed' | 'paid' | null
          external_order_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          partner_id?: string | null
          order_total?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          transaction_date?: string | null
          status?: 'pending' | 'confirmed' | 'paid' | null
          external_order_id?: string | null
        }
      }
      user_savings: {
        Row: {
          id: string
          user_id: string
          month: string
          total_spent: number | null
          total_saved: number | null
          trips_count: number | null
          avg_savings_per_trip: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          total_spent?: number | null
          total_saved?: number | null
          trips_count?: number | null
          avg_savings_per_trip?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          total_spent?: number | null
          total_saved?: number | null
          trips_count?: number | null
          avg_savings_per_trip?: number | null
          created_at?: string
        }
      }
      system_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number | null
          dimensions: Json | null
          recorded_at: string
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value?: number | null
          dimensions?: Json | null
          recorded_at?: string
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number | null
          dimensions?: Json | null
          recorded_at?: string
        }
      }
      // AI-related tables (used by admin dashboard)
      ai_model_config: {
        Row: {
          id?: string
          model_name: string
          provider: string
          api_key_encrypted: string | null
          api_endpoint: string | null
          model_version: string | null
          is_active: boolean | null
          config: Json | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          model_name: string
          provider: string
          api_key_encrypted?: string | null
          api_endpoint?: string | null
          model_version?: string | null
          is_active?: boolean | null
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          model_name?: string
          provider?: string
          api_key_encrypted?: string | null
          api_endpoint?: string | null
          model_version?: string | null
          is_active?: boolean | null
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_model_usage: {
        Row: {
          id?: string
          model_name: string | null
          provider: string | null
          request_type: string | null
          tokens_used: number | null
          cost: number | null
          response_time_ms: number | null
          success: boolean | null
          error_message: string | null
          created_at?: string
        }
        Insert: {
          id?: string
          model_name?: string | null
          provider?: string | null
          request_type?: string | null
          tokens_used?: number | null
          cost?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          model_name?: string | null
          provider?: string | null
          request_type?: string | null
          tokens_used?: number | null
          cost?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          error_message?: string | null
          created_at?: string
        }
      }
      ai_training_data: {
        Row: {
          id?: string
          input_text: string | null
          output_text: string | null
          metadata: Json | null
          created_at?: string
        }
        Insert: {
          id?: string
          input_text?: string | null
          output_text?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          input_text?: string | null
          output_text?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      // Alias for retailers (used in admin dashboard)
      retailers: {
        Row: {
          id: string
          retailer: string
          store_number: string | null
          name: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          location: unknown | null
          phone: string | null
          hours: Json | null
          services: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          retailer: string
          store_number?: string | null
          name?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          location?: unknown | null
          phone?: string | null
          hours?: Json | null
          services?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          retailer?: string
          store_number?: string | null
          name?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          location?: unknown | null
          phone?: string | null
          hours?: Json | null
          services?: Json | null
          created_at?: string
          updated_at?: string
        }
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
  }
}


