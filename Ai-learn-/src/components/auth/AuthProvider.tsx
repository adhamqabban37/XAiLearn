"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User as SupaUser } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { getUserProfile, UserProfile } from "@/lib/auth";

interface AuthContextType {
  user: SupaUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn(
        "[AuthProvider] Supabase is not configured; skipping auth init"
      );
      setLoading(false);
      return;
    }
    let mounted = true;
    // Load current session once
    supabase.auth
      .getUser()
      .then(async ({ data }: { data: { user: SupaUser | null } }) => {
        if (!mounted) return;
        const u = data.user ?? null;
        setUser(u);
        if (u) {
          try {
            const profile = await getUserProfile(u.id);
            setUserProfile(profile);
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      });

    // Subscribe to auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event: unknown, session: { user: SupaUser | null } | null) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          try {
            const profile = await getUserProfile(u.id);
            setUserProfile(profile);
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
