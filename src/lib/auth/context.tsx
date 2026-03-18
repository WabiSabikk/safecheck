'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import type { User, SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  orgId: string | null;
  loading: boolean;
  supabase: SupabaseClient;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, display_name, role, org_id, created_at')
          .eq('id', sessionUser.id)
          .single();
        if (!cancelled && data) {
          setProfile(data as unknown as Profile);
        }
      }

      if (!cancelled) setLoading(false);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        if (newUser) {
          const { data } = await supabase
            .from('profiles')
            .select('id, email, display_name, role, org_id, created_at')
            .eq('id', newUser.id)
            .single();
          if (data) setProfile(data as unknown as Profile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const isAdmin = user?.app_metadata?.is_admin === true;
  const orgId = profile?.org_id ?? null;

  const value = useMemo(
    () => ({ user, profile, orgId, loading, supabase, isAdmin }),
    [user, profile, orgId, loading, supabase, isAdmin]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
