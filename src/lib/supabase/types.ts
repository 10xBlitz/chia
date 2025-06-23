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
      banner: {
        Row: {
          banner_type: Database["public"]["Enums"]["banner_type"]
          created_at: string
          id: string
          image: string
          title: string | null
        }
        Insert: {
          banner_type: Database["public"]["Enums"]["banner_type"]
          created_at?: string
          id?: string
          image: string
          title?: string | null
        }
        Update: {
          banner_type?: Database["public"]["Enums"]["banner_type"]
          created_at?: string
          id?: string
          image?: string
          title?: string | null
        }
        Relationships: []
      }
      bid: {
        Row: {
          additional_explanation: string | null
          clinic_treatment_id: string
          created_at: string
          expected_price: number
          id: string
          quotation_id: string
          recommend_quick_visit: boolean
          status: Database["public"]["Enums"]["record_status"]
        }
        Insert: {
          additional_explanation?: string | null
          clinic_treatment_id: string
          created_at?: string
          expected_price: number
          id?: string
          quotation_id: string
          recommend_quick_visit: boolean
          status?: Database["public"]["Enums"]["record_status"]
        }
        Update: {
          additional_explanation?: string | null
          clinic_treatment_id?: string
          created_at?: string
          expected_price?: number
          id?: string
          quotation_id?: string
          recommend_quick_visit?: boolean
          status?: Database["public"]["Enums"]["record_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bid_clinic_treatment_id_fkey"
            columns: ["clinic_treatment_id"]
            isOneToOne: false
            referencedRelation: "clinic_treatment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room: {
        Row: {
          category: string
          created_at: string
          id: string
          last_admin_read_at: string | null
          last_user_read_at: string | null
          patient_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          last_admin_read_at?: string | null
          last_user_read_at?: string | null
          patient_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_admin_read_at?: string | null
          last_user_read_at?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic: {
        Row: {
          clinic_name: string
          contact_number: string
          created_at: string
          id: string
          link: string | null
          location: string
          opening_date: string
          pictures: string[] | null
          region: string
        }
        Insert: {
          clinic_name: string
          contact_number: string
          created_at?: string
          id?: string
          link?: string | null
          location: string
          opening_date: string
          pictures?: string[] | null
          region: string
        }
        Update: {
          clinic_name?: string
          contact_number?: string
          created_at?: string
          id?: string
          link?: string | null
          location?: string
          opening_date?: string
          pictures?: string[] | null
          region?: string
        }
        Relationships: []
      }
      clinic_department: {
        Row: {
          created_at: string
          department_name: string
          id: string
        }
        Insert: {
          created_at?: string
          department_name: string
          id?: string
        }
        Update: {
          created_at?: string
          department_name?: string
          id?: string
        }
        Relationships: []
      }
      clinic_treatment: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          price: number
          status: Database["public"]["Enums"]["record_status"]
          treatment_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          price: number
          status?: Database["public"]["Enums"]["record_status"]
          treatment_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          price?: number
          status?: Database["public"]["Enums"]["record_status"]
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_treatment_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_treatment_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatment"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_view: {
        Row: {
          clinic_id: string
          created_at: string
          id: number
          patient_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: number
          patient_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: number
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_view_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_view_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      dentist_clinic_department: {
        Row: {
          clinic_department_id: string
          dentist_id: string
          id: string
        }
        Insert: {
          clinic_department_id: string
          dentist_id: string
          id?: string
        }
        Update: {
          clinic_department_id?: string
          dentist_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentist_clinic_department_clinic_department_id_fkey"
            columns: ["clinic_department_id"]
            isOneToOne: false
            referencedRelation: "clinic_department"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dentist_clinic_department_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      event: {
        Row: {
          clinic_treatment_id: string
          created_at: string
          date_range: unknown
          description: string | null
          discount: number
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          clinic_treatment_id: string
          created_at?: string
          date_range: unknown
          description?: string | null
          discount: number
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          clinic_treatment_id?: string
          created_at?: string
          date_range?: unknown
          description?: string | null
          discount?: number
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_clinic_treatment_id_fkey"
            columns: ["clinic_treatment_id"]
            isOneToOne: false
            referencedRelation: "clinic_treatment"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_clinic: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          patient_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          patient_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_clinic_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_clinic_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      message: {
        Row: {
          chat_room_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_room"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          payment_method: string
          reservation_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          payment_method: string
          reservation_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          payment_method?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservation"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation: {
        Row: {
          birthdate: string
          clinic_id: string | null
          concern: string | null
          created_at: string
          gender: string
          id: string
          image_url: string[] | null
          name: string
          patient_id: string
          region: string
          residence: string
          status: Database["public"]["Enums"]["record_status"]
          treatment_id: string | null
        }
        Insert: {
          birthdate: string
          clinic_id?: string | null
          concern?: string | null
          created_at?: string
          gender: string
          id?: string
          image_url?: string[] | null
          name: string
          patient_id: string
          region: string
          residence: string
          status?: Database["public"]["Enums"]["record_status"]
          treatment_id?: string | null
        }
        Update: {
          birthdate?: string
          clinic_id?: string | null
          concern?: string | null
          created_at?: string
          gender?: string
          id?: string
          image_url?: string[] | null
          name?: string
          patient_id?: string
          region?: string
          residence?: string
          status?: Database["public"]["Enums"]["record_status"]
          treatment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatment"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation: {
        Row: {
          clinic_treatment_id: string
          consultation_type: string
          contact_number: string
          dentist_id: string | null
          id: string
          patient_id: string
          reservation_date: string
          reservation_time: string
          status: string
        }
        Insert: {
          clinic_treatment_id: string
          consultation_type: string
          contact_number?: string
          dentist_id?: string | null
          id?: string
          patient_id: string
          reservation_date: string
          reservation_time: string
          status?: string
        }
        Update: {
          clinic_treatment_id?: string
          consultation_type?: string
          contact_number?: string
          dentist_id?: string | null
          id?: string
          patient_id?: string
          reservation_date?: string
          reservation_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_clinic_treatment_id_fkey"
            columns: ["clinic_treatment_id"]
            isOneToOne: false
            referencedRelation: "clinic_treatment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      review: {
        Row: {
          clinic_treatment_id: string
          created_at: string
          id: string
          images: string[] | null
          patient_id: string
          rating: number
          review: string | null
        }
        Insert: {
          clinic_treatment_id: string
          created_at?: string
          id?: string
          images?: string[] | null
          patient_id: string
          rating: number
          review?: string | null
        }
        Update: {
          clinic_treatment_id?: string
          created_at?: string
          id?: string
          images?: string[] | null
          patient_id?: string
          rating?: number
          review?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_clinic_treatment_id_fkey"
            columns: ["clinic_treatment_id"]
            isOneToOne: false
            referencedRelation: "clinic_treatment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          status: Database["public"]["Enums"]["record_status"]
          treatment_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          treatment_name: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          treatment_name?: string
        }
        Relationships: []
      }
      user: {
        Row: {
          birthdate: string
          clinic_id: string | null
          contact_number: string
          created_at: string
          full_name: string
          gender: string
          id: string
          login_status: Database["public"]["Enums"]["login_status"]
          residence: string
          role: Database["public"]["Enums"]["user_role"]
          work_place: string
        }
        Insert: {
          birthdate: string
          clinic_id?: string | null
          contact_number: string
          created_at?: string
          full_name: string
          gender: string
          id: string
          login_status?: Database["public"]["Enums"]["login_status"]
          residence: string
          role: Database["public"]["Enums"]["user_role"]
          work_place: string
        }
        Update: {
          birthdate?: string
          clinic_id?: string | null
          contact_number?: string
          created_at?: string
          full_name?: string
          gender?: string
          id?: string
          login_status?: Database["public"]["Enums"]["login_status"]
          residence?: string
          role?: Database["public"]["Enums"]["user_role"]
          work_place?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hour: {
        Row: {
          clinic_id: string
          created_at: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          id: string
          note: string | null
          time_open: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          id?: string
          note?: string | null
          time_open: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          id?: string
          note?: string | null
          time_open?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hour_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fetch_rooms_by_latest_message: {
        Args:
          | { p_search?: string; p_limit?: number; p_offset?: number }
          | {
              p_user_id: string
              p_search?: string
              p_limit?: number
              p_offset?: number
            }
        Returns: {
          id: string
          category: string
          patient_full_name: string
          last_admin_read_at: string
          last_patient_read_at: string
          latest_message_created_at: string
        }[]
      }
    }
    Enums: {
      banner_type: "main" | "sub"
      day_of_week:
        | "일요일"
        | "월요일"
        | "화요일"
        | "수요일"
        | "목요일"
        | "금요일"
        | "토요일"
        | "점심시간"
      login_status: "active" | "inactive"
      record_status: "deleted" | "active"
      user_role: "patient" | "dentist" | "admin" | "dentist employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      banner_type: ["main", "sub"],
      day_of_week: [
        "일요일",
        "월요일",
        "화요일",
        "수요일",
        "목요일",
        "금요일",
        "토요일",
        "점심시간",
      ],
      login_status: ["active", "inactive"],
      record_status: ["deleted", "active"],
      user_role: ["patient", "dentist", "admin", "dentist employee"],
    },
  },
} as const
