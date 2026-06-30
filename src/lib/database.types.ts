export type MembershipGroup = 'satsangi' | 'non_satsangi';
export type MembershipStatus = 'active' | 'pending' | 'suspended';
export type AdminRole = 'super_admin' | 'admin';
export type BookingStatus = 'confirmed' | 'cancelled' | 'no_show';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          membership_group: MembershipGroup | null;
          membership_tier: 1 | 2 | null;
          membership_status: MembershipStatus;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          membership_group?: MembershipGroup | null;
          membership_tier?: 1 | 2 | null;
          membership_status?: MembershipStatus;
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
        };
      };
      membership_tiers: {
        Row: {
          id: string;
          membership_group: MembershipGroup;
          tier: 1 | 2;
          display_name: string;
          monthly_price_kes: number | null;
          annual_price_kes: number | null;
          advance_booking_days: number;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['membership_tiers']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['membership_tiers']['Row']>;
      };
      spaces: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          capacity: number | null;
          is_bookable: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['spaces']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['spaces']['Row']>;
      };
      space_units: {
        Row: {
          id: string;
          space_id: string;
          name: string;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['space_units']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['space_units']['Row']>;
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          space_id: string;
          space_unit_id: string | null;
          date: string;
          start_time: string;
          end_time: string;
          status: BookingStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          space_id: string;
          space_unit_id?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          status?: BookingStatus;
          notes?: string | null;
        };
        Update: {
          status?: BookingStatus;
          notes?: string | null;
        };
      };
      gym_checkins: {
        Row: {
          id: string;
          user_id: string | null;
          checked_in_at: string;
          checked_out_at: string | null;
          is_active: boolean;
        };
        Insert: {
          user_id?: string | null;
          checked_in_at?: string;
          checked_out_at?: string | null;
        };
        Update: {
          checked_out_at?: string;
        };
      };
      admin_roles: {
        Row: {
          user_id: string;
          role: AdminRole;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: AdminRole;
          created_by?: string | null;
        };
        Update: {
          role?: AdminRole;
        };
      };
    };
    Views: {
      my_profile: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          membership_tier: 1 | 2 | null;
          membership_status: MembershipStatus;
          avatar_url: string | null;
          created_at: string;
        };
      };
    };
  };
}
