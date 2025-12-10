
import React, { useState, useEffect } from 'react';
import { Search, Wallet, Save, RefreshCw, Edit, Check, X, DollarSign, Shield, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useLivePrices } from '@/hooks/useLivePrices';

interface UserProfile {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface UserWallet {
  id: string;
  asset_symbol: string;
  wallet_address: string;
  nickname: string;
  balance_crypto: number;
  balance_fiat: number;
  is_active: boolean;
  updated_at: string;
}

interface BankDepositDetails {
  id: string;
  user_id: string;
  amount_eur: number;
}

const AdminWalletManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [newCryptoBalance, setNewCryptoBalance] = useState('');
  const [saving, setSaving] = useState(false);

  // EUR Balance state
  const [eurDepositDetails, setEurDepositDetails] = useState<BankDepositDetails | null>(null);
  const [editingEurBalance, setEditingEurBalance] = useState(false);
  const [newEurBalance, setNewEurBalance] = useState('');

  const { getPriceForCrypto } = useLivePrices();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserWallets();
      fetchEurBalance();
    }
  }, [selectedUserId]);

  // Fetch EUR balance for selected user
  const fetchEurBalance = async () => {
    if (!selectedUserId) return;

    try {
      const { data, error } = await supabase
        .from('user_bank_deposit_details')
        .select('id, user_id, amount_eur')
        .eq('user_id', selectedUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching EUR balance:', error);
        return;
      }

      setEurDepositDetails(data || null);
    } catch (error) {
      console.error('Error fetching EUR balance:', error);
    }
  };

  // Save EUR balance
  const saveEurBalance = async () => {
    const eurAmount = parseFloat(newEurBalance);
    if (isNaN(eurAmount) || eurAmount < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      if (eurDepositDetails?.id) {
        const { error } = await supabase
          .from('user_bank_deposit_details')
          .update({
            amount_eur: eurAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', eurDepositDetails.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_bank_deposit_details')
          .insert([{
            user_id: selectedUserId,
            amount_eur: eurAmount,
          }]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `EUR balance updated to €${eurAmount.toFixed(2)}`,
        duration: 2000,
      });

      setEditingEurBalance(false);
      setNewEurBalance('');
      await fetchEurBalance();
    } catch (error) {
      console.error('Error saving EUR balance:', error);
      toast({
        title: "Error",
        description: "Failed to update EUR balance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Real-time subscription for wallet updates
  useEffect(() => {
    if (!selectedUserId) return;

    console.log('🔄 Setting up real-time subscription for wallet updates...');
    
    const channel = supabase
      .channel('admin-wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${selectedUserId}`
        },
        (payload) => {
          console.log('💰 Admin wallet update received:', payload);
          fetchUserWallets();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up admin wallet subscription');
      supabase.removeChannel(channel);
    };
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users for wallet management...');
      
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

      // Filter out orphaned profiles (users that don't exist in auth)
      const validProfiles = profiles?.filter(profile => 
        emailResponse?.users?.some((u: any) => u.id === profile.user_id)
      );

      // Format profiles data for the dropdown
      const usersWithEmails = validProfiles?.map(profile => ({
        id: profile.user_id,
        full_name: profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : profile.full_name || profile.email || 'Unknown User',
        email: profile.email || `${profile.user_id}@example.com`
      })) || [];
      
      console.log('Fetched users:', usersWithEmails);
      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserWallets = async () => {
    if (!selectedUserId) return;
    
    try {
      console.log('Fetching wallets for user:', selectedUserId);
      
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', selectedUserId)
        .order('asset_symbol', { ascending: true });

      if (error) {
        console.error('Supabase error fetching wallets:', error);
        throw error;
      }
      
      console.log('Fetched wallets data:', data);
      console.log('Number of wallets found:', data?.length || 0);
      setUserWallets(data || []);
    } catch (error) {
      console.error('Error fetching user wallets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user wallets",
        variant: "destructive",
      });
    }
  };


  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
    setEditingWallet(null);
    setEditingBalance(null);
  };

  const startEditingWallet = (walletId: string, currentAddress: string) => {
    setEditingWallet(walletId);
    setNewAddress(currentAddress);
    setEditingBalance(null);
  };

  const startEditingBalance = (walletId: string, currentBalance: number) => {
    setEditingBalance(walletId);
    setNewCryptoBalance(currentBalance.toString());
    setEditingWallet(null);
  };

  const cancelEditing = () => {
    setEditingWallet(null);
    setEditingBalance(null);
    setNewAddress('');
    setNewCryptoBalance('');
  };

  const saveWalletAddress = async (walletId: string) => {
    if (!newAddress.trim()) {
      toast({
        title: "Error",
        description: "Address cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      console.log('Updating wallet address:', walletId, newAddress);

      // Get the wallet to find user_id and asset_symbol for deposit_addresses sync
      const wallet = userWallets.find(w => w.id === walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Update user_wallets
      const { error: walletError } = await supabase
        .from('user_wallets')
        .update({ 
          wallet_address: newAddress.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId);

      if (walletError) throw walletError;

      // CRITICAL: Also update deposit_addresses to keep tables in sync
      const { error: depositError } = await supabase
        .from('deposit_addresses')
        .update({ 
          address: newAddress.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', selectedUserId)
        .eq('asset_symbol', wallet.asset_symbol);

      if (depositError) {
        console.error('Error updating deposit address:', depositError);
        throw new Error('Failed to sync deposit address');
      }

      toast({
        title: "Success",
        description: "Wallet address updated successfully in both tables",
        duration: 1000,
      });

      await fetchUserWallets();
      setEditingWallet(null);
      setNewAddress('');
    } catch (error) {
      console.error('Error updating wallet address:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update wallet address",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  const saveWalletBalance = async (walletId: string, assetSymbol: string) => {
    const cryptoAmount = parseFloat(newCryptoBalance);
    if (isNaN(cryptoAmount) || cryptoAmount < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      console.log('Updating wallet balance:', walletId, cryptoAmount);

      // For stablecoins, use $1 as the price
      let currentPrice = 1.0;
      if (assetSymbol !== 'USDT' && assetSymbol !== 'USDT-ERC20' && assetSymbol !== 'USDT_TRON' && 
          assetSymbol !== 'USDT-TRC20' && assetSymbol !== 'USDC' && assetSymbol !== 'USDC-ERC20') {
        const cryptoId = assetSymbol === 'BTC' ? 'bitcoin' : 
                       assetSymbol === 'ETH' ? 'ethereum' : 
                       assetSymbol.toLowerCase();
        currentPrice = getPriceForCrypto(cryptoId);
      }
      
      const fiatAmount = cryptoAmount * currentPrice;

      const { error } = await supabase
        .from('user_wallets')
        .update({ 
          balance_crypto: cryptoAmount,
          balance_fiat: fiatAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Wallet balance updated to ${cryptoAmount} ${assetSymbol} (~$${fiatAmount.toFixed(2)})`,
      });

      await fetchUserWallets();
      setEditingBalance(null);
      setNewCryptoBalance('');
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      toast({
        title: "Error",
        description: "Failed to update wallet balance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  const filteredUsers = users.filter(user =>
    
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateFiatValue = (cryptoAmount: string, assetSymbol: string) => {
    const amount = parseFloat(cryptoAmount);
    if (isNaN(amount)) return 0;
    
    // For stablecoins, use $1 as the price
    if (assetSymbol === 'USDT' || assetSymbol === 'USDT-ERC20' || assetSymbol === 'USDT_TRON' || assetSymbol === 'USDT-TRC20' ||
        assetSymbol === 'USDC' || assetSymbol === 'USDC-ERC20') {
      return amount * 1.0;
    }
    
    const cryptoId = assetSymbol === 'BTC' ? 'bitcoin' : 
                    assetSymbol === 'ETH' ? 'ethereum' : 
                    assetSymbol.toLowerCase();
    
    const price = getPriceForCrypto(cryptoId);
    return amount * price;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[hsl(var(--accent-blue))]/5 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(var(--accent-purple))]/5 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container-responsive space-y-6 sm:space-y-8 py-6 sm:py-8 relative z-10">
        <div className="text-center mb-8 fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="icon-container">
              <Wallet className="w-5 sm:w-8 h-5 sm:h-8 text-white" />
            </div>
            <h1 className="text-[1.625rem] sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Admin Wallet Management
            </h1>
          </div>
          <p className="text-white text-[0.65rem] sm:text-base max-w-2xl mx-auto font-medium">
            Manage user wallets and balances with our secure admin interface.
          </p>
        </div>

        <div className="wallet-card fade-in" style={{animationDelay: '0.1s'}}>
          {/* User Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="icon-container bg-[#F97316]/20">
                <Search className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-[#F97316]" />
              </div>
              <Label className="text-[0.8125rem] sm:text-xl font-extrabold text-white">
                Wallet Overview
              </Label>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-3.5 sm:w-5 h-3.5 sm:h-5" />
              <Input
                placeholder="Search wallets by name, address, or status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-11 bg-black text-white placeholder:text-white/50 border-white/20 focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] text-[0.65rem] sm:text-base h-8 sm:h-10"
              />
            </div>
            
            <Select value={selectedUserId} onValueChange={handleUserSelect}>
              <SelectTrigger className="glass-card border-border text-white text-[0.65rem] sm:text-base h-8 sm:h-10">
                <SelectValue placeholder="Select a user..." className="text-white" />
              </SelectTrigger>
              <SelectContent className="glass-card border-border shadow-xl z-50 max-h-60 overflow-auto bg-slate-800">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-white/60 text-[0.65rem] sm:text-sm">
                    {loading ? 'Loading users...' : 'No users found'}
                  </div>
                ) : (
                  filteredUsers.map((user, index) => (
                    <SelectItem 
                      key={user.id} 
                      value={user.id} 
                      className="hover:bg-slate-700 focus:bg-slate-700 text-white fade-in text-[0.65rem] sm:text-sm"
                      style={{animationDelay: `${0.05 * index}s`}}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{user.full_name}</span>
                        <span className="text-[0.585rem] sm:text-xs text-white/60">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedUser && (
              <div className="bg-gradient-to-r from-[#F97316]/20 to-[#F97316]/10 p-3 sm:p-5 rounded-xl border-2 border-[#F97316]/40 fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="icon-container bg-[#F97316]/30">
                    <Shield className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-white" />
                  </div>
                  <h3 className="text-[0.7475rem] sm:text-lg font-bold text-white">Selected User</h3>
                </div>
                <div className="text-[0.65rem] sm:text-base text-white space-y-2">
                  <p className="flex items-center gap-2">
                    <strong className="font-bold">Name:</strong> 
                    <span className="font-medium">{selectedUser.full_name}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <strong className="font-bold">Email:</strong> 
                    <span className="font-medium">{selectedUser.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <strong className="font-bold">ID:</strong> 
                    <span className="font-mono text-[0.585rem] sm:text-sm font-medium">{selectedUser.id}</span>
                  </p>
                </div>
              </div>
            )}

            {/* EUR Balance Section */}
            {selectedUser && (
              <div className="bg-gradient-to-r from-green-500/20 to-green-500/10 p-4 sm:p-6 rounded-xl border-2 border-green-500/40 fade-in space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="icon-container bg-green-500/30">
                    <Banknote className="w-4 sm:w-6 h-4 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-xl font-bold text-white">EUR Balance</h3>
                </div>

                <div className="bg-black/30 p-4 rounded-lg border border-white/20">
                  <p className="text-xs sm:text-sm text-white/80 mb-1 font-medium">Current EUR Balance</p>

                  {editingEurBalance ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-green-400 text-xl font-bold">€</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={newEurBalance}
                          onChange={(e) => setNewEurBalance(e.target.value)}
                          className="w-full sm:w-40 bg-black text-white border-white/20 text-lg font-bold"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={saveEurBalance}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold"
                          disabled={saving}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingEurBalance(false);
                            setNewEurBalance('');
                          }}
                          className="border-white/40 text-white hover:bg-white/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-2xl sm:text-4xl font-extrabold text-green-400">
                        €{(eurDepositDetails?.amount_eur || 0).toFixed(2)}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingEurBalance(true);
                          setNewEurBalance((eurDepositDetails?.amount_eur || 0).toString());
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assets Summary */}
            {selectedUser && userWallets.length > 0 && (
              <div className="bg-gradient-to-r from-[#F97316]/20 to-[#F97316]/10 p-4 sm:p-6 rounded-xl border-2 border-[#F97316]/40 fade-in space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="icon-container bg-[#F97316]/30">
                    <DollarSign className="w-4 sm:w-6 h-4 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-xl font-bold text-white">Assets Summary</h3>
                </div>

                {/* Total Portfolio Value */}
                <div className="bg-black/30 p-4 rounded-lg border border-white/20">
                  <p className="text-xs sm:text-sm text-white/80 mb-1 font-medium">Total Portfolio Value</p>
                  <p className="text-2xl sm:text-4xl font-extrabold text-[#FB923C]">
                    ${userWallets.reduce((total, wallet) => {
                      return total + calculateFiatValue(wallet.balance_crypto.toString(), wallet.asset_symbol);
                    }, 0).toFixed(2)}
                  </p>
                </div>

                {/* Assets Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {userWallets.map((wallet) => {
                    const fiatValue = calculateFiatValue(wallet.balance_crypto.toString(), wallet.asset_symbol);
                    return (
                      <div key={wallet.id} className="bg-black/30 p-3 rounded-lg border border-white/20 hover:border-[#F97316]/60 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#F97316]/20 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs sm:text-sm font-bold">
                              {wallet.asset_symbol.slice(0, 2)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-white">{wallet.asset_symbol}</p>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-white mb-1">
                          {wallet.balance_crypto.toFixed(6)}
                        </p>
                        <p className="text-xs sm:text-sm text-[#FB923C] font-semibold">
                          ${fiatValue.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Wallets Display */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-center">
                  <div className="w-6 sm:w-8 h-6 sm:h-8 border-4 border-[hsl(var(--accent-blue))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-secondary text-[0.65rem] sm:text-base">Loading wallets...</p>
                </div>
              </div>
            ) : selectedUser && userWallets.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-8 sm:w-12 h-8 sm:h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                <p className="text-secondary text-[0.65rem] sm:text-base">No wallets found for this user.</p>
              </div>
            ) : selectedUser && userWallets.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b-2 border-white/15">
                  <h3 className="text-[0.81rem] sm:text-2xl font-extrabold text-white flex items-center gap-3">
                    <div className="icon-container bg-[#F97316]/20">
                      <Wallet className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-[#F97316]" />
                    </div>
                    User Wallets
                  </h3>
                  <div className="text-[0.585rem] sm:text-sm text-white font-bold bg-[#F97316]/20 px-2 sm:px-4 py-1 sm:py-2 rounded-full border-2 border-[#F97316]/40">
                    {userWallets.length} Wallets
                  </div>
                </div>

                {userWallets.map((wallet, index) => (
                  <div key={wallet.id} className="asset-card fade-in border-2 border-white/10 hover:border-[#F97316]/40 transition-all" style={{animationDelay: `${0.1 * index}s`}}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-5 pb-4 border-b border-white/15 gap-3">
                      <div className="flex items-center gap-4">
                        <div className="icon-container bg-[#F97316]/20 w-8 sm:w-12 h-8 sm:h-12">
                          <span className="text-white text-[0.7475rem] sm:text-lg font-extrabold">
                            {wallet.asset_symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-[0.81rem] sm:text-xl font-bold text-white">{wallet.asset_symbol}</h4>
                          <p className="text-[0.585rem] sm:text-sm text-white/80 flex items-center gap-2 font-medium">
                            <Shield className="w-2.5 sm:w-4 h-2.5 sm:h-4" />
                            {wallet.nickname || 'No nickname'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto sm:text-right">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                          {editingBalance === wallet.id ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                              <div className="flex flex-col w-full sm:w-auto">
                                <Input
                                  type="number"
                                  step="0.000001"
                                  value={newCryptoBalance}
                                  onChange={(e) => setNewCryptoBalance(e.target.value)}
                                  className="w-full sm:w-36 text-right input-field text-[0.585rem] sm:text-sm font-bold text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] h-7 sm:h-9"
                                  placeholder="0.000000"
                                />
                                <span className="text-[0.52rem] sm:text-xs text-white/90 mt-1 font-semibold">
                                  ~${calculateFiatValue(newCryptoBalance, wallet.asset_symbol).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveWalletBalance(wallet.id, wallet.asset_symbol)}
                                  className="px-2 sm:px-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold border-2 border-[#F97316] focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 h-7 sm:h-9 text-[0.585rem] sm:text-sm"
                                  disabled={saving}
                                >
                                  {saving ? <RefreshCw className="w-3 sm:w-4 h-3 sm:h-4 animate-spin" /> : <Save className="w-3 sm:w-4 h-3 sm:h-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  className="px-2 sm:px-3 border-2 border-white/40 text-white hover:bg-white/10 focus:ring-2 focus:ring-white focus:ring-offset-2 h-7 sm:h-9"
                                >
                                  <X className="w-3 sm:w-4 h-3 sm:h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                              <div className="text-left sm:text-right w-full sm:w-auto">
                                <p className="text-[0.7475rem] sm:text-lg font-bold text-white">
                                  {wallet.balance_crypto.toFixed(2)} {wallet.asset_symbol}
                                </p>
                                <p className="text-[0.65rem] sm:text-base text-[#FB923C] font-bold">
                                  ${calculateFiatValue(wallet.balance_crypto.toString(), wallet.asset_symbol).toFixed(2)}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => startEditingBalance(wallet.id, wallet.balance_crypto)}
                                className="px-2 sm:px-4 py-1 sm:py-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold border-2 border-[#F97316] focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 h-7 sm:h-9 text-[0.585rem] sm:text-sm w-full sm:w-auto"
                                title="Edit balance"
                              >
                                <Edit className="w-2.5 sm:w-4 h-2.5 sm:h-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 pb-3 border-b border-white/15">
                        <span className="text-[0.585rem] sm:text-sm font-bold text-white w-full sm:w-24 flex-shrink-0 pt-2">Wallet Address:</span>
                        {editingWallet === wallet.id ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full">
                            <Input
                              value={newAddress}
                              onChange={(e) => setNewAddress(e.target.value)}
                              placeholder="Enter wallet address"
                              className="flex-1 input-field text-white font-mono font-medium placeholder:text-white/50 focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] text-[0.585rem] sm:text-sm h-7 sm:h-10"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveWalletAddress(wallet.id)}
                                className="px-2 sm:px-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold border-2 border-[#F97316] focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 h-7 sm:h-9 flex-1 sm:flex-none"
                                disabled={saving}
                              >
                                {saving ? <RefreshCw className="w-3 sm:w-4 h-3 sm:h-4 animate-spin" /> : <Save className="w-3 sm:w-4 h-3 sm:h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                className="px-2 sm:px-3 border-2 border-white/40 text-white hover:bg-white/10 focus:ring-2 focus:ring-white focus:ring-offset-2 h-7 sm:h-9 flex-1 sm:flex-none"
                              >
                                <X className="w-3 sm:w-4 h-3 sm:h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full">
                            <span className="text-[0.585rem] sm:text-sm font-mono font-bold bg-white/10 border-2 border-white/20 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl flex-1 truncate text-white">
                              {wallet.wallet_address}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => startEditingWallet(wallet.id, wallet.wallet_address)}
                              className="px-2 sm:px-4 py-1 sm:py-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold border-2 border-[#F97316] focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 h-7 sm:h-9 text-[0.585rem] sm:text-sm"
                              title="Edit wallet address"
                            >
                              <Edit className="w-2.5 sm:w-4 h-2.5 sm:h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pb-3 border-b border-white/15">
                        <span className="text-[0.585rem] sm:text-sm font-bold text-white w-20 sm:w-24 flex-shrink-0">Status:</span>
                        <Badge 
                          className={wallet.is_active 
                            ? "bg-[#FB923C] text-white border-2 border-[#FB923C] font-bold px-2 sm:px-4 py-1 sm:py-1.5 text-[0.585rem] sm:text-sm" 
                            : "bg-gray-500 text-white border-2 border-gray-500 font-bold px-2 sm:px-4 py-1 sm:py-1.5 text-[0.585rem] sm:text-sm"
                          }
                        >
                          {wallet.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[0.585rem] sm:text-sm font-bold text-white w-20 sm:w-24 flex-shrink-0">Last Updated:</span>
                        <span className="text-white/80 font-medium text-[0.585rem] sm:text-sm">{new Date(wallet.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !selectedUser ? (
              <div className="text-center py-12">
                <Wallet className="w-8 sm:w-12 h-8 sm:h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                <p className="text-secondary text-[0.65rem] sm:text-base">Select a user to manage their wallets</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWalletManagement;
