'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, display_name, role, org_id, created_at')
          .eq('id', sessionUser.id)
          .single();
        setProfile(data as unknown as Profile);
      }

      setLoading(false);
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('id, email, display_name, role, org_id, created_at')
            .eq('id', session.user.id)
            .single();
          setProfile(data as unknown as Profile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = user?.app_metadata?.is_admin === true;

  return { user, profile, loading, supabase, isAdmin };
}
