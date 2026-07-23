import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      items: {
        Row: {
          id: string;
          name: string;
          amount: string | number;
          type: "available" | "regular" | "savings";
        };
        Insert: {
          id?: string;
          name: string;
          amount?: number;
          type?: "available" | "regular" | "savings";
        };
        Update: {
          name?: string;
          amount?: number;
          type?: never;
        };
        Relationships: [];
      };
      balances: {
        Row: {
          id: string;
          total: string | number;
          snapshot_at: string;
        };
        Insert: {
          id?: string;
          total: number;
          snapshot_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      commit_regular_item: {
        Args: {
          item_id: string;
          new_name: string;
          new_amount: number;
        };
        Returns: { total: string | number }[];
      };
      create_savings: {
        Args: {
          source_item_id: string;
          savings_amount: number;
          new_savings_name: string;
        };
        Returns: undefined;
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
