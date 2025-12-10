import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/bankDeposit';

interface UseAdminUsersReturn {
  /** List of users with profiles */
  users: UserProfile[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refetch users */
  refetch: () => Promise<void>;
  /** Filter users by search term */
  filterUsers: (searchTerm: string) => UserProfile[];
  /** Get user by ID */
  getUserById: (userId: string) => UserProfile | undefined;
}

/**
 * Custom hook for fetching and managing admin user list
 * Used in AdminBankDeposit and AdminWalletManagement
 *
 * @returns User list state and utilities
 *
 * @example
 * ```tsx
 * const { users, loading, filterUsers } = useAdminUsers();
 * const filteredUsers = filterUsers(searchTerm);
 * ```
 */
export const useAdminUsers = (): UseAdminUsersReturn => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching users for admin management...');

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('first_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Get user emails from auth to filter out orphaned profiles
      const { data: sessionResult } = await supabase.auth.getSession();
      const token = sessionResult?.session?.access_token;

      let emailResponse: { users?: { id: string; email: string }[] } | null = null;

      // Only call the edge function if we have a valid session
      if (token) {
        const { data, error: emailError } = await supabase.functions.invoke('get-user-emails', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (emailError) {
          console.error('Error fetching user emails:', emailError);
          // Check for session/auth errors in the error message or response
          const errorMsg = emailError.message?.toLowerCase() || '';
          const isAuthError = errorMsg.includes('session') || 
                              errorMsg.includes('expired') || 
                              errorMsg.includes('invalid') ||
                              errorMsg.includes('auth');
          
          if (isAuthError) {
            // Session is invalid - user needs to re-authenticate
            toast({
              title: 'Session expired',
              description: 'Your session has expired. Please log out and log back in.',
              variant: 'destructive',
            });
          }
          // Continue with profile data only (fallback)
        } else if (data?.error) {
          // Edge function returned an error in the response body
          console.error('Edge function error:', data.error);
          if (data.error.toLowerCase().includes('session') || data.error.toLowerCase().includes('expired')) {
            toast({
              title: 'Session expired',
              description: 'Your session has expired. Please log out and log back in.',
              variant: 'destructive',
            });
          }
        } else {
          emailResponse = data;
        }
      } else {
        console.warn('No active session, skipping email fetch');
      }

      // If we have email response, filter profiles; otherwise use all profiles
      let usersWithEmails: UserProfile[];
      
      if (emailResponse?.users) {
        // Filter out orphaned profiles (users that no longer exist in auth)
        const validProfiles = profiles?.filter(profile =>
          emailResponse?.users?.some((u: { id: string }) => u.id === profile.user_id)
        );

        // Map to UserProfile format with emails
        usersWithEmails = validProfiles?.map(profile => {
          const authUser = emailResponse?.users?.find((u: { id: string; email: string }) => u.id === profile.user_id);
          return {
            id: profile.user_id,
            user_id: profile.user_id,
            full_name: profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.full_name || authUser?.email || 'Unknown User',
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: authUser?.email || profile.email || `${profile.user_id}@example.com`
          };
        }) || [];
      } else {
        // Fallback: use profile data directly
        usersWithEmails = profiles?.map(profile => ({
          id: profile.user_id,
          user_id: profile.user_id,
          full_name: profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.full_name || 'Unknown User',
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email || `${profile.user_id}@example.com`
        })) || [];
      }

      setUsers(usersWithEmails);
      console.log(`Fetched ${usersWithEmails.length} users`);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err as Error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter users by search term (memoized function)
  const filterUsers = useCallback((searchTerm: string): UserProfile[] => {
    if (!searchTerm.trim()) return users;

    const search = searchTerm.toLowerCase();
    return users.filter(user =>
      user.full_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search)
    );
  }, [users]);

  // Get user by ID (memoized function)
  const getUserById = useCallback((userId: string): UserProfile | undefined => {
    return users.find(user => user.id === userId);
  }, [users]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    filterUsers,
    getUserById
  };
};

export default useAdminUsers;
