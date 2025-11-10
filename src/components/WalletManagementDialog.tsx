
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Shield, Edit, Save, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserWallet {
  id: string;
  asset_symbol: string;
  wallet_address: string;
  nickname: string;
  balance_crypto: number;
  balance_fiat: number;
}

interface WalletManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    full_name?: string;
  } | null;
  onWalletUpdate?: () => void;
}

const WalletManagementDialog: React.FC<WalletManagementDialogProps> = ({
  open,
  onOpenChange,
  user,
  onWalletUpdate
}) => {
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchUserWallets();
    }
  }, [open, user]);

  const fetchUserWallets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result: any = (supabase as any)
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_hd_wallet', true)
        .order('asset_symbol');

      const { data, error } = await result;

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching user wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user wallets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWallet = async (walletId: string, updates: Partial<UserWallet>) => {
    try {
      const { error } = await supabase
        .from('user_wallets')
        .update(updates)
        .eq('id', walletId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Wallet updated successfully',
      });

      await fetchUserWallets();
      onWalletUpdate?.();
      setEditingWallet(null);
      setNewAddress('');
    } catch (error) {
      console.error('Error updating wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to update wallet',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (wallet: UserWallet) => {
    setEditingWallet(wallet.id);
    setNewAddress(wallet.wallet_address);
  };

  const cancelEditing = () => {
    setEditingWallet(null);
    setNewAddress('');
  };

  const saveAddress = async (walletId: string) => {
    if (!newAddress.trim()) {
      toast({
        title: 'Error',
        description: 'Address cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    await handleUpdateWallet(walletId, { wallet_address: newAddress.trim() });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-card border-border">
        <DialogHeader>
          <DialogTitle className="text-responsive-lg font-bold text-primary flex items-center gap-3">
            <div className="icon-container">
              <Wallet className="w-5 h-5 text-accent-blue" />
            </div>
            Manage Wallets for {user.full_name || user.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-[hsl(var(--accent-blue))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-secondary">Loading wallets...</p>
              </div>
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary">No wallets found for this user.</p>
            </div>
          ) : (
            wallets.map((wallet, index) => (
              <div key={wallet.id} className="asset-card fade-in" style={{animationDelay: `${0.1 * index}s`}}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="icon-container">
                      <span className="text-accent-blue text-sm font-bold">
                        {wallet.asset_symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">{wallet.asset_symbol}</h3>
                      <p className="text-sm text-secondary flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {wallet.nickname || 'No nickname'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">
                      {wallet.balance_crypto.toFixed(2)} {wallet.asset_symbol}
                    </p>
                    <p className="text-sm text-[hsl(var(--success-green))]">
                      ${wallet.balance_fiat.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary w-20">Address:</span>
                    {editingWallet === wallet.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          placeholder="Enter new wallet address"
                          className="flex-1 input-field"
                        />
                        <Button
                          size="sm"
                          onClick={() => saveAddress(wallet.id)}
                          className="px-3 bg-gradient-to-r from-[hsl(var(--accent-blue))]/10 to-[hsl(var(--accent-purple))]/10 hover:from-[hsl(var(--accent-blue))]/20 hover:to-[hsl(var(--accent-purple))]/20 border border-[hsl(var(--accent-blue))]/20 text-accent-blue"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          className="px-3"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-mono bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-3 py-2 rounded-xl flex-1 truncate text-primary">
                          {wallet.wallet_address}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(wallet)}
                          className="px-3 hover:border-[hsl(var(--accent-blue))] hover:text-accent-blue"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-6 border-t border-[hsl(var(--border))]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletManagementDialog;
