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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      knowledge_sources: {
        Row: {
          created_at: string
          edges: number
          entities: number
          id: string
          kind: string
          mime: string | null
          name: string
          notes: string | null
          progress: number
          size_bytes: number
          source: string
          status: string
          storage_path: string | null
          tags: string[]
          target_layer: string
          updated_at: string
          uploader_id: string
        }
        Insert: {
          created_at?: string
          edges?: number
          entities?: number
          id?: string
          kind: string
          mime?: string | null
          name: string
          notes?: string | null
          progress?: number
          size_bytes?: number
          source?: string
          status?: string
          storage_path?: string | null
          tags?: string[]
          target_layer?: string
          updated_at?: string
          uploader_id: string
        }
        Update: {
          created_at?: string
          edges?: number
          entities?: number
          id?: string
          kind?: string
          mime?: string | null
          name?: string
          notes?: string | null
          progress?: number
          size_bytes?: number
          source?: string
          status?: string
          storage_path?: string | null
          tags?: string[]
          target_layer?: string
          updated_at?: string
          uploader_id?: string
        }
        Relationships: []
      }
      learning_entries: {
        Row: {
          applied: boolean
          author_id: string
          category: string
          created_at: string
          id: string
          lesson: string
          outcome: string
          rating: number
          request_id: string
          request_title: string
          target_layer: string
        }
        Insert: {
          applied?: boolean
          author_id: string
          category: string
          created_at?: string
          id?: string
          lesson: string
          outcome: string
          rating: number
          request_id: string
          request_title: string
          target_layer: string
        }
        Update: {
          applied?: boolean
          author_id?: string
          category?: string
          created_at?: string
          id?: string
          lesson?: string
          outcome?: string
          rating?: number
          request_id?: string
          request_title?: string
          target_layer?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      retention_audit_entries: {
        Row: {
          actor_id: string | null
          actor_name: string
          after: string
          approver_name: string | null
          before: string
          category_code: string
          category_name: string
          created_at: string
          disposition: string
          field: string
          id: string
          kind: string
          note: string
          records_affected: number
          ts: string
        }
        Insert: {
          actor_id?: string | null
          actor_name: string
          after?: string
          approver_name?: string | null
          before?: string
          category_code: string
          category_name: string
          created_at?: string
          disposition?: string
          field: string
          id?: string
          kind: string
          note?: string
          records_affected?: number
          ts?: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string
          after?: string
          approver_name?: string | null
          before?: string
          category_code?: string
          category_name?: string
          created_at?: string
          disposition?: string
          field?: string
          id?: string
          kind?: string
          note?: string
          records_affected?: number
          ts?: string
        }
        Relationships: []
      }
      secp_archetypes: {
        Row: {
          autonomy: number
          codename: string
          created_at: string
          department: string
          deployed: number
          guardrails: string[]
          id: string
          layer: string
          owner_id: string
          packs: string[]
          role: string
          skills: string[]
          status: string
          trained: number
          updated_at: string
          updated_label: string
        }
        Insert: {
          autonomy: number
          codename: string
          created_at?: string
          department: string
          deployed?: number
          guardrails?: string[]
          id: string
          layer: string
          owner_id?: string
          packs?: string[]
          role: string
          skills?: string[]
          status?: string
          trained?: number
          updated_at?: string
          updated_label?: string
        }
        Update: {
          autonomy?: number
          codename?: string
          created_at?: string
          department?: string
          deployed?: number
          guardrails?: string[]
          id?: string
          layer?: string
          owner_id?: string
          packs?: string[]
          role?: string
          skills?: string[]
          status?: string
          trained?: number
          updated_at?: string
          updated_label?: string
        }
        Relationships: []
      }
      secp_artifacts: {
        Row: {
          agent: string
          checksum: string
          content: string
          created_at: string
          id: string
          inputs: Json
          kind: string
          name: string
          owner_id: string
          request_id: string
          stage: string
        }
        Insert: {
          agent: string
          checksum: string
          content: string
          created_at?: string
          id?: string
          inputs?: Json
          kind?: string
          name: string
          owner_id?: string
          request_id: string
          stage: string
        }
        Update: {
          agent?: string
          checksum?: string
          content?: string
          created_at?: string
          id?: string
          inputs?: Json
          kind?: string
          name?: string
          owner_id?: string
          request_id?: string
          stage?: string
        }
        Relationships: []
      }
      secp_pack_state: {
        Row: {
          pack_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          pack_id: string
          status: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          pack_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      secp_requests: {
        Row: {
          autonomy: number
          brief: string
          created_at: string
          id: string
          origin: string
          owner_id: string
          priority: string
          progress: number
          steps: Json
          title: string
          updated_at: string
          updated_label: string
          validators: Json
        }
        Insert: {
          autonomy: number
          brief: string
          created_at?: string
          id: string
          origin: string
          owner_id?: string
          priority: string
          progress?: number
          steps?: Json
          title: string
          updated_at?: string
          updated_label?: string
          validators?: Json
        }
        Update: {
          autonomy?: number
          brief?: string
          created_at?: string
          id?: string
          origin?: string
          owner_id?: string
          priority?: string
          progress?: number
          steps?: Json
          title?: string
          updated_at?: string
          updated_label?: string
          validators?: Json
        }
        Relationships: []
      }
      secp_tasks: {
        Row: {
          created_at: string
          department: string
          detail: string
          effort_hours: number
          id: string
          owner_id: string
          position: number
          request_id: string
          specialist_id: string
          specialist_role: string
          status: string
          title: string
          updated_at: string
          workstream_id: string
        }
        Insert: {
          created_at?: string
          department?: string
          detail?: string
          effort_hours?: number
          id?: string
          owner_id?: string
          position?: number
          request_id: string
          specialist_id?: string
          specialist_role?: string
          status?: string
          title: string
          updated_at?: string
          workstream_id: string
        }
        Update: {
          created_at?: string
          department?: string
          detail?: string
          effort_hours?: number
          id?: string
          owner_id?: string
          position?: number
          request_id?: string
          specialist_id?: string
          specialist_role?: string
          status?: string
          title?: string
          updated_at?: string
          workstream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secp_tasks_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "secp_workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      secp_workstreams: {
        Row: {
          acceptance: string
          code: string
          created_at: string
          duration_days: number
          id: string
          objective: string
          owner_id: string
          owner_role: string
          position: number
          request_id: string
          risk: string
          title: string
        }
        Insert: {
          acceptance?: string
          code: string
          created_at?: string
          duration_days?: number
          id?: string
          objective?: string
          owner_id?: string
          owner_role?: string
          position?: number
          request_id: string
          risk?: string
          title: string
        }
        Update: {
          acceptance?: string
          code?: string
          created_at?: string
          duration_days?: number
          id?: string
          objective?: string
          owner_id?: string
          owner_role?: string
          position?: number
          request_id?: string
          risk?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
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
      app_role: "admin" | "operator" | "viewer"
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
      app_role: ["admin", "operator", "viewer"],
    },
  },
} as const
