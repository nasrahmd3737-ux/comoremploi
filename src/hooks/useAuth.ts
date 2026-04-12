import { useCallback, useEffect, useState } from "react";
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

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      setState({ user: null, role: null, loading: false });
    }

    return { error };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let hydrated = false;
    let requestId = 0;

    const resolveAuthState = (user: User | null) => {
      const currentRequestId = ++requestId;

      if (!user) {
        if (!cancelled) {
          setState({ user: null, role: null, loading: false });
        }
        return;
      }

      if (!cancelled) {
        setState((current) => ({
          user,
          role: current.user?.id === user.id ? current.role : null,
          loading: true,
        }));
      }

      void fetchRole(user.id).then((role) => {
        if (cancelled || currentRequestId !== requestId) return;
        setState({ user, role, loading: false });
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!hydrated) return;
      resolveAuthState(session?.user ?? null);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      hydrated = true;
      resolveAuthState(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      requestId += 1;
      subscription.unsubscribe();
    };
  }, []);

  return { ...state, signOut };
}
