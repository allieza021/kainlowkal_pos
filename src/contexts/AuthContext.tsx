import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabaseClient, hasSupabaseConfig } from '../lib/supabase';
import type { StaffProfile } from '../types';

type AuthContextValue = {
  supabase: ReturnType<typeof getSupabaseClient>;
  session: { user: { id: string } } | null;
  profile: StaffProfile | null;
  loading: boolean;
  error: string;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setSessionData: (profile: StaffProfile) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
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
      const savedUserId = localStorage.getItem('custom_auth_user_id');
      if (savedUserId && mounted) {
        setSession({ user: { id: savedUserId } });
        await loadProfile(savedUserId);
      }
      if (mounted) setLoading(false);
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function refreshProfile() {
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  }

  async function signOut() {
    localStorage.removeItem('custom_auth_user_id');
    setSession(null);
    setProfile(null);
  }

  function setSessionData(newProfile: StaffProfile) {
    localStorage.setItem('custom_auth_user_id', newProfile.id);
    setSession({ user: { id: newProfile.id } });
    setProfile(newProfile);
  }

  const value: AuthContextValue = {
    supabase,
    session,
    profile,
    loading,
    error,
    refreshProfile,
    signOut,
    clearError: () => setError(''),
    setSessionData
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
