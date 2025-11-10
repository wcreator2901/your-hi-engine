
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  complete2FAAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Auto-logout after inactivity - configurable per user
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get inactivity timeout - 15 minutes for all users
  const getInactivityTimeout = (): number => {
    return 15 * 60 * 1000; // 15 minutes in milliseconds
  };

  const checkAdminStatus = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log('Checking admin status for user:', userId);
      
      // Use the check_user_is_admin function
      const { data, error } = await supabase
        .rpc('check_user_is_admin', { check_user_id: userId });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      console.log('Admin check result:', data);
      return data === true;
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    console.log('AuthProvider - initializing');
    
    let mounted = true;
    
    // Get initial session
    const getSession = async () => {
      try {
        console.log('AuthProvider - getting session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('AuthProvider - session:', session?.user?.email || 'no session');
        
        if (session?.user) {
          setUser(session.user);
          
          // Check admin status
          try {
            const adminStatus = await checkAdminStatus(session.user.id);
            if (mounted) {
              console.log('Setting admin status to:', adminStatus);
              setIsAdmin(adminStatus);
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
            if (mounted) {
              setIsAdmin(false);
            }
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        
        // Always set loading to false after processing session
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('AuthProvider - auth state change:', event, session?.user?.email || 'no session');
        
        // CRITICAL: Set loading to false IMMEDIATELY for auth state changes
        if (mounted) {
          setLoading(false);
        }
        
        try {
          if (session?.user) {
            setUser(session.user);
            
            // Run admin check in background, don't block the loading state
            setTimeout(async () => {
              try {
                const adminStatus = await checkAdminStatus(session.user.id);
                if (mounted) {
                  console.log('Auth change - setting admin status to:', adminStatus);
                  setIsAdmin(adminStatus);
                }
              } catch (adminError) {
                console.error('Error checking admin status:', adminError);
                if (mounted) {
                  setIsAdmin(false);
                }
              }
            }, 0);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          if (mounted) {
            setUser(null);
            setIsAdmin(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to prevent infinite loops

  const signOut = async () => {
    try {
      // Clear inactivity timer on manual logout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      
      // Clear 2FA verification flag for this session
      if (user?.id) {
        sessionStorage.removeItem(`2fa_verified_${user.id}`);
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    // Only set timer if user is logged in
    if (user) {
      const timeout = getInactivityTimeout();
      console.log(`Setting inactivity timeout for user ${user.id}: ${timeout / 1000 / 60} minutes`);
      
      inactivityTimeoutRef.current = setTimeout(() => {
        console.log('Auto-logout due to inactivity');
        signOut();
      }, timeout);
    }
  }, [user, signOut]);

  // Set up activity tracking
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Reset timer on any activity - Use throttled version to prevent excessive calls
    let lastActivity = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) { // Throttle to once per second
        lastActivity = now;
        resetInactivityTimer();
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start initial timer
    resetInactivityTimer();

    return () => {
      // Clean up event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      // Clear timeout
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  const complete2FAAuth = async () => {
    try {
      console.log('AuthProvider - completing 2FA authentication');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session for 2FA completion:', error);
        return;
      }
      
      if (session?.user) {
        console.log('AuthProvider - setting user as authenticated after 2FA verification');
        setUser(session.user);
        
        // Check admin status
        try {
          const adminStatus = await checkAdminStatus(session.user.id);
          console.log('Setting admin status after 2FA to:', adminStatus);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status after 2FA:', error);
          setIsAdmin(false);
        }
      }
    } catch (error) {
      console.error('Error completing 2FA authentication:', error);
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    signOut,
    complete2FAAuth
  };

  console.log('AuthProvider render - user:', !!user, 'loading:', loading, 'isAdmin:', isAdmin);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
