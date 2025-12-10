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

      const { data: emailResponse, error: emailError } = await supabase.functions.invoke('get-user-emails', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (emailError) {
        console.error('Error fetching user emails:', emailError);
      }

      // Filter out orphaned profiles (users that no longer exist in auth)
      const validProfiles = profiles?.filter(profile =>
        emailResponse?.users?.some((u: { id: string }) => u.id === profile.user_id)
      );

      // Map to UserProfile format with emails
      const usersWithEmails: UserProfile[] = validProfiles?.map(profile => {
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
