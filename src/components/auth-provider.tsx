import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const hasSupabaseConfig = Boolean(
  import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
);

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  recovery: boolean;
  configured: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  recovery: false,
  configured: hasSupabaseConfig,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    const isPasswordResetRoute = window.location.pathname === "/reset-password";
    if (!isPasswordResetRoute) {
      localStorage.removeItem("campusly-demo-session");
      sessionStorage.removeItem("campusly-login-onboarding-step");
      sessionStorage.removeItem("skillai-recovery");
    }

    if (import.meta.env.DEV && !hasSupabaseConfig) {
      setReady(true);
      return;
    }

    let active = true;
    let revision = 0;
    let requireExplicitSignIn = !isPasswordResetRoute;
    let unsubscribe: (() => void) | undefined;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("type") === "recovery") sessionStorage.setItem("skillai-recovery", "true");
    setRecovery(sessionStorage.getItem("skillai-recovery") === "true");
    const refresh = () => {
      const current = ++revision;
      void supabase.auth
        .getUser()
        .then(({ data }) => {
          if (active && current === revision) {
            setUser(requireExplicitSignIn ? null : data.user);
            setReady(true);
          }
        })
        .catch(() => {
          if (active && current === revision) {
            setUser(null);
            setReady(true);
          }
        });
    };
    const initialize = async () => {
      if (requireExplicitSignIn) {
        try {
          const { error } = await supabase.auth.signOut({ scope: "local" });
          if (error) console.error("[Auth] Could not clear the saved local session:", error);
        } catch (error) {
          console.error("[Auth] Could not clear the saved local session:", error);
        }
      }
      if (!active) return;

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") requireExplicitSignIn = false;
        if (event === "PASSWORD_RECOVERY") {
          sessionStorage.setItem("skillai-recovery", "true");
          setRecovery(true);
        }
        if (event === "SIGNED_OUT") {
          revision++;
          sessionStorage.removeItem("skillai-recovery");
          setRecovery(false);
          setUser(null);
          setReady(true);
        } else if (
          ["INITIAL_SESSION", "SIGNED_IN", "USER_UPDATED", "PASSWORD_RECOVERY"].includes(event)
        ) {
          // Run outside the Auth callback to avoid holding the SDK's session lock.
          setTimeout(() => {
            if (active) refresh();
          }, 0);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
      refresh();
    };
    void initialize();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  return (
    <AuthContext.Provider value={{ user, ready, recovery, configured: hasSupabaseConfig }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useCloudAuth = () => useContext(AuthContext);
