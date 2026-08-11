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
          archived_at: string | null
          brief: string | null
          created_at: string
          id: string
          title: string
          week_id: string | null
        }
        Insert: {
          archived_at?: string | null
          brief?: string | null
          created_at?: string
          id?: string
          title: string
          week_id?: string | null
        }
        Update: {
          archived_at?: string | null
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
          archived_at: string | null
          college_id: string
          id: string
          issued_at: string
          path_id: string | null
          serial: string
          student_id: string
          title: string
        }
        Insert: {
          archived_at?: string | null
          college_id: string
          id?: string
          issued_at?: string
          path_id?: string | null
          serial: string
          student_id: string
          title: string
        }
        Update: {
          archived_at?: string | null
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
          archived_at: string | null
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
          archived_at?: string | null
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
          archived_at?: string | null
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
      college_courses: {
        Row: {
          college_id: string
          course_code: string
          created_at: string
          id: string
        }
        Insert: {
          college_id: string
          course_code: string
          created_at?: string
          id?: string
        }
        Update: {
          college_id?: string
          course_code?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_courses_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_courses_course_code_fkey"
            columns: ["course_code"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["code"]
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
          archived_at: string | null
          city: string | null
          code: string
          college_code: string | null
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          name: string
          officer_email: string | null
          officer_name: string | null
          officer_phone: string | null
        }
        Insert: {
          archived_at?: string | null
          city?: string | null
          code: string
          college_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          officer_email?: string | null
          officer_name?: string | null
          officer_phone?: string | null
        }
        Update: {
          archived_at?: string | null
          city?: string | null
          code?: string
          college_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          officer_email?: string | null
          officer_name?: string | null
          officer_phone?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      learning_path_courses: {
        Row: {
          course_code: string
          created_at: string
          id: string
          path_id: string
        }
        Insert: {
          course_code: string
          created_at?: string
          id?: string
          path_id: string
        }
        Update: {
          course_code?: string
          created_at?: string
          id?: string
          path_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_courses_course_code_fkey"
            columns: ["course_code"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "learning_path_courses_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          archived_at: string | null
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
          archived_at?: string | null
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
          archived_at?: string | null
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
          archived_at: string | null
          correct_index: number
          explanation: string | null
          id: string
          options: Json
          position: number
          question: string
          week_id: string
        }
        Insert: {
          archived_at?: string | null
          correct_index?: number
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          question: string
          week_id: string
        }
        Update: {
          archived_at?: string | null
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
          attempt_number: number
          auto_submitted: boolean
          college_id: string
          created_at: string
          duration_seconds: number | null
          fullscreen_exit_count: number
          id: string
          score: number
          started_at: string | null
          student_id: string
          submitted_at: string | null
          tab_switch_count: number
          test_id: string
          time_taken_seconds: number | null
          total: number
          violations: Json
        }
        Insert: {
          answers?: Json
          attempt_number?: number
          auto_submitted?: boolean
          college_id: string
          created_at?: string
          duration_seconds?: number | null
          fullscreen_exit_count?: number
          id?: string
          score?: number
          started_at?: string | null
          student_id: string
          submitted_at?: string | null
          tab_switch_count?: number
          test_id: string
          time_taken_seconds?: number | null
          total?: number
          violations?: Json
        }
        Update: {
          answers?: Json
          attempt_number?: number
          auto_submitted?: boolean
          college_id?: string
          created_at?: string
          duration_seconds?: number | null
          fullscreen_exit_count?: number
          id?: string
          score?: number
          started_at?: string | null
          student_id?: string
          submitted_at?: string | null
          tab_switch_count?: number
          test_id?: string
          time_taken_seconds?: number | null
          total?: number
          violations?: Json
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
          archived_at: string | null
          created_at: string
          description: string | null
          difficulty: string
          duration_minutes: number
          end_at: string | null
          id: string
          instructions: string | null
          is_published: boolean
          max_attempts: number
          max_violations: number
          passing_marks: number | null
          start_at: string | null
          target_course: string | null
          target_semester: number | null
          title: string
          total_marks: number | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          end_at?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_attempts?: number
          max_violations?: number
          passing_marks?: number | null
          start_at?: string | null
          target_course?: string | null
          target_semester?: number | null
          title: string
          total_marks?: number | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          end_at?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_attempts?: number
          max_violations?: number
          passing_marks?: number | null
          start_at?: string | null
          target_course?: string | null
          target_semester?: number | null
          title?: string
          total_marks?: number | null
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
          archived_at: string | null
          college_id: string
          created_at: string
          deadline: string | null
          demo_url: string | null
          description: string | null
          docs_url: string | null
          file_url: string | null
          github_url: string | null
          id: string
          name: string
          objectives: string | null
          project_id: string | null
          review_note: string | null
          reviewed_at: string | null
          score: number | null
          status: string
          student_id: string
          tech_stack: string | null
        }
        Insert: {
          archived_at?: string | null
          college_id: string
          created_at?: string
          deadline?: string | null
          demo_url?: string | null
          description?: string | null
          docs_url?: string | null
          file_url?: string | null
          github_url?: string | null
          id?: string
          name: string
          objectives?: string | null
          project_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          score?: number | null
          status?: string
          student_id: string
          tech_stack?: string | null
        }
        Update: {
          archived_at?: string | null
          college_id?: string
          created_at?: string
          deadline?: string | null
          demo_url?: string | null
          description?: string | null
          docs_url?: string | null
          file_url?: string | null
          github_url?: string | null
          id?: string
          name?: string
          objectives?: string | null
          project_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          score?: number | null
          status?: string
          student_id?: string
          tech_stack?: string | null
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
          archived_at: string | null
          brief: string | null
          created_at: string
          id: string
          title: string
          week_id: string | null
        }
        Insert: {
          archived_at?: string | null
          brief?: string | null
          created_at?: string
          id?: string
          title: string
          week_id?: string | null
        }
        Update: {
          archived_at?: string | null
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
          archived_at: string | null
          coding_score: number
          college_id: string
          course: string | null
          created_at: string
          department: string
          email: string
          id: string
          learning_progress: number
          mock_score: number
          name: string
          placement_readiness: number
          profile_id: string | null
          section: string | null
          semester: number
          usn: string
        }
        Insert: {
          archived_at?: string | null
          coding_score?: number
          college_id: string
          course?: string | null
          created_at?: string
          department?: string
          email: string
          id?: string
          learning_progress?: number
          mock_score?: number
          name: string
          placement_readiness?: number
          profile_id?: string | null
          section?: string | null
          semester?: number
          usn: string
        }
        Update: {
          archived_at?: string | null
          coding_score?: number
          college_id?: string
          course?: string | null
          created_at?: string
          department?: string
          email?: string
          id?: string
          learning_progress?: number
          mock_score?: number
          name?: string
          placement_readiness?: number
          profile_id?: string | null
          section?: string | null
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
          archived_at: string | null
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
          archived_at?: string | null
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
          archived_at?: string | null
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
      build_college_code: {
        Args: { _city: string; _code: string }
        Returns: string
      }
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
