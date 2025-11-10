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
  Trash2
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

export default function AdminUsersManagement() {
  const { user, isAdmin } = useAuth();
  const { prices } = useLivePrices();
  const queryClient = useQueryClient();

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-emails'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-staking'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-private-keys'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  // Fetch user profiles
  const { data: profiles, isLoading: profilesLoading } = useQuery({
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
  const { data: userEmails } = useQuery({
    queryKey: ['admin-user-emails'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-user-emails');
      if (error) throw error;
      return data.users as UserEmail[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch wallet data
  const { data: walletData } = useQuery({
    queryKey: ['admin-user-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('user_id, asset_symbol, balance_crypto');

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
    staleTime: 1000,
    refetchInterval: 1000,
  });

  // Fetch staking data
  const { data: stakingData } = useQuery({
    queryKey: ['admin-user-staking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_staking')
        .select('user_id, is_staking, total_profits_earned');

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
    staleTime: 5000,
    refetchInterval: 5000,
  });

  // Fetch private keys
  const { data: privateKeys } = useQuery({
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
    toast.success('User ID copied to clipboard', { duration: 1000 });
  };

  const copyPrivateKey = (privateKey: string) => {
    navigator.clipboard.writeText(privateKey);
    toast.success('Private key copied to clipboard', { duration: 1000 });
  };

  // Filter out orphaned profiles (profiles without corresponding auth users)
  const mergedUsers = profiles
    ?.filter(profile => {
      // Only include profiles that have a corresponding user in auth
      return userEmails?.some(e => e.id === profile.user_id);
    })
    .map(profile => ({
      ...profile,
      email: profile.email || userEmails?.find(e => e.id === profile.user_id)?.email || 'N/A',
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground mt-1">Manage registered users and their details</p>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">User</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Portfolio Balance</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Staking Balance</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Private Key</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Joined</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedUsers.map((profile) => {
                  const privateKey = getUserPrivateKey(profile.user_id);
                  const portfolioBalance = calculatePortfolioBalance(profile.user_id);
                  const stakingBalance = calculateStakingBalance(profile.user_id);
                  
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-muted">
                            <AvatarFallback className="bg-muted text-foreground font-semibold">
                              {(profile.full_name || profile.username || profile.email || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {profile.full_name || profile.username || 'Unknown User'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => copyUserId(profile.user_id)}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy UID
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
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
                          <Wallet className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-semibold">
                              ${portfolioBalance.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">USD</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-semibold">
                              ${stakingBalance.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">ETH Staking</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {privateKey}
                          </code>
                          {privateKey !== 'Not set' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyPrivateKey(privateKey)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
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
                              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {profile.full_name || profile.username || profile.email}? 
                                This will permanently delete the user and all associated data (wallets, transactions, staking, etc.). 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUserMutation.mutate(profile.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              <div className="text-center py-12 text-muted-foreground">
                No users found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
