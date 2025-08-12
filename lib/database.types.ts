export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          resume_url: string | null;
          resume_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_url?: string | null;
          resume_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_url?: string | null;
          resume_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      interviews: {
        Row: {
          id: string;
          user_id: string;
          job_title: string;
          job_description: string | null;
          user_summary: string;
          job_summary: string;
          mentor_id: string | null;
          status: 'scheduled' | 'in-progress' | 'completed';
          start_date_time: string | null;
          end_date_time: string | null;
          duration_minutes: number | null;
          overall_score: number | null;
          technical_score: number | null;
          communication_score: number | null;
          problem_solving_score: number | null;
          feedback: string | null;
          strengths: string[] | null;
          improvements: string[] | null;
          key_highlights: string[] | null;
          transcript: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_title: string;
          job_description?: string | null;
          user_summary: string;
          job_summary: string;
          mentor_id?: string | null;
          status?: 'scheduled' | 'in-progress' | 'completed';
          start_date_time?: string | null;
          end_date_time?: string | null;
          duration_minutes?: number | null;
          overall_score?: number | null;
          technical_score?: number | null;
          communication_score?: number | null;
          problem_solving_score?: number | null;
          feedback?: string | null;
          strengths?: string[] | null;
          improvements?: string[] | null;
          key_highlights?: string[] | null;
          transcript?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_title?: string;
          job_description?: string | null;
          user_summary?: string;
          job_summary?: string;
          mentor_id?: string | null;
          status?: 'scheduled' | 'in-progress' | 'completed';
          start_date_time?: string | null;
          end_date_time?: string | null;
          duration_minutes?: number | null;
          overall_score?: number | null;
          technical_score?: number | null;
          communication_score?: number | null;
          problem_solving_score?: number | null;
          feedback?: string | null;
          strengths?: string[] | null;
          improvements?: string[] | null;
          key_highlights?: string[] | null;
          transcript?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}