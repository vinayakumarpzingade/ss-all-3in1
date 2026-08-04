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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      assignment_submissions: {
        Row: {
          assignment_id: string
          college_id: string
          content: string
          created_at: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          assignment_id: string
          college_id: string
          content?: string
          created_at?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          assignment_id?: string
          college_id?: string
          content?: string
          created_at?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          brief: string | null
          created_at: string
          id: string
          title: string
          week_id: string | null
        }
        Insert: {
          brief?: string | null
          created_at?: string
          id?: string
          title: string
          week_id?: string | null
        }
        Update: {
          brief?: string | null
          created_at?: string
          id?: string
          title?: string
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          college_id: string
          id: string
          issued_at: string
          path_id: string | null
          serial: string
          student_id: string
          title: string
        }
        Insert: {
          college_id: string
          id?: string
          issued_at?: string
          path_id?: string | null
          serial: string
          student_id: string
          title: string
        }
        Update: {
          college_id?: string
          id?: string
          issued_at?: string
          path_id?: string | null
          serial?: string
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_questions: {
        Row: {
          difficulty: string
          expected_output: string | null
          id: string
          language: string
          path_id: string | null
          points: number
          position: number
          prompt: string
          starter_code: string | null
          title: string
          week_id: string | null
        }
        Insert: {
          difficulty?: string
          expected_output?: string | null
          id?: string
          language?: string
          path_id?: string | null
          points?: number
          position?: number
          prompt?: string
          starter_code?: string | null
          title: string
          week_id?: string | null
        }
        Update: {
          difficulty?: string
          expected_output?: string | null
          id?: string
          language?: string
          path_id?: string | null
          points?: number
          position?: number
          prompt?: string
          starter_code?: string | null
          title?: string
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coding_questions_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coding_questions_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_submissions: {
        Row: {
          code: string
          college_id: string
          created_at: string
          id: string
          language: string
          output: string | null
          passed: boolean
          question_id: string
          score: number
          status: string
          student_id: string
        }
        Insert: {
          code?: string
          college_id: string
          created_at?: string
          id?: string
          language?: string
          output?: string | null
          passed?: boolean
          question_id: string
          score?: number
          status?: string
          student_id: string
        }
        Update: {
          code?: string
          college_id?: string
          created_at?: string
          id?: string
          language?: string
          output?: string | null
          passed?: boolean
          question_id?: string
          score?: number
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_submissions_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coding_submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "coding_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coding_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      college_paths: {
        Row: {
          college_id: string
          created_at: string
          id: string
          path_id: string
        }
        Insert: {
          college_id: string
          created_at?: string
          id?: string
          path_id: string
        }
        Update: {
          college_id?: string
          created_at?: string
          id?: string
          path_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_paths_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_paths_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          city: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          city?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          city?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          course: string | null
          created_at: string
          department: string | null
          description: string | null
          id: string
          is_published: boolean
          semester: number | null
          title: string
        }
        Insert: {
          course?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          semester?: number | null
          title: string
        }
        Update: {
          course?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          semester?: number | null
          title?: string
        }
        Relationships: []
      }
      mcqs: {
        Row: {
          correct_index: number
          explanation: string | null
          id: string
          options: Json
          position: number
          question: string
          week_id: string
        }
        Insert: {
          correct_index?: number
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          question: string
          week_id: string
        }
        Update: {
          correct_index?: number
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          question?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcqs_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_assignments: {
        Row: {
          college_id: string
          created_at: string
          id: string
          test_id: string
        }
        Insert: {
          college_id: string
          created_at?: string
          id?: string
          test_id: string
        }
        Update: {
          college_id?: string
          created_at?: string
          id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_assignments_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_attempts: {
        Row: {
          answers: Json
          college_id: string
          created_at: string
          id: string
          score: number
          student_id: string
          test_id: string
          total: number
        }
        Insert: {
          answers?: Json
          college_id: string
          created_at?: string
          id?: string
          score?: number
          student_id: string
          test_id: string
          total?: number
        }
        Update: {
          answers?: Json
          college_id?: string
          created_at?: string
          id?: string
          score?: number
          student_id?: string
          test_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "mock_attempts_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_questions: {
        Row: {
          correct_index: number
          id: string
          options: Json
          position: number
          question: string
          test_id: string
        }
        Insert: {
          correct_index?: number
          id?: string
          options?: Json
          position?: number
          question: string
          test_id: string
        }
        Update: {
          correct_index?: number
          id?: string
          options?: Json
          position?: number
          question?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_tests: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_published: boolean
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_published?: boolean
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_published?: boolean
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          college_id: string | null
          created_at: string
          id: string
          is_read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          college_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          college_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          college_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          college_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      progress: {
        Row: {
          college_id: string
          completed: boolean
          completed_at: string
          id: string
          kind: Database["public"]["Enums"]["section_kind"]
          student_id: string
          week_id: string
        }
        Insert: {
          college_id: string
          completed?: boolean
          completed_at?: string
          id?: string
          kind: Database["public"]["Enums"]["section_kind"]
          student_id: string
          week_id: string
        }
        Update: {
          college_id?: string
          completed?: boolean
          completed_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["section_kind"]
          student_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_submissions: {
        Row: {
          college_id: string
          created_at: string
          description: string | null
          file_url: string | null
          github_url: string | null
          id: string
          name: string
          project_id: string | null
          review_note: string | null
          status: string
          student_id: string
        }
        Insert: {
          college_id: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          github_url?: string | null
          id?: string
          name: string
          project_id?: string | null
          review_note?: string | null
          status?: string
          student_id: string
        }
        Update: {
          college_id?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          github_url?: string | null
          id?: string
          name?: string
          project_id?: string | null
          review_note?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_submissions_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brief: string | null
          created_at: string
          id: string
          title: string
          week_id: string | null
        }
        Insert: {
          brief?: string | null
          created_at?: string
          id?: string
          title: string
          week_id?: string | null
        }
        Update: {
          brief?: string | null
          created_at?: string
          id?: string
          title?: string
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          coding_score: number
          college_id: string
          created_at: string
          department: string
          email: string
          id: string
          learning_progress: number
          mock_score: number
          name: string
          placement_readiness: number
          profile_id: string | null
          semester: number
          usn: string
        }
        Insert: {
          coding_score?: number
          college_id: string
          created_at?: string
          department?: string
          email: string
          id?: string
          learning_progress?: number
          mock_score?: number
          name: string
          placement_readiness?: number
          profile_id?: string | null
          semester?: number
          usn: string
        }
        Update: {
          coding_score?: number
          college_id?: string
          created_at?: string
          department?: string
          email?: string
          id?: string
          learning_progress?: number
          mock_score?: number
          name?: string
          placement_readiness?: number
          profile_id?: string | null
          semester?: number
          usn?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      week_sections: {
        Row: {
          body: string
          id: string
          items: Json
          kind: Database["public"]["Enums"]["section_kind"]
          position: number
          title: string
          week_id: string
        }
        Insert: {
          body?: string
          id?: string
          items?: Json
          kind: Database["public"]["Enums"]["section_kind"]
          position?: number
          title?: string
          week_id: string
        }
        Update: {
          body?: string
          id?: string
          items?: Json
          kind?: Database["public"]["Enums"]["section_kind"]
          position?: number
          title?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "week_sections_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      weeks: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          path_id: string
          raw_content: string
          title: string
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          path_id: string
          raw_content?: string
          title: string
          updated_at?: string
          week_number: number
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          path_id?: string
          raw_content?: string
          title?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "weeks_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
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
      is_admin: { Args: never; Returns: boolean }
      my_college_id: { Args: never; Returns: string }
      my_student_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "super_admin" | "college" | "student"
      section_kind:
        | "objectives"
        | "cheat_sheet"
        | "mcq"
        | "coding"
        | "mini_project"
        | "assignment"
        | "resources"
        | "interview"
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
      app_role: ["super_admin", "college", "student"],
      section_kind: [
        "objectives",
        "cheat_sheet",
        "mcq",
        "coding",
        "mini_project",
        "assignment",
        "resources",
        "interview",
      ],
    },
  },
} as const
