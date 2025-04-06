
import { User } from "@supabase/supabase-js";

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  sessionChecked: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, orgName: string) => Promise<void>;
  signOut: () => Promise<void>;
};
