import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
}

const DEMO_USER: User = {
  id: "demo-user-fintrack",
  app_metadata: { provider: "demo" },
  user_metadata: { full_name: "Usuario Demo", name: "Usuario Demo" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "demo@fintrack.app",
  phone: "",
  role: "authenticated",
  updated_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isDemoMode: false,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signInDemo: () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Obtener sesión inicial de Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Suscribirse a cambios de estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setIsDemoMode(false);
        api.setDemoMode(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsDemoMode(false);
      api.setDemoMode(false);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err?.message || "Error al iniciar sesión") };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setIsDemoMode(false);
      api.setDemoMode(false);
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err?.message || "Error al registrarse") };
    }
  };

  const signInDemo = () => {
    setIsDemoMode(true);
    api.setDemoMode(true);
  };

  const signOut = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      api.setDemoMode(false);
    }
    await supabase.auth.signOut().catch(() => {});
  };

  const activeUser = isDemoMode ? DEMO_USER : (session?.user ?? null);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: activeUser,
        loading,
        isDemoMode,
        signInWithEmail,
        signUpWithEmail,
        signInDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
