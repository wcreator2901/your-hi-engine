import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Users, TrendingUp, DollarSign, Calendar, Search, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatNumber } from '@/utils/currencyFormatter';
import { useLivePrices } from '@/hooks/useLivePrices';
import { StakingProgramInfo } from '@/components/StakingProgramInfo';

interface UserStaking {
  id: string;
  user_id: string;
  asset_symbol: string;
  daily_yield_percent: number;
  staking_start_time: string;
  last_calculation_time: string;
  total_profits_earned: number;
  accrued_profits: number;
  is_staking: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
}

interface UserWithStaking extends UserProfile {
  staking_configs: UserStaking[];
}

export default function AdminStaking() {
  const [users, setUsers] = useState<UserWithStaking[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStaking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithStaking | null>(null);
  const [editingStaking, setEditingStaking] = useState<UserStaking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get live prices for accurate calculations
  const { prices } = useLivePrices();

  // Form states
  const [assetSymbol, setAssetSymbol] = useState('ETH');
  const [isStaking, setIsStaking] = useState(true);
  const [stakingStartTime, setStakingStartTime] = useState('');
  const [dailyYieldPercent, setDailyYieldPercent] = useState('0.65');
  const [totalEarnings, setTotalEarnings] = useState('0');
  const [totalEarningsUSD, setTotalEarningsUSD] = useState('0');
  const [accruedProfits, setAccruedProfits] = useState('0');
  const [lastCalculationTime, setLastCalculationTime] = useState('');

  useEffect(() => {
    fetchUsersWithStaking();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const firstName = user.first_name?.toLowerCase() || '';
        const lastName = user.last_name?.toLowerCase() || '';
        const fullName = user.full_name?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        
        return firstName.includes(searchLower) || 
               lastName.includes(searchLower) || 
               fullName.includes(searchLower) || 
               email.includes(searchLower);
      });
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsersWithStaking = async () => {
    try {
      // First get all users
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id, email, full_name, first_name, last_name')
        .order('email');

      if (userError) throw userError;

      // Get user emails from auth to filter out orphaned profiles
      const { data: sessionResult } = await supabase.auth.getSession();
      const token = sessionResult?.session?.access_token;
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke('get-user-emails', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      if (emailError) {
        console.error('Error fetching user emails:', emailError);
      }

      // Filter out orphaned profiles (users that don't exist in auth)
      const validProfiles = userProfiles?.filter(profile => 
        emailResponse?.users?.some((u: any) => u.id === profile.user_id)
      );

      // Then get all staking data
      const { data: stakingData, error: stakingError } = await supabase
        .from('user_staking')
        .select('*')
        .order('created_at', { ascending: false });

      if (stakingError) throw stakingError;

      // Combine users with their staking configurations
      const usersWithStaking: UserWithStaking[] = (validProfiles || []).map(user => ({
        ...user,
        staking_configs: (stakingData || []).filter(staking => staking.user_id === user.user_id)
      }));

      setUsers(usersWithStaking);
      setFilteredUsers(usersWithStaking);
    } catch (error) {
      console.error('Error fetching users with staking:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users and staking data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Ensure selected user always has freshest staking data
  const fetchStakingForUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_staking')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let stakingConfigs = data || [];

      // Auto-initialize staking if user has ETH but no staking config
      if (stakingConfigs.length === 0) {
        console.log('No staking config found, checking ETH balance...');
        
        // Check if user has ETH balance
        const { data: walletData, error: walletError } = await supabase
          .from('user_wallets')
          .select('balance_crypto')
          .eq('user_id', userId)
          .eq('asset_symbol', 'ETH')
          .maybeSingle();

        if (!walletError && walletData && walletData.balance_crypto > 0) {
          console.log('User has ETH balance, auto-creating staking config...');
          
          // Get wallet creation date to backdate staking
          const { data: walletDetails, error: walletDetailsError } = await supabase
            .from('user_wallets')
            .select('created_at, balance_crypto')
            .eq('user_id', userId)
            .eq('asset_symbol', 'ETH')
            .single();

          if (!walletDetailsError && walletDetails) {
            const walletCreatedAt = new Date(walletDetails.created_at);
            const now = new Date();
            const daysStaking = (now.getTime() - walletCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
            const dailyYield = 0.0065; // 0.65%
            const accumulatedProfits = walletDetails.balance_crypto * dailyYield * daysStaking;

            // Create initial staking configuration backdated to wallet creation
            const { data: newStaking, error: insertError } = await supabase
              .from('user_staking')
              .insert({
                user_id: userId,
                asset_symbol: 'ETH',
                is_staking: true,
                daily_yield_percent: dailyYield,
                staking_start_time: walletCreatedAt.toISOString(),
                last_calculation_time: now.toISOString(),
                total_profits_earned: accumulatedProfits,
                accrued_profits: accumulatedProfits,
              })
              .select()
              .single();

            if (!insertError && newStaking) {
              stakingConfigs = [newStaking];
              console.log('Staking auto-initialized successfully');
              
              toast({
                title: "Staking Auto-Initialized",
                description: `ETH staking backdated to ${walletCreatedAt.toLocaleDateString()} with ${accumulatedProfits.toFixed(8)} ETH earned`,
              });
            } else {
              console.error('Failed to auto-initialize staking:', insertError);
            }
          }
        }
      }

      // Update all relevant states to keep UI in sync
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, staking_configs: stakingConfigs } : u));
      setFilteredUsers(prev => prev.map(u => u.user_id === userId ? { ...u, staking_configs: stakingConfigs } : u));
      setSelectedUser(prev => prev && prev.user_id === userId ? { ...prev, staking_configs: stakingConfigs } : prev);
    } catch (err) {
      console.error('Error fetching staking for user:', err);
    }
  };

  // If a selected user has no staking configs loaded yet, fetch them
  useEffect(() => {
    if (selectedUser && selectedUser.staking_configs.length === 0) {
      fetchStakingForUser(selectedUser.user_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.user_id]);

const updateStakingConfiguration = async () => {
  if (!editingStaking) return;

  try {
    // Only check ETH balance when changing from disabled to enabled (not when already enabled)
    const wasStakingDisabled = !editingStaking.is_staking;
    if (isStaking && wasStakingDisabled && assetSymbol === 'ETH') {
      const result: any = (supabase as any)
        .from('user_wallets')
        .select('balance_crypto')
        .eq('user_id', editingStaking.user_id)
        .eq('asset_symbol', 'ETH')
        .eq('is_hd_wallet', true)
        .limit(1)
        .single();

      const { data: walletData, error: walletError } = await result;

      if (walletError || !walletData || walletData.balance_crypto <= 0) {
        toast({
          title: "Cannot Enable Staking",
          description: "User must have ETH balance > 0 to enable staking",
          variant: "destructive",
        });
        return;
      }
    }

    const payload = {
      asset_symbol: 'ETH',
      staking_start_time: stakingStartTime,
      is_staking: isStaking,
      daily_yield_percent: parseFloat(dailyYieldPercent) / 100,
      total_profits_earned: parseFloat(totalEarnings),
      accrued_profits: parseFloat(accruedProfits),
      last_calculation_time: lastCalculationTime || new Date().toISOString(),
    } as const;

    if (editingStaking.id) {
      // Update existing staking configuration
      const { error: stakingError } = await supabase
        .from('user_staking')
        .update(payload)
        .eq('id', editingStaking.id);

      if (stakingError) throw stakingError;

      toast({
        title: "Success",
        description: "Staking configuration updated successfully",
        duration: 1000,
      });
    } else {
      // Create new staking configuration
      const { error: insertError } = await supabase
        .from('user_staking')
        .insert({
          user_id: editingStaking.user_id,
          ...payload,
          last_calculation_time: new Date().toISOString(),
          accrued_profits: 0,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Staking configuration created successfully",
        duration: 1000,
      });
    }

    setIsEditDialogOpen(false);
    setEditingStaking(null);
    resetForm();
    fetchUsersWithStaking();
  } catch (error) {
    console.error('Error updating staking configuration:', error);
    toast({
      title: "Error",
      description: "Failed to save staking configuration",
      variant: "destructive",
    });
  }
};

  const handleQuickToggle = async (stakingId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      // Optimistically update all relevant states immediately
      const updateUserStaking = (userList: UserWithStaking[]) =>
        userList.map(user => ({
          ...user,
          staking_configs: user.staking_configs.map(config =>
            config.id === stakingId 
              ? { ...config, is_staking: newStatus }
              : config
          )
        }));

      setUsers(updateUserStaking);
      setFilteredUsers(updateUserStaking);
      
      // Update selectedUser if it contains this staking config
      if (selectedUser && selectedUser.staking_configs.some(s => s.id === stakingId)) {
        setSelectedUser(prev => prev ? updateUserStaking([prev])[0] : null);
      }

      // If enabling staking, check if user has ETH balance
      if (newStatus) {
        const stakingRecord = users.flatMap(u => u.staking_configs).find(s => s.id === stakingId);
        if (stakingRecord) { // Removed asset check since user_staking doesn't have asset_symbol
          const result: any = (supabase as any)
            .from('user_wallets')
            .select('balance_crypto')
            .eq('user_id', stakingRecord.user_id)
            .eq('asset_symbol', 'ETH')
            .eq('is_hd_wallet', true)
            .single();

          const { data: walletData, error: walletError } = await result;

          if (walletError || !walletData || walletData.balance_crypto <= 0) {
            // Revert optimistic update on all states
            const revertUserStaking = (userList: UserWithStaking[]) =>
              userList.map(user => ({
                ...user,
                staking_configs: user.staking_configs.map(config =>
                  config.id === stakingId 
                    ? { ...config, is_staking: currentStatus }
                    : config
                )
              }));

            setUsers(revertUserStaking);
            setFilteredUsers(revertUserStaking);
            if (selectedUser && selectedUser.staking_configs.some(s => s.id === stakingId)) {
              setSelectedUser(prev => prev ? revertUserStaking([prev])[0] : null);
            }
            
            toast({
              title: "Cannot Enable Staking",
              description: "User must have ETH balance > 0 to enable staking",
              variant: "destructive",
            });
            return;
          }
        }
      }

      const { error } = await supabase
        .from('user_staking')
        .update({ is_staking: newStatus })
        .eq('id', stakingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Staking ${newStatus ? 'enabled' : 'disabled'} successfully`,
      });

      // Refresh data to ensure consistency
      fetchUsersWithStaking();
    } catch (error) {
      console.error('Error toggling staking:', error);
      
      // Revert optimistic update on error for all states
      const revertUserStaking = (userList: UserWithStaking[]) =>
        userList.map(user => ({
          ...user,
          staking_configs: user.staking_configs.map(config =>
            config.id === stakingId 
              ? { ...config, is_staking: currentStatus }
              : config
          )
        }));

      setUsers(revertUserStaking);
      setFilteredUsers(revertUserStaking);
      if (selectedUser && selectedUser.staking_configs.some(s => s.id === stakingId)) {
        setSelectedUser(prev => prev ? revertUserStaking([prev])[0] : null);
      }
      
      toast({
        title: "Error",
        description: "Failed to toggle staking status",
        variant: "destructive",
      });
    }
  };

const openEditDialog = (staking: UserStaking) => {
  setEditingStaking(staking);
  setAssetSymbol('ETH'); // Always ETH now
  setIsStaking(staking.is_staking);
  setStakingStartTime(new Date(staking.staking_start_time).toISOString().slice(0, 16));
  setDailyYieldPercent((staking.daily_yield_percent * 100).toString());
  setTotalEarnings(staking.total_profits_earned.toString());
  // Calculate USD value from ETH earnings
  const usdValue = staking.total_profits_earned * (prices.ethereum || 3800);
  setTotalEarningsUSD(usdValue.toFixed(2));
  setAccruedProfits(staking.accrued_profits?.toString() || '0');
  setLastCalculationTime(staking.last_calculation_time ? new Date(staking.last_calculation_time).toISOString().slice(0, 16) : '');
  setIsEditDialogOpen(true);
};

const openCreateDialog = (userId: string) => {
  setEditingStaking({
    id: '',
    user_id: userId,
    asset_symbol: 'ETH',
    daily_yield_percent: 0.0065,
    staking_start_time: new Date().toISOString(),
    last_calculation_time: new Date().toISOString(),
    total_profits_earned: 0,
    accrued_profits: 0,
    is_staking: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as UserStaking);
  setAssetSymbol('ETH');
  setIsStaking(false);
  setStakingStartTime(new Date().toISOString().slice(0, 16));
  setDailyYieldPercent('0.65');
  setTotalEarnings('0');
  setTotalEarningsUSD('0');
  setAccruedProfits('0');
  setLastCalculationTime(new Date().toISOString().slice(0, 16));
  setIsEditDialogOpen(true);
};

const resetForm = () => {
  setAssetSymbol('ETH');
  setIsStaking(true);
  setStakingStartTime('');
  setDailyYieldPercent('0.65');
  setTotalEarnings('0');
  setTotalEarningsUSD('0');
  setAccruedProfits('0');
  setLastCalculationTime('');
};

  const extractUsername = (email: string): string => {
    if (!email) return 'no-username';
    return email.split('@')[0];
  };

  const getAllStakingConfigs = () => {
    return users.flatMap(user => user.staking_configs);
  };

  const allStakingConfigs = getAllStakingConfigs();
const totalUsers = allStakingConfigs.length;
const activeStakers = allStakingConfigs.filter(s => s.is_staking).length;
const totalEarningsSum = allStakingConfigs.reduce((sum, s) => sum + s.total_profits_earned, 0);
const avgYield = allStakingConfigs.length > 0 ? 
  (allStakingConfigs.reduce((sum, s) => sum + s.daily_yield_percent, 0) / allStakingConfigs.length) * 100 : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <style>{`
        .force-black-input::placeholder { color:#000 !important; opacity:1 !important; }
        .force-select-black [data-placeholder] { color:#000 !important; opacity:1 !important; }
        .force-select-black > span { color:#000 !important; }
        .force-select-black span[data-placeholder] { color:#000 !important; }
      `}</style>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection Panel */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Users className="w-5 h-5 text-primary" />
              Select User
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Search and select a user to manage their staking</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-left bg-white !text-black caret-black placeholder:text-muted-foreground"
                style={{ color: '#000', WebkitTextFillColor: '#000' }}
              />
            </div>

            {/* User Dropdown */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2">Loading users...</p>
              </div>
            ) : (
              <Select
                value={selectedUser?.user_id}
                onValueChange={async (id) => {
                  const u = users.find((usr) => usr.user_id === id) || null;
                  setSelectedUser(u);
                  // Always fetch latest staking for this user to avoid empty state due to stale data/RLS
                  await fetchStakingForUser(id);
                }}
              >
                	<SelectTrigger className="h-11 bg-white border border-gray-300 text-black [&>span]:!text-black [&>span[data-placeholder]]:!text-black [&>svg]:!text-black" style={{ color: '#000', WebkitTextFillColor: '#000' }}>
                  <SelectValue placeholder="Pick a client" className="!text-black" style={{ color: '#000', WebkitTextFillColor: '#000' }} />
                </SelectTrigger>
                <SelectContent className="bg-white !text-black border border-gray-300 z-[100] [&_*]:!text-black selection:text-black selection:bg-blue-200">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <SelectItem
                        key={u.user_id}
                        value={u.user_id}
                        className="!text-black [&_*]:!text-black hover:bg-gray-100 focus:bg-gray-100 focus:!text-black data-[highlighted]:!text-black data-[state=checked]:!text-black selection:text-black selection:bg-blue-200"
                      >
                        {(u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : (u.full_name || u.email?.split('@')[0] || 'Unknown'))} - {u.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* User Staking Details Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              User Staking Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a user to view their staking configurations
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="font-medium">
                    {selectedUser.first_name && selectedUser.last_name 
                      ? `${selectedUser.first_name} ${selectedUser.last_name}` 
                      : selectedUser.full_name || extractUsername(selectedUser.email)
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>

                {selectedUser.staking_configs.length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-muted-foreground">No staking configurations found for this user.</p>
                    <Button
                      onClick={() => openCreateDialog(selectedUser.user_id)}
                      className="bg-[#F97316] hover:bg-[#EA580C] text-white"
                    >
                      Create Staking Configuration
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedUser.staking_configs.map((staking) => (
                      <div key={staking.id} className="rounded-xl p-4 border border-white/15 bg-white/5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/20">ETH</span>
                              <Badge className={`${staking.is_staking ? 'bg-primary/20 text-primary border-primary/30' : 'bg-red-100 text-red-800'} rounded-full px-3 py-1 text-xs`}>
                                {staking.is_staking ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <div>Daily Rate: {(staking.daily_yield_percent * 100).toFixed(2)}%</div>
                              <div>Total Earnings: {formatNumber(staking.total_profits_earned)} ETH</div>
                              <div>Started: {new Date(staking.staking_start_time).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`staking-toggle-${staking.id}`} className="text-xs font-medium">
                                Toggle Staking
                              </Label>
                              <Switch
                                id={`staking-toggle-${staking.id}`}
                                checked={staking.is_staking}
                                onCheckedChange={() => handleQuickToggle(staking.id, staking.is_staking)}
                                className="data-[state=checked]:bg-black data-[state=unchecked]:bg-gray-300"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(staking)}
                              className="rounded-full border-2 border-[#F97316] text-[#F97316] hover:bg-[#F97316]/10 w-8 h-8"
                              aria-label="Edit staking configuration"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingStaking?.id ? 'Edit Staking Configuration' : 'Create Staking Configuration'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Asset Symbol</Label>
              <div className="px-3 py-2 border-2 border-[#F97316] rounded-md bg-gray-50 text-xs">
                ETH
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-white">Enable Staking</Label>
              <Switch 
                checked={isStaking} 
                onCheckedChange={setIsStaking}
                className="data-[state=checked]:bg-[#F97316]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Staking Start Time</Label>
              <Input
                type="datetime-local"
                value={stakingStartTime}
                onChange={(e) => setStakingStartTime(e.target.value)}
                className="text-xs border-2 border-[#F97316] focus:ring-[#F97316] focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Last Calculation Time</Label>
              <Input
                type="datetime-local"
                value={lastCalculationTime}
                onChange={(e) => setLastCalculationTime(e.target.value)}
                className="text-xs border-2 border-[#F97316] focus:ring-[#F97316] focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Daily Yield %</Label>
              <Input
                type="number"
                step="0.01"
                value={dailyYieldPercent}
                onChange={(e) => setDailyYieldPercent(e.target.value)}
                className="text-xs border-2 border-[#F97316] focus:ring-[#F97316] focus:border-[#F97316]"
                placeholder="0.65"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Total Profits Earned (ETH)</Label>
              <Input
                type="number"
                step="0.000001"
                value={totalEarnings}
                onChange={(e) => {
                  const ethValue = e.target.value;
                  setTotalEarnings(ethValue);
                  // Auto-update USD value when ETH changes
                  const usdValue = parseFloat(ethValue) * (prices.ethereum || 3800);
                  setTotalEarningsUSD(isNaN(usdValue) ? '0' : usdValue.toFixed(2));
                }}
                className="text-xs border-2 border-[#F97316] focus:ring-[#F97316] focus:border-[#F97316]"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Total Profits Earned (USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={totalEarningsUSD}
                onChange={(e) => {
                  const usdValue = e.target.value;
                  setTotalEarningsUSD(usdValue);
                  // Auto-update ETH value when USD changes
                  const ethPrice = prices.ethereum || 3800;
                  const ethValue = parseFloat(usdValue) / ethPrice;
                  setTotalEarnings(isNaN(ethValue) ? '0' : ethValue.toFixed(6));
                }}
                className="text-xs border-2 border-[#F97316] focus:ring-[#F97316] focus:border-[#F97316]"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Accrued Profits (ETH)</Label>
              <Input
                type="number"
                step="0.000001"
                value={accruedProfits}
                onChange={(e) => setAccruedProfits(e.target.value)}
                className="text-xs border-2 border-[#F97316] focus:ring-[#F97316] focus:border-[#F97316]"
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Pending profits not yet added to total</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1 text-white border-[#F97316] hover:bg-[#F97316]/10">
                Cancel
              </Button>
              <Button onClick={updateStakingConfiguration} className="flex-1 bg-[#F97316] hover:bg-[#EA580C] text-white">
                {editingStaking?.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}