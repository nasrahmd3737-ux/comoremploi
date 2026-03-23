import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  role: string | null;
  loading: boolean;
}

async function fetchRole(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, role: null, loading: true });
  const initializedRef = useRef(false);

  useEffect(() => {
    // 1. Set up the listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Skip events until getSession has initialized
      if (!initializedRef.current) return;

      const user = session?.user ?? null;
      if (user) {
        const role = await fetchRole(user.id);
        setState({ user, role, loading: false });
      } else {
        setState({ user: null, role: null, loading: false });
      }
    });

    // 2. Then get the initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      if (user) {
        const role = await fetchRole(user.id);
        setState({ user, role, loading: false });
      } else {
        setState({ user: null, role: null, loading: false });
      }
      initializedRef.current = true;
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
