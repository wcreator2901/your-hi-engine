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
      bank_accounts: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount_fiat: number | null
          bank_name: string | null
          bic_swift: string | null
          bsb_number: string | null
          created_at: string
          email_or_mobile: string | null
          iban: string | null
          id: string
          reference: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount_fiat?: number | null
          bank_name?: string | null
          bic_swift?: string | null
          bsb_number?: string | null
          created_at?: string
          email_or_mobile?: string | null
          iban?: string | null
          id?: string
          reference?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount_fiat?: number | null
          bank_name?: string | null
          bic_swift?: string | null
          bsb_number?: string | null
          created_at?: string
          email_or_mobile?: string | null
          iban?: string | null
          id?: string
          reference?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean | null
          message_text: string | null
          room_id: string
          sender_id: string
          sender_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string | null
          room_id: string
          sender_id: string
          sender_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string | null
          room_id?: string
          sender_id?: string
          sender_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message_id: string | null
          room_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_id?: string | null
          room_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_id?: string | null
          room_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          admin_id: string | null
          created_at: string
          creator_id: string | null
          id: string
          last_message_at: string | null
          scheduled_deletion_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          creator_id?: string | null
          id?: string
          last_message_at?: string | null
          scheduled_deletion_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          creator_id?: string | null
          id?: string
          last_message_at?: string | null
          scheduled_deletion_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_wallets: {
        Row: {
          balance: number | null
          contract_id: string
          created_at: string
          id: string
          is_active: boolean | null
          updated_at: string
          wallet_address: string
          wallet_name: string | null
        }
        Insert: {
          balance?: number | null
          contract_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          wallet_address: string
          wallet_name?: string | null
        }
        Update: {
          balance?: number | null
          contract_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          wallet_address?: string
          wallet_name?: string | null
        }
        Relationships: []
      }
      crypto_prices: {
        Row: {
          id: string
          price: number
          updated_at: string
        }
        Insert: {
          id: string
          price: number
          updated_at?: string
        }
        Update: {
          id?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      default_crypto_addresses: {
        Row: {
          btc_address: string | null
          created_at: string
          id: string
          updated_at: string
          usdt_trc20_address: string | null
          user_id: string | null
        }
        Insert: {
          btc_address?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          usdt_trc20_address?: string | null
          user_id?: string | null
        }
        Update: {
          btc_address?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          usdt_trc20_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deposit_addresses: {
        Row: {
          address: string
          asset_symbol: string
          created_at: string
          id: string
          network: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          asset_symbol: string
          created_at?: string
          id?: string
          network?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          asset_symbol?: string
          created_at?: string
          id?: string
          network?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ip_blocks: {
        Row: {
          blocked_at: string
          created_at: string
          id: string
          ip_address: string
          is_active: boolean | null
          reason: string | null
          updated_at: string
        }
        Insert: {
          blocked_at?: string
          created_at?: string
          id?: string
          ip_address: string
          is_active?: boolean | null
          reason?: string | null
          updated_at?: string
        }
        Update: {
          blocked_at?: string
          created_at?: string
          id?: string
          ip_address?: string
          is_active?: boolean | null
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          created_at: string
          document_back_url: string | null
          document_front_url: string | null
          document_number: string | null
          document_type: string | null
          id: string
          reviewed_at: string | null
          reviewer_notes: string | null
          selfie_url: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          document_number?: string | null
          document_type?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          selfie_url?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          document_number?: string | null
          document_type?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          selfie_url?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      smart_contracts: {
        Row: {
          abi: Json | null
          contract_address: string
          contract_code: string | null
          contract_description: string | null
          contract_name: string
          contract_type: string | null
          created_at: string
          created_by: string | null
          deployment_address: string | null
          deployment_date: string | null
          id: string
          is_active: boolean | null
          is_deployed: boolean | null
          network: string
          updated_at: string
        }
        Insert: {
          abi?: Json | null
          contract_address: string
          contract_code?: string | null
          contract_description?: string | null
          contract_name: string
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          deployment_address?: string | null
          deployment_date?: string | null
          id?: string
          is_active?: boolean | null
          is_deployed?: boolean | null
          network: string
          updated_at?: string
        }
        Update: {
          abi?: Json | null
          contract_address?: string
          contract_code?: string | null
          contract_description?: string | null
          contract_name?: string
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          deployment_address?: string | null
          deployment_date?: string | null
          id?: string
          is_active?: boolean | null
          is_deployed?: boolean | null
          network?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_2fa: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean | null
          secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_bank_deposit_details: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount_eur: number | null
          amount_usd: number | null
          bank_name: string | null
          bic_swift: string | null
          created_at: string
          email_or_mobile: string | null
          iban: string | null
          id: string
          is_visible: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount_eur?: number | null
          amount_usd?: number | null
          bank_name?: string | null
          bic_swift?: string | null
          created_at?: string
          email_or_mobile?: string | null
          iban?: string | null
          id?: string
          is_visible?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount_eur?: number | null
          amount_usd?: number | null
          bank_name?: string | null
          bic_swift?: string | null
          created_at?: string
          email_or_mobile?: string | null
          iban?: string | null
          id?: string
          is_visible?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_login_tracking: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip_address: string | null
          login_status: string | null
          login_timestamp: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          login_status?: string | null
          login_timestamp?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          login_status?: string | null
          login_timestamp?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_private_keys: {
        Row: {
          created_at: string
          id: string
          private_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          private_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          private_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: string | null
          status: string | null
          two_factor_enabled: boolean | null
          two_factor_required: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          two_factor_enabled?: boolean | null
          two_factor_required?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          two_factor_enabled?: boolean | null
          two_factor_required?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_seed_phrases: {
        Row: {
          created_at: string
          encrypted_seed_phrase: string
          id: string
          seed_hash: string | null
          seed_phrase: string | null
          seed_phrase_admin: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_seed_phrase: string
          id?: string
          seed_hash?: string | null
          seed_phrase?: string | null
          seed_phrase_admin?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_seed_phrase?: string
          id?: string
          seed_hash?: string | null
          seed_phrase?: string | null
          seed_phrase_admin?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_staking: {
        Row: {
          accrued_profits: number | null
          asset_symbol: string | null
          created_at: string
          daily_yield_percent: number | null
          id: string
          is_staking: boolean | null
          last_calculation_time: string | null
          staking_start_time: string | null
          total_profits_earned: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accrued_profits?: number | null
          asset_symbol?: string | null
          created_at?: string
          daily_yield_percent?: number | null
          id?: string
          is_staking?: boolean | null
          last_calculation_time?: string | null
          staking_start_time?: string | null
          total_profits_earned?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accrued_profits?: number | null
          asset_symbol?: string | null
          created_at?: string
          daily_yield_percent?: number | null
          id?: string
          is_staking?: boolean | null
          last_calculation_time?: string | null
          staking_start_time?: string | null
          total_profits_earned?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_transactions: {
        Row: {
          amount: number | null
          amount_crypto: number | null
          amount_fiat: number | null
          asset_symbol: string | null
          created_at: string
          currency: string | null
          from_address: string | null
          id: string
          network: string | null
          status: string | null
          to_address: string | null
          transaction_hash: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          amount_crypto?: number | null
          amount_fiat?: number | null
          asset_symbol?: string | null
          created_at?: string
          currency?: string | null
          from_address?: string | null
          id?: string
          network?: string | null
          status?: string | null
          to_address?: string | null
          transaction_hash?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          amount_crypto?: number | null
          amount_fiat?: number | null
          asset_symbol?: string | null
          created_at?: string
          currency?: string | null
          from_address?: string | null
          id?: string
          network?: string | null
          status?: string | null
          to_address?: string | null
          transaction_hash?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          address: string | null
          address_index: number | null
          asset_symbol: string
          balance: number | null
          balance_crypto: number | null
          balance_fiat: number | null
          created_at: string
          derivation_path: string | null
          id: string
          is_active: boolean | null
          network: string | null
          nickname: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
          wallet_name: string | null
        }
        Insert: {
          address?: string | null
          address_index?: number | null
          asset_symbol: string
          balance?: number | null
          balance_crypto?: number | null
          balance_fiat?: number | null
          created_at?: string
          derivation_path?: string | null
          id?: string
          is_active?: boolean | null
          network?: string | null
          nickname?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
          wallet_name?: string | null
        }
        Update: {
          address?: string | null
          address_index?: number | null
          asset_symbol?: string
          balance?: number | null
          balance_crypto?: number | null
          balance_fiat?: number | null
          created_at?: string
          derivation_path?: string | null
          id?: string
          is_active?: boolean | null
          network?: string | null
          nickname?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
          wallet_name?: string | null
        }
        Relationships: []
      }
      visitor_activity: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          event_data: Json | null
          event_type: string | null
          id: string
          ip_address: string | null
          os: string | null
          page_title: string | null
          page_url: string | null
          referrer: string | null
          screen_resolution: string | null
          session_id: string | null
          timestamp: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          event_data?: Json | null
          event_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_title?: string | null
          page_url?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          session_id?: string | null
          timestamp?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          event_data?: Json | null
          event_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_title?: string | null
          page_url?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          session_id?: string | null
          timestamp?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_is_admin: { Args: { check_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
