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
      alerts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          resolved: boolean
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          acquired_at: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          authentication_status: Database["public"]["Enums"]["auth_status"]
          created_at: string
          current_value: number | null
          id: string
          name: string
          notes: string | null
          owner_id: string
          photos: string[] | null
          purchase_value: number
          purity: number | null
          serial_number: string
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
          vault_id: string | null
          weight_g: number
        }
        Insert: {
          acquired_at?: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          authentication_status?: Database["public"]["Enums"]["auth_status"]
          created_at?: string
          current_value?: number | null
          id?: string
          name: string
          notes?: string | null
          owner_id: string
          photos?: string[] | null
          purchase_value: number
          purity?: number | null
          serial_number: string
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          vault_id?: string | null
          weight_g: number
        }
        Update: {
          acquired_at?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"]
          authentication_status?: Database["public"]["Enums"]["auth_status"]
          created_at?: string
          current_value?: number | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string
          photos?: string[] | null
          purchase_value?: number
          purity?: number | null
          serial_number?: string
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
          vault_id?: string | null
          weight_g?: number
        }
        Relationships: [
          {
            foreignKeyName: "assets_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      price_snapshots: {
        Row: {
          change_pct_24h: number | null
          id: string
          metal: string
          price_usd_per_oz: number
          recorded_at: string
        }
        Insert: {
          change_pct_24h?: number | null
          id?: string
          metal: string
          price_usd_per_oz: number
          recorded_at?: string
        }
        Update: {
          change_pct_24h?: number | null
          id?: string
          metal?: string
          price_usd_per_oz?: number
          recorded_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          biometric_enabled: boolean
          created_at: string
          display_name: string | null
          id: string
          identity_verified: boolean
          mfa_enabled: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          biometric_enabled?: boolean
          created_at?: string
          display_name?: string | null
          id: string
          identity_verified?: boolean
          mfa_enabled?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          biometric_enabled?: boolean
          created_at?: string
          display_name?: string | null
          id?: string
          identity_verified?: boolean
          mfa_enabled?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          asset_id: string | null
          asset_name: string | null
          created_at: string
          from_vault_id: string | null
          hash: string | null
          id: string
          notes: string | null
          to_vault_id: string | null
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
          value: number | null
          weight_g: number | null
        }
        Insert: {
          asset_id?: string | null
          asset_name?: string | null
          created_at?: string
          from_vault_id?: string | null
          hash?: string | null
          id?: string
          notes?: string | null
          to_vault_id?: string | null
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
          value?: number | null
          weight_g?: number | null
        }
        Update: {
          asset_id?: string | null
          asset_name?: string | null
          created_at?: string
          from_vault_id?: string | null
          hash?: string | null
          id?: string
          notes?: string | null
          to_vault_id?: string | null
          type?: Database["public"]["Enums"]["txn_type"]
          user_id?: string
          value?: number | null
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_from_vault_id_fkey"
            columns: ["from_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_vault_id_fkey"
            columns: ["to_vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaults: {
        Row: {
          active: boolean
          address: string | null
          capacity_kg: number | null
          code: string
          created_at: string
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          name: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          capacity_kg?: number | null
          code: string
          created_at?: string
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
        }
        Update: {
          active?: boolean
          address?: string | null
          capacity_kg?: number | null
          code?: string
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
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
      alert_severity: "low" | "medium" | "high" | "critical"
      app_role: "admin" | "moderator" | "user"
      asset_status: "stored" | "in_transit" | "withdrawn" | "pending"
      asset_type:
        | "gold"
        | "silver"
        | "platinum"
        | "palladium"
        | "diamond"
        | "other"
      auth_status: "verified" | "pending" | "unverified"
      txn_type:
        | "registration"
        | "deposit"
        | "withdrawal"
        | "transfer"
        | "ownership_change"
        | "revaluation"
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
      alert_severity: ["low", "medium", "high", "critical"],
      app_role: ["admin", "moderator", "user"],
      asset_status: ["stored", "in_transit", "withdrawn", "pending"],
      asset_type: [
        "gold",
        "silver",
        "platinum",
        "palladium",
        "diamond",
        "other",
      ],
      auth_status: ["verified", "pending", "unverified"],
      txn_type: [
        "registration",
        "deposit",
        "withdrawal",
        "transfer",
        "ownership_change",
        "revaluation",
      ],
    },
  },
} as const
