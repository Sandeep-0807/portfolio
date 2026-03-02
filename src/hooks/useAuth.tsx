import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { apiFetch, getAuthToken, setAuthToken } from "@/lib/api";
import { isSupabaseEnabled, supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: { id: string; email: string; role: "admin" | "user" } | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch<{ user: { id: string; email: string; role: "admin" | "user" }; isAdmin: boolean }>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        setIsAdmin(data.isAdmin);
      })
      .catch(() => {
        setAuthToken(null);
        setUser(null);
        setIsAdmin(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiFetch<{ token: string; user: { id: string; email: string; role: "admin" | "user" } }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );

      setAuthToken(data.token);
      setUser(data.user);
      setIsAdmin(data.user.role === "admin");
      return { error: null };
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Login failed");
      return { error: err };
    }
  };

  const signOut = async () => {
    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setAuthToken(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
