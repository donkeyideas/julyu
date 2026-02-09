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
          avatar_url: string | null
          auth_provider: 'email' | 'google' | null
          firebase_uid: string | null
          updated_at: string | null
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
          avatar_url?: string | null
          auth_provider?: 'email' | 'google' | null
          firebase_uid?: string | null
          updated_at?: string | null
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
          avatar_url?: string | null
          auth_provider?: 'email' | 'google' | null
          firebase_uid?: string | null
          updated_at?: string | null
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
          user_id: string | null
          model_name: string | null
          provider: string | null
          request_type: string | null
          use_case: string | null
          input_tokens: number | null
          output_tokens: number | null
          total_tokens: number | null
          tokens_used: number | null
          cost: number | null
          response_time_ms: number | null
          success: boolean | null
          error_message: string | null
          created_at?: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          model_name?: string | null
          provider?: string | null
          request_type?: string | null
          use_case?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          total_tokens?: number | null
          tokens_used?: number | null
          cost?: number | null
          response_time_ms?: number | null
          success?: boolean | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          model_name?: string | null
          provider?: string | null
          request_type?: string | null
          use_case?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          total_tokens?: number | null
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
      // AI Conversations (Chat Assistant)
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      // AI Insights
      ai_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: 'savings' | 'spending' | 'prediction' | 'recommendation' | 'alert'
          title: string
          content: string
          metadata: Json | null
          priority: number | null
          dismissed: boolean | null
          action_url: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          insight_type: 'savings' | 'spending' | 'prediction' | 'recommendation' | 'alert'
          title: string
          content: string
          metadata?: Json | null
          priority?: number | null
          dismissed?: boolean | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          insight_type?: 'savings' | 'spending' | 'prediction' | 'recommendation' | 'alert'
          title?: string
          content?: string
          metadata?: Json | null
          priority?: number | null
          dismissed?: boolean | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
        }
      }
      // User Budgets
      user_budgets: {
        Row: {
          id: string
          user_id: string
          category: string | null
          monthly_limit: number | null
          current_spent: number | null
          month: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category?: string | null
          monthly_limit?: number | null
          current_spent?: number | null
          month: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string | null
          monthly_limit?: number | null
          current_spent?: number | null
          month?: string
          created_at?: string
          updated_at?: string
        }
      }
      budget_recommendations: {
        Row: {
          id: string
          user_id: string
          recommendation_type: string | null
          title: string | null
          description: string | null
          potential_savings: number | null
          metadata: Json | null
          implemented: boolean | null
          dismissed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recommendation_type?: string | null
          title?: string | null
          description?: string | null
          potential_savings?: number | null
          metadata?: Json | null
          implemented?: boolean | null
          dismissed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recommendation_type?: string | null
          title?: string | null
          description?: string | null
          potential_savings?: number | null
          metadata?: Json | null
          implemented?: boolean | null
          dismissed?: boolean | null
          created_at?: string
        }
      }
      // Feature Flags
      feature_flags: {
        Row: {
          id: string
          name: string
          description: string | null
          is_enabled: boolean | null
          rollout_percentage: number | null
          user_segment: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          user_segment?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          user_segment?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      // AI Feedback
      ai_feedback: {
        Row: {
          id: string
          user_id: string
          interaction_type: string | null
          interaction_id: string | null
          feedback_type: string | null
          rating: number | null
          comment: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          interaction_type?: string | null
          interaction_id?: string | null
          feedback_type?: string | null
          rating?: number | null
          comment?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          interaction_type?: string | null
          interaction_id?: string | null
          feedback_type?: string | null
          rating?: number | null
          comment?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      // Alert Notifications
      alert_notifications: {
        Row: {
          id: string
          alert_id: string | null
          user_id: string | null
          sent_at: string
          method: string | null
          status: string | null
          current_price: number | null
          target_price: number | null
        }
        Insert: {
          id?: string
          alert_id?: string | null
          user_id?: string | null
          sent_at?: string
          method?: string | null
          status?: string | null
          current_price?: number | null
          target_price?: number | null
        }
        Update: {
          id?: string
          alert_id?: string | null
          user_id?: string | null
          sent_at?: string
          method?: string | null
          status?: string | null
          current_price?: number | null
          target_price?: number | null
        }
      }
      // Training Data Exports
      training_data_exports: {
        Row: {
          id: string
          export_date: string
          record_count: number | null
          file_url: string | null
          format: string | null
          use_case: string | null
          filters: Json | null
          exported_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          export_date?: string
          record_count?: number | null
          file_url?: string | null
          format?: string | null
          use_case?: string | null
          filters?: Json | null
          exported_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          export_date?: string
          record_count?: number | null
          file_url?: string | null
          format?: string | null
          use_case?: string | null
          filters?: Json | null
          exported_by?: string | null
          created_at?: string
        }
      }
      // Model Registry
      model_registry: {
        Row: {
          id: string
          name: string
          version: string
          base_model: string | null
          training_data_export_id: string | null
          status: 'training' | 'ready' | 'deployed' | 'retired'
          performance_metrics: Json | null
          config: Json | null
          created_at: string
          deployed_at: string | null
        }
        Insert: {
          id?: string
          name: string
          version: string
          base_model?: string | null
          training_data_export_id?: string | null
          status?: 'training' | 'ready' | 'deployed' | 'retired'
          performance_metrics?: Json | null
          config?: Json | null
          created_at?: string
          deployed_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          version?: string
          base_model?: string | null
          training_data_export_id?: string | null
          status?: 'training' | 'ready' | 'deployed' | 'retired'
          performance_metrics?: Json | null
          config?: Json | null
          created_at?: string
          deployed_at?: string | null
        }
      }
      // Community Chat - User to User Messaging
      chat_conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          last_message: string | null
          last_message_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          last_message?: string | null
          last_message_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          last_message?: string | null
          last_message_at?: string | null
        }
      }
      chat_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'recipe' | 'list' | 'image'
          metadata: Json | null
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'recipe' | 'list' | 'image'
          metadata?: Json | null
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'recipe' | 'list' | 'image'
          metadata?: Json | null
          created_at?: string
          read_at?: string | null
        }
      }
      user_friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
          accepted_at?: string | null
        }
      }
      // Delivery Partners (for monetization/shop modal)
      delivery_partners: {
        Row: {
          id: string
          name: string
          display_name: string | null
          slug: string
          description: string | null
          logo_url: string | null
          icon_letter: string | null
          brand_color: string | null
          base_url: string
          deep_link_template: string | null
          affiliate_base_url: string | null
          affiliate_id: string | null
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          api_endpoint: string | null
          api_config: Json | null
          commission_type: 'percentage' | 'flat' | 'per_order'
          commission_rate: number | null
          flat_commission: number | null
          supports_deep_linking: boolean | null
          supports_cart_api: boolean | null
          supports_search_url: boolean | null
          requires_partnership: boolean | null
          sort_order: number | null
          is_active: boolean | null
          show_in_modal: boolean | null
          supported_retailers: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name?: string | null
          slug: string
          description?: string | null
          logo_url?: string | null
          icon_letter?: string | null
          brand_color?: string | null
          base_url: string
          deep_link_template?: string | null
          affiliate_base_url?: string | null
          affiliate_id?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          api_endpoint?: string | null
          api_config?: Json | null
          commission_type?: 'percentage' | 'flat' | 'per_order'
          commission_rate?: number | null
          flat_commission?: number | null
          supports_deep_linking?: boolean | null
          supports_cart_api?: boolean | null
          supports_search_url?: boolean | null
          requires_partnership?: boolean | null
          sort_order?: number | null
          is_active?: boolean | null
          show_in_modal?: boolean | null
          supported_retailers?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string | null
          slug?: string
          description?: string | null
          logo_url?: string | null
          icon_letter?: string | null
          brand_color?: string | null
          base_url?: string
          deep_link_template?: string | null
          affiliate_base_url?: string | null
          affiliate_id?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          api_endpoint?: string | null
          api_config?: Json | null
          commission_type?: 'percentage' | 'flat' | 'per_order'
          commission_rate?: number | null
          flat_commission?: number | null
          supports_deep_linking?: boolean | null
          supports_cart_api?: boolean | null
          supports_search_url?: boolean | null
          requires_partnership?: boolean | null
          sort_order?: number | null
          is_active?: boolean | null
          show_in_modal?: boolean | null
          supported_retailers?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      delivery_partner_clicks: {
        Row: {
          id: string
          user_id: string | null
          partner_id: string | null
          store_name: string | null
          store_retailer: string | null
          store_address: string | null
          items_json: Json | null
          items_count: number | null
          estimated_total: number | null
          generated_url: string | null
          deep_link_used: boolean | null
          commission_rate: number | null
          estimated_commission: number | null
          converted: boolean | null
          conversion_date: string | null
          order_total: number | null
          actual_commission: number | null
          external_order_id: string | null
          session_id: string | null
          user_agent: string | null
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          partner_id?: string | null
          store_name?: string | null
          store_retailer?: string | null
          store_address?: string | null
          items_json?: Json | null
          items_count?: number | null
          estimated_total?: number | null
          generated_url?: string | null
          deep_link_used?: boolean | null
          commission_rate?: number | null
          estimated_commission?: number | null
          converted?: boolean | null
          conversion_date?: string | null
          order_total?: number | null
          actual_commission?: number | null
          external_order_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          partner_id?: string | null
          store_name?: string | null
          store_retailer?: string | null
          store_address?: string | null
          items_json?: Json | null
          items_count?: number | null
          estimated_total?: number | null
          generated_url?: string | null
          deep_link_used?: boolean | null
          commission_rate?: number | null
          estimated_commission?: number | null
          converted?: boolean | null
          conversion_date?: string | null
          order_total?: number | null
          actual_commission?: number | null
          external_order_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          referrer?: string | null
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
      // Subscription Plans
      subscription_plans: {
        Row: {
          id: string
          name: string
          slug: string
          stripe_price_id: string | null
          price: number
          billing_interval: 'month' | 'year'
          features: Json
          description: string | null
          is_active: boolean
          is_self_serve: boolean
          sort_order: number
          max_calls_per_day: number
          max_calls_per_minute: number
          max_tokens_per_day: number
          highlight: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          stripe_price_id?: string | null
          price?: number
          billing_interval?: 'month' | 'year'
          features?: Json
          description?: string | null
          is_active?: boolean
          is_self_serve?: boolean
          sort_order?: number
          max_calls_per_day?: number
          max_calls_per_minute?: number
          max_tokens_per_day?: number
          highlight?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          stripe_price_id?: string | null
          price?: number
          billing_interval?: 'month' | 'year'
          features?: Json
          description?: string | null
          is_active?: boolean
          is_self_serve?: boolean
          sort_order?: number
          max_calls_per_day?: number
          max_calls_per_minute?: number
          max_tokens_per_day?: number
          highlight?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // Promo Codes
      promo_codes: {
        Row: {
          id: string
          code: string
          description: string | null
          type: 'percentage' | 'fixed' | 'free_months'
          value: number
          max_uses: number | null
          current_uses: number
          valid_from: string | null
          valid_until: string | null
          applicable_plans: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          type: 'percentage' | 'fixed' | 'free_months'
          value: number
          max_uses?: number | null
          current_uses?: number
          valid_from?: string | null
          valid_until?: string | null
          applicable_plans?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          type?: 'percentage' | 'fixed' | 'free_months'
          value?: number
          max_uses?: number | null
          current_uses?: number
          valid_from?: string | null
          valid_until?: string | null
          applicable_plans?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // User Subscriptions
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'free'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          promo_code_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'free'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          promo_code_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'free'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          promo_code_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Contact Messages (from /contact form)
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          is_read: boolean
          read_by: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject: string
          message: string
          is_read?: boolean
          read_by?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string
          message?: string
          is_read?: boolean
          read_by?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      // Promo Code Redemptions
      promo_code_redemptions: {
        Row: {
          id: string
          user_id: string
          promo_code_id: string
          subscription_id: string | null
          redeemed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          promo_code_id: string
          subscription_id?: string | null
          redeemed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          promo_code_id?: string
          subscription_id?: string | null
          redeemed_at?: string
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


