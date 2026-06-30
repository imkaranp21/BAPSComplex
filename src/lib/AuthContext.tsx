import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  membership_tier: 1 | 2 | null;
  membership_status: 'active' | 'pending' | 'suspended';
  avatar_url: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isRecovery: boolean;
  clearRecovery: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, membership_tier, membership_status, avatar_url, created_at')
      .eq('id', userId)
      .single();

    setProfile(data as UserProfile | null);

    // is_admin() is SECURITY DEFINER so it can bypass RLS
    const { data: adminResult } = await (supabase as any).rpc('is_admin');
    setIsAdmin(!!adminResult);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setUser(session?.user ?? null);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsRecovery(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signUp(email: string, password: string, fullName: string, phone?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    // Save phone to profile once the trigger has created the row
    if (!error && data.user && phone?.trim()) {
      await supabase
        .from('profiles')
        .update({ phone: phone.trim() })
        .eq('id', data.user.id);
    }

    const needsConfirmation = !error && !!data.user && !data.session;
    return { error: error as Error | null, needsConfirmation };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  function clearRecovery() { setIsRecovery(false); }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isRecovery, clearRecovery, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
