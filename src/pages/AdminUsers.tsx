import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  Copy,
  Wallet,
  TrendingUp,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useLivePrices } from '@/hooks/useLivePrices';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  status: string | null;
  two_factor_enabled: boolean | null;
  two_factor_required: boolean | null;
  created_at: string | null;
}

interface UserEmail {
  id: string;
  email: string;
  created_at: string;
}

const AdminUsers = () => {
  const { user, isAdmin } = useAuth();
  const { prices } = useLivePrices();
  const queryClient = useQueryClient();

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('🔵 Starting delete mutation for user:', userId);
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      console.log('📡 Delete response:', { data, error });

      if (error) {
        console.error('❌ Delete error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data, userId) => {
      console.log('✅ Delete successful for user:', userId);
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-emails'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-staking'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-private-keys'] });
    },
    onError: (error: Error) => {
      console.error('❌ Mutation error:', error);
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  // Fetch user profiles
  const { data: profiles, isLoading: profilesLoading, refetch: refetchProfiles } = useQuery({
    queryKey: ['admin-user-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch user emails from auth
  const { data: userEmails, refetch: refetchEmails, isError: emailsError } = useQuery({
    queryKey: ['admin-user-emails'],
    queryFn: async () => {
      const { data: sessionResult } = await supabase.auth.getSession();
      const token = sessionResult?.session?.access_token;
      
      // If no token, return empty array (session expired)
      if (!token) {
        console.warn('No active session for fetching user emails');
        return [] as UserEmail[];
      }
      
      const { data, error } = await supabase.functions.invoke('get-user-emails', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (error) {
        console.error('Error fetching user emails:', error);
        // Don't throw, return empty array to allow fallback
        return [] as UserEmail[];
      }
      return (data?.users || []) as UserEmail[];
    },
    enabled: !!user && isAdmin,
    retry: false, // Don't retry on auth errors
  });

  // Fetch wallet data
  const { data: walletData, refetch: refetchWallets, isRefetching: isRefetchingWallets } = useQuery({
    queryKey: ['admin-user-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('user_id, asset_symbol, balance_crypto');

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
    staleTime: 30000, // 30 seconds - much more reasonable
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch staking data
  const { data: stakingData, refetch: refetchStaking, isRefetching: isRefetchingStaking } = useQuery({
    queryKey: ['admin-user-staking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_staking')
        .select('user_id, is_staking, total_profits_earned');

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Fetch private keys
  const { data: privateKeys, refetch: refetchKeys } = useQuery({
    queryKey: ['admin-user-private-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_private_keys')
        .select('user_id, private_key');

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });

  // Manual refresh handler - much faster than invalidating
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchProfiles(),
        refetchEmails(),
        refetchWallets(),
        refetchStaking(),
        refetchKeys()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculatePortfolioBalance = (userId: string): number => {
    if (!walletData || !prices) return 0;

    const userWallets = walletData.filter(w => w.user_id === userId);
    let total = 0;

    userWallets.forEach(wallet => {
      const balance = Number(wallet.balance_crypto) || 0;
      
      if (wallet.asset_symbol === 'BTC' && prices.bitcoin) {
        total += balance * prices.bitcoin;
      } else if (wallet.asset_symbol === 'ETH' && prices.ethereum) {
        total += balance * prices.ethereum;
      } else if (wallet.asset_symbol === 'USDT') {
        total += balance;
      }
    });

    // Add staking profits
    const userStaking = stakingData?.find(s => s.user_id === userId && s.is_staking);
    if (userStaking && prices.ethereum) {
      total += Number(userStaking.total_profits_earned || 0) * prices.ethereum;
    }

    return total;
  };

  const calculateStakingBalance = (userId: string): number => {
    if (!stakingData || !prices?.ethereum) return 0;

    const userStaking = stakingData.find(s => s.user_id === userId && s.is_staking);
    if (!userStaking) return 0;

    return Number(userStaking.total_profits_earned || 0);
  };

  const getUserPrivateKey = (userId: string): string => {
    const key = privateKeys?.find(k => k.user_id === userId);
    return key?.private_key || 'Not set';
  };

  const copyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast('User ID copied to clipboard', { duration: 1000 });
  };

  const copyPrivateKey = (privateKey: string) => {
    navigator.clipboard.writeText(privateKey);
    toast('Private key copied to clipboard', { duration: 1000 });
  };

  // Filter out orphaned profiles (profiles without corresponding auth users)
  // If userEmails is empty or failed, show all profiles using profile.email
  const mergedUsers = profiles
    ?.filter(profile => {
      // If we have email data, filter to only those with auth records
      // Otherwise show all profiles
      if (userEmails && userEmails.length > 0) {
        return userEmails.some(e => e.id === profile.user_id);
      }
      return true; // Show all if no email data available
    })
    .map(profile => ({
      ...profile,
      email: userEmails?.find(e => e.id === profile.user_id)?.email || profile.email || 'N/A',
    })) || [];

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground text-center">
              You need administrator privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profilesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Users Management</h1>
            <p className="text-white/60 mt-1">Manage registered users and their details</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-[hsl(var(--accent-blue))] hover:bg-[hsl(var(--accent-blue))]/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Users Table */}
        <Card className="bg-black/40 backdrop-blur border-white/10">
          <CardHeader>
            <CardTitle className="text-white">User List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-xs font-medium uppercase text-white/60">User</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-white/60">Status</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-white/60">Portfolio Balance</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-white/60">Staking Balance</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-white/60">Private Key</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-white/60">Joined</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-white/60">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedUsers.map((profile) => {
                  const privateKey = getUserPrivateKey(profile.user_id);
                  const portfolioBalance = calculatePortfolioBalance(profile.user_id);
                  const stakingBalance = calculateStakingBalance(profile.user_id);
                  
                  return (
                    <TableRow key={profile.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-[hsl(var(--accent-blue))]/20 border-2 border-[hsl(var(--accent-blue))]">
                            <AvatarFallback className="bg-[hsl(var(--accent-blue))]/20 text-[hsl(var(--accent-blue))] font-semibold">
                              {(profile.full_name || profile.username || profile.email || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {profile.full_name || profile.username || 'Unknown User'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-[hsl(var(--accent-blue))] hover:text-[hsl(var(--accent-blue))]/80 hover:bg-[hsl(var(--accent-blue))]/10"
                                onClick={() => copyUserId(profile.user_id)}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy UID
                              </Button>
                            </div>
                            <div className="text-sm text-white/60">
                              {profile.email} • ID: {profile.user_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                        >
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-[hsl(var(--accent-blue))]" />
                          <div>
                            <div className="font-semibold text-white">
                              ${portfolioBalance.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-xs text-white/60">USD</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[hsl(var(--success-green))]" />
                          <div>
                            <div className="font-semibold text-white">
                              ${stakingBalance.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-xs text-white/60">ETH Staking</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-[hsl(var(--muted))] text-white px-2 py-1 rounded">
                            {privateKey}
                          </code>
                          {privateKey !== 'Not set' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-[hsl(var(--accent-blue))]/10"
                              onClick={() => copyPrivateKey(privateKey)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-white/80">
                          {profile.created_at
                            ? new Date(profile.created_at).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#1a1a1a] border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
                              <AlertDialogDescription className="text-white/70">
                                Are you sure you want to delete {profile.full_name || profile.username || profile.email}? 
                                This will permanently delete the user and all associated data (wallets, transactions, staking, etc.). 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUserMutation.mutate(profile.user_id)}
                                className="bg-red-500 text-white hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {mergedUsers.length === 0 && (
              <div className="text-center py-12 text-white/60">
                No users found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
