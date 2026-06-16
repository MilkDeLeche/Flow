import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseEnabled } from './supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseEnabled);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const syncUser = async (session: Session | null) => {
      if (!session) {
        if (mounted) setSession(null);
        return;
      }
      const { data, error } = await client.auth.getUser();
      if (!mounted) return;
      if (error || !data.user) {
        setSession(session);
        return;
      }
      setSession({ ...session, user: data.user });
    };

    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      void syncUser(data.session).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, s) => {
      void syncUser(s);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    loading,
    /** Whether login is enforced (true once Supabase is configured). */
    authRequired: supabaseEnabled,
  };
}
