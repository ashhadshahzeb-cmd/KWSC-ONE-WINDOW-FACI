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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      },
      contractors: {
        Row: {
          id: string
          created_at: string
          budget_year: string | null
          budget_head: string | null
          pmr_voucher: string | null
          contractor_name: string | null
          party_code: string | null
          city_town: string | null
          voucher_no: string | null
          cheque_no: string | null
          balance_amount: number | null
          water_charges: number | null
          security_deposit: number | null
          gst_other: number | null
          income_tax: number | null
          gross_amount: number | null
          net_amount: number | null
          bill_passed_on: string | null
          payment_date: string | null
          work_description: string | null
          vendor_type: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          budget_year?: string | null
          budget_head?: string | null
          pmr_voucher?: string | null
          contractor_name?: string | null
          party_code?: string | null
          city_town?: string | null
          voucher_no?: string | null
          cheque_no?: string | null
          balance_amount?: number | null
          water_charges?: number | null
          security_deposit?: number | null
          gst_other?: number | null
          income_tax?: number | null
          gross_amount?: number | null
          net_amount?: number | null
          bill_passed_on?: string | null
          payment_date?: string | null
          work_description?: string | null
          vendor_type?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          budget_year?: string | null
          budget_head?: string | null
          pmr_voucher?: string | null
          contractor_name?: string | null
          party_code?: string | null
          city_town?: string | null
          voucher_no?: string | null
          cheque_no?: string | null
          balance_amount?: number | null
          water_charges?: number | null
          security_deposit?: number | null
          gst_other?: number | null
          income_tax?: number | null
          gross_amount?: number | null
          net_amount?: number | null
          bill_passed_on?: string | null
          payment_date?: string | null
          work_description?: string | null
          vendor_type?: string | null
        }
        Relationships: []
      }
      book_section_employees: {
        Row: {
          id: string
          created_at: string
          serial_no: string | null
          employee_no: string | null
          pension_no: string | null
          full_name: string
          cnic_no: string | null
          nominees: string | null
          appointment_date: string | null
          retired_date: string | null
          disbursed_date: string | null
          category: string
          sub_category_regular: string | null
          sub_category_retired: string | null
          status: string | null
          bank_details: string | null
          total_amount: number | null
          balance_amount: number | null
          cheque_amount: number | null
          amount_in_words: string | null
          photo_url: string | null
          nature_of_bill: string | null
          pmr_no: string | null
          cheque_date: string | null
          cheque_break_up: string | null
          cheque_no: string | null
          paid_amount: number | null
          deduction: number | null
          passing_date: string | null
          entry_date: string | null
          payment_date: string | null
          ref_care_of: string | null
          fund_amount: number | null
          sal_amount: number | null
          pen_amount: number | null
          lpr_amount: number | null
          disb_amount: number | null
          med_amount: number | null
          gins_amount: number | null
          other_amount: number | null
          total_disbursement: number | null
          bank_status: string | null
          pmr_date: string | null
          source_tab: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          serial_no?: string | null
          employee_no?: string | null
          pension_no?: string | null
          full_name: string
          cnic_no?: string | null
          nominees?: string | null
          appointment_date?: string | null
          retired_date?: string | null
          disbursed_date?: string | null
          category: string
          sub_category_regular?: string | null
          sub_category_retired?: string | null
          status?: string | null
          bank_details?: string | null
          total_amount?: number | null
          balance_amount?: number | null
          cheque_amount?: number | null
          amount_in_words?: string | null
          photo_url?: string | null
          nature_of_bill?: string | null
          pmr_no?: string | null
          cheque_date?: string | null
          cheque_break_up?: string | null
          cheque_no?: string | null
          paid_amount?: number | null
          deduction?: number | null
          passing_date?: string | null
          entry_date?: string | null
          payment_date?: string | null
          ref_care_of?: string | null
          fund_amount?: number | null
          sal_amount?: number | null
          pen_amount?: number | null
          lpr_amount?: number | null
          disb_amount?: number | null
          med_amount?: number | null
          gins_amount?: number | null
          other_amount?: number | null
          total_disbursement?: number | null
          bank_status?: string | null
          pmr_date?: string | null
          source_tab?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          serial_no?: string | null
          employee_no?: string | null
          pension_no?: string | null
          full_name?: string
          cnic_no?: string | null
          nominees?: string | null
          appointment_date?: string | null
          retired_date?: string | null
          disbursed_date?: string | null
          category?: string
          sub_category_regular?: string | null
          sub_category_retired?: string | null
          status?: string | null
          bank_details?: string | null
          total_amount?: number | null
          balance_amount?: number | null
          cheque_amount?: number | null
          amount_in_words?: string | null
          photo_url?: string | null
          nature_of_bill?: string | null
          pmr_no?: string | null
          cheque_date?: string | null
          cheque_break_up?: string | null
          cheque_no?: string | null
          paid_amount?: number | null
          deduction?: number | null
          passing_date?: string | null
          entry_date?: string | null
          payment_date?: string | null
          ref_care_of?: string | null
          fund_amount?: number | null
          sal_amount?: number | null
          pen_amount?: number | null
          lpr_amount?: number | null
          disb_amount?: number | null
          med_amount?: number | null
          gins_amount?: number | null
          other_amount?: number | null
          total_disbursement?: number | null
          bank_status?: string | null
          pmr_date?: string | null
          source_tab?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
