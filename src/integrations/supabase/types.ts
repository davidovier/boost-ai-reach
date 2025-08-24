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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          type?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_metadata: {
        Row: {
          backup_date: string
          backup_time: string | null
          created_at: string | null
          encryption_key_hash: string
          error_message: string | null
          file_path: string
          file_size: number | null
          id: string
          status: string | null
          tables_backed_up: string[]
        }
        Insert: {
          backup_date: string
          backup_time?: string | null
          created_at?: string | null
          encryption_key_hash: string
          error_message?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          status?: string | null
          tables_backed_up: string[]
        }
        Update: {
          backup_date?: string
          backup_time?: string | null
          created_at?: string | null
          encryption_key_hash?: string
          error_message?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          status?: string | null
          tables_backed_up?: string[]
        }
        Relationships: []
      }
      competitor_snapshots: {
        Row: {
          ai_findability_score: number | null
          competitor_id: string
          id: string
          metadata: Json | null
          schema_data: Json | null
          snapshot_date: string
        }
        Insert: {
          ai_findability_score?: number | null
          competitor_id: string
          id?: string
          metadata?: Json | null
          schema_data?: Json | null
          snapshot_date?: string
        }
        Update: {
          ai_findability_score?: number | null
          competitor_id?: string
          id?: string
          metadata?: Json | null
          schema_data?: Json | null
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_snapshots_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          created_at: string
          domain: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_configs: {
        Row: {
          config: Json
          created_at: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          feature_key: string
          id: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_key: string
          id?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_key?: string
          id?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          id: number
          max_competitors: number | null
          max_prompts: number | null
          max_scans: number | null
          max_sites: number | null
          name: Database["public"]["Enums"]["subscription_plan"]
          price: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          max_competitors?: number | null
          max_prompts?: number | null
          max_scans?: number | null
          max_sites?: number | null
          name: Database["public"]["Enums"]["subscription_plan"]
          price?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          max_competitors?: number | null
          max_prompts?: number | null
          max_scans?: number | null
          max_sites?: number | null
          name?: Database["public"]["Enums"]["subscription_plan"]
          price?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      prompt_simulations: {
        Row: {
          id: string
          includes_user_site: boolean | null
          prompt: string
          result: Json | null
          run_date: string
          user_id: string
        }
        Insert: {
          id?: string
          includes_user_site?: boolean | null
          prompt: string
          result?: Json | null
          run_date?: string
          user_id: string
        }
        Update: {
          id?: string
          includes_user_site?: boolean | null
          prompt?: string
          result?: Json | null
          run_date?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_attempted_at: string | null
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          retry_count: number
          site_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempted_at?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          retry_count?: number
          site_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempted_at?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          retry_count?: number
          site_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          ai_findability_score: number | null
          crawlability_score: number | null
          created_at: string
          id: string
          metadata: Json | null
          performance: Json | null
          scan_date: string
          schema_data: Json | null
          site_id: string
          summarizability_score: number | null
        }
        Insert: {
          ai_findability_score?: number | null
          crawlability_score?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          performance?: Json | null
          scan_date?: string
          schema_data?: Json | null
          site_id: string
          summarizability_score?: number | null
        }
        Update: {
          ai_findability_score?: number | null
          crawlability_score?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          performance?: Json | null
          scan_date?: string
          schema_data?: Json | null
          site_id?: string
          summarizability_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      security_config_status: {
        Row: {
          configuration_item: string
          id: number
          required_action: string
          status: string
          updated_at: string | null
        }
        Insert: {
          configuration_item: string
          id?: number
          required_action: string
          status: string
          updated_at?: string | null
        }
        Update: {
          configuration_item?: string
          id?: number
          required_action?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sites: {
        Row: {
          created_at: string
          id: string
          name: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tips: {
        Row: {
          created_at: string
          description: string | null
          id: number
          scan_id: string
          severity: Database["public"]["Enums"]["tip_severity"]
          status: Database["public"]["Enums"]["tip_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          scan_id: string
          severity?: Database["public"]["Enums"]["tip_severity"]
          status?: Database["public"]["Enums"]["tip_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          scan_id?: string
          severity?: Database["public"]["Enums"]["tip_severity"]
          status?: Database["public"]["Enums"]["tip_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tips_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_metrics: {
        Row: {
          competitor_count: number
          created_at: string
          id: string
          last_reset: string
          prompt_count: number
          report_count: number
          scan_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          competitor_count?: number
          created_at?: string
          id?: string
          last_reset?: string
          prompt_count?: number
          report_count?: number
          scan_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          competitor_count?: number
          created_at?: string
          id?: string
          last_reset?: string
          prompt_count?: number
          report_count?: number
          scan_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          occurred_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_usage_limit: {
        Args: { limit_type: string; user_id: string }
        Returns: boolean
      }
      cleanup_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_plan_limits: {
        Args: { user_id: string }
        Returns: {
          max_competitors: number
          max_prompts: number
          max_scans: number
          max_sites: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_manager_or_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "manager" | "admin"
      report_status: "queued" | "running" | "success" | "failed"
      subscription_plan: "free" | "pro" | "growth" | "enterprise"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "unpaid"
        | "trialing"
      tip_severity: "low" | "medium" | "high"
      tip_status: "todo" | "done"
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
      app_role: ["user", "manager", "admin"],
      report_status: ["queued", "running", "success", "failed"],
      subscription_plan: ["free", "pro", "growth", "enterprise"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "unpaid",
        "trialing",
      ],
      tip_severity: ["low", "medium", "high"],
      tip_status: ["todo", "done"],
    },
  },
} as const
