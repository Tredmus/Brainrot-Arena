import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserData {
  id: string;
  username: string;
  gold: number;
  rotten_brains: number;
  energy_current: number;
  energy_max: number;
  glory: number;
}

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setIsLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userError) {
          throw userError;
        }

        setUser(userData);
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  return { user, isLoading, error, setLocalUserData: setUser };
}