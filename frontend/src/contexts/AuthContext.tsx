"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export type AuthModalMode =
  | "login"
  | "register"
  | "forgot_password"
  | "update_password";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("login");

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setIsLoading(false);
    });

    // 2. Listen for auth changes (token refresh, sign in, sign out, password recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setIsLoading(false);

      if (event === "PASSWORD_RECOVERY") {
        setAuthModalMode("update_password");
        setIsAuthModalOpen(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let lastToastTime = 0;

    const handleUnauthorized = () => {
      const now = Date.now();
      if (now - lastToastTime > 3000) {
        lastToastTime = now;
        toast.error("Tu sesión ha expirado o necesitas iniciar sesión.", {
          id: "auth-session-expired",
        });
      }
      setAuthModalMode("login");
      setIsAuthModalOpen(true);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
      setToken(data.session.access_token);
      setIsAuthModalOpen(false);
    }

    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    const trimmedEmail = email.trim();
    const trimmedName = fullName?.trim() || "";

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedName,
        },
      },
    });

    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
      setToken(data.session.access_token);
      setIsAuthModalOpen(false);
      return { error: null, needsEmailConfirmation: false };
    }

    // Supabase masks duplicate user registrations when email confirmation is enabled by returning empty identities:
    if (!error && data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return {
        error: { message: "User already registered", name: "AuthApiError", status: 400 } as unknown as AuthError,
        needsEmailConfirmation: false,
      };
    }

    // If confirmation email is enabled in Supabase
    if (!error && data.user && !data.session) {
      return { error: null, needsEmailConfirmation: true };
    }

    return { error, needsEmailConfirmation: false };
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    const redirectUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (!error && data.user) {
      setUser(data.user);
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setToken(null);
  };

  const openAuthModal = (mode: AuthModalMode = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const value = {
    user,
    session,
    token,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPasswordForEmail,
    updatePassword,
    signOut,
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    setAuthModalMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
