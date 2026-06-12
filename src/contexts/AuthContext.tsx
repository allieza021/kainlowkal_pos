import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient, hasSupabaseConfig } from '../lib/supabase';
import type { StaffProfile } from '../types';

type AuthContextValue = {
  supabase: ReturnType<typeof getSupabaseClient>;
  session: Session | null;
  profile: StaffProfile | null;
  loading: boolean;
  error: string;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProfile(userId: string) {
    if (!supabase) return;
    const { data, error: profileError } = await supabase.from('staff_profiles').select('*').eq('id', userId).maybeSingle();
    if (profileError) {
      setError(profileError.message);
    } else {
      setProfile(data || null);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      if (data.session?.user?.id) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    }

    initialize();

    const { data } = supabase
      ? supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          setSession(nextSession);
          if (nextSession?.user?.id) {
            await loadProfile(nextSession.user.id);
          } else {
            setProfile(null);
          }
          setLoading(false);
        })
      : { subscription: { unsubscribe() {} } };

    return () => {
      mounted = false;
      data?.subscription.unsubscribe();
    };
  }, [supabase]);

  async function refreshProfile() {
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  const value: AuthContextValue = {
    supabase,
    session,
    profile,
    loading,
    error,
    refreshProfile,
    signOut,
    clearError: () => setError('')
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function useHasSupabaseConfig() {
  return hasSupabaseConfig;
}
