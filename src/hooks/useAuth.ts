import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Role } from '@/utils/rbac';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: Role;
  plan: 'free' | 'pro' | 'growth' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  const signOut = async () => {
    try {
      // Log security event for logout
      try {
        await supabase.rpc('log_security_event', {
          event_type: 'user_logout',
          severity: 'info'
        });
      } catch (logError) {
        // Don't block logout if logging fails
        console.warn('Failed to log logout event:', logError);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        // Log failed logout
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'auth_failed_logout',
            severity: 'warn',
            details: { error: error.message }
          });
        } catch (logError) {
          console.warn('Failed to log failed logout:', logError);
        }
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only synchronous state updates here
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchProfile(session.user.id).then(profileData => {
              setProfile(profileData);
            });
            
            // Log auth events for security monitoring
            if (event === 'SIGNED_IN') {
              (async () => {
                try {
                  await supabase.rpc('log_security_event', {
                    event_type: 'user_login',
                    severity: 'info',
                    details: { method: session.user.app_metadata.provider || 'email' }
                  });
                } catch (err) {
                  console.warn('Failed to log login event:', err);
                }
              })();
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(profileData => {
          setProfile(profileData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
  };
}

export { AuthContext };