import { useEffect, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;

    // 1. Get the initial session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      const user = session?.user ?? null;
      if (user) {
        const role = await fetchRole(user.id);
        if (!cancelled) setState({ user, role, loading: false });
      } else {
        if (!cancelled) setState({ user: null, role: null, loading: false });
      }
    });

    // 2. Listen for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      const user = session?.user ?? null;
      if (user) {
        const role = await fetchRole(user.id);
        if (!cancelled) setState({ user, role, loading: false });
      } else {
        setState({ user: null, role: null, loading: false });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
