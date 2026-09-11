export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Enums: {
      exercise_kind:
        | 'weight_reps'
        | 'bodyweight_reps'
        | 'weighted_bodyweight'
        | 'duration'
        | 'distance_duration';
      group_role: 'owner' | 'member';
      pr_type: 'heaviest_weight' | 'best_e1rm' | 'most_reps';
      set_type: 'normal' | 'warmup' | 'dropset' | 'failure';
      unit_system: 'metric' | 'imperial';
    };
    Tables: {
      exercises: {
        Row: {
          id: string;
          group_id: string | null;
          name: string;
          kind: Database['public']['Enums']['exercise_kind'];
          primary_muscle: string;
          equipment: string | null;
          is_archived: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          name: string;
          kind: Database['public']['Enums']['exercise_kind'];
          primary_muscle: string;
          equipment?: string | null;
          is_archived?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: Database['public']['Enums']['group_role'];
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: Database['public']['Enums']['group_role'];
          joined_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['group_members']['Insert']
        >;
      };
      groups: {
        Row: {
          id: string;
          name: string;
          join_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          join_code?: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['groups']['Insert']>;
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          type: Database['public']['Enums']['pr_type'];
          value: number;
          set_id: string | null;
          workout_id: string | null;
          achieved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          type: Database['public']['Enums']['pr_type'];
          value: number;
          set_id?: string | null;
          workout_id?: string | null;
          achieved_at: string;
        };
        Update: Partial<
          Database['public']['Tables']['personal_records']['Insert']
        >;
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          unit_preference: Database['public']['Enums']['unit_system'];
          bodyweight_kg: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          unit_preference?: Database['public']['Enums']['unit_system'];
          bodyweight_kg?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          position: number;
          set_type: Database['public']['Enums']['set_type'];
          weight_kg: number | null;
          reps: number | null;
          duration_seconds: number | null;
          distance_m: number | null;
          rpe: number | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          position: number;
          set_type?: Database['public']['Enums']['set_type'];
          weight_kg?: number | null;
          reps?: number | null;
          duration_seconds?: number | null;
          distance_m?: number | null;
          rpe?: number | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sets']['Insert']>;
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          position: number;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          position: number;
          notes?: string | null;
          updated_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['workout_exercises']['Insert']
        >;
      };
      workout_shares: {
        Row: {
          workout_id: string;
          group_id: string;
        };
        Insert: {
          workout_id: string;
          group_id: string;
        };
        Update: Partial<
          Database['public']['Tables']['workout_shares']['Insert']
        >;
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          started_at: string;
          ended_at: string | null;
          notes: string | null;
          bodyweight_kg: number;
          bodyweight_estimated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
          bodyweight_kg: number;
          bodyweight_estimated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workouts']['Insert']>;
      };
    };
    Functions: {
      create_group: {
        Args: { p_name: string };
        Returns: Database['public']['Tables']['groups']['Row'];
      };
      delete_workout: {
        Args: { p_workout_id: string };
        Returns: void;
      };
      finish_workout: {
        Args: { p_workout_id: string };
        Returns: Json;
      };
      join_group_with_code: {
        Args: { p_code: string };
        Returns: Database['public']['Tables']['groups']['Row'];
      };
      last_performance: {
        Args: { p_exercise_id: string };
        Returns: Json;
      };
      recompute_prs_for_exercise: {
        Args: { p_user_id: string; p_exercise_id: string };
        Returns: void;
      };
      start_workout: {
        Args: { p_name?: string | null };
        Returns: Database['public']['Tables']['workouts']['Row'];
      };
    };
  };
};
