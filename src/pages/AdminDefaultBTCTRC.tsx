import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Edit2, Save, X, Bitcoin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDefaultBTCTRC() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingBTC, setEditingBTC] = useState(false);
  const [editingUSDT, setEditingUSDT] = useState(false);
  const [btcAddress, setBtcAddress] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');

  // Fetch default addresses
  const { data: defaultAddresses, isLoading } = useQuery({
    queryKey: ['default-crypto-addresses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('default_crypto_addresses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  // Separate mutation for BTC
  const updateBTCMutation = useMutation({
    mutationFn: async (btcAddress: string) => {
      const { data: existing } = await supabase
        .from('default_crypto_addresses')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const updates: any = {
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
        btc_address: btcAddress
      };

      if (existing?.id) {
        updates.id = existing.id;
        const { error } = await supabase
          .from('default_crypto_addresses')
          .update({ btc_address: btcAddress, updated_by: user?.id, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('default_crypto_addresses')
          .insert(updates);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-crypto-addresses'] });
      toast({
        title: 'Success',
        description: 'BTC address updated successfully'
      });
      setEditingBTC(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Separate mutation for USDT TRC20
  const updateUSDTMutation = useMutation({
    mutationFn: async (usdtAddress: string) => {
      const { data: existing } = await supabase
        .from('default_crypto_addresses')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const updates: any = {
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
        usdt_trc20_address: usdtAddress
      };

      if (existing?.id) {
        updates.id = existing.id;
        const { error } = await supabase
          .from('default_crypto_addresses')
          .update({ usdt_trc20_address: usdtAddress, updated_by: user?.id, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('default_crypto_addresses')
          .insert(updates);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['default-crypto-addresses'] });
      toast({
        title: 'Success',
        description: 'USDT TRC20 address updated successfully'
      });
      setEditingUSDT(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleEditBTC = () => {
    setBtcAddress(defaultAddresses?.btc_address || '');
    setEditingBTC(true);
  };

  const handleEditUSDT = () => {
    setUsdtAddress(defaultAddresses?.usdt_trc20_address || '');
    setEditingUSDT(true);
  };

  const handleSaveBTC = () => {
    updateBTCMutation.mutate(btcAddress);
  };

  const handleSaveUSDT = () => {
    updateUSDTMutation.mutate(usdtAddress);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-white">Default BTC & TRC20 Configuration</h1>
        <p className="text-white">
          Configure system-wide default addresses for Bitcoin and USDT TRC20. These addresses will be assigned to all users.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* BTC Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Bitcoin className="h-5 w-5 text-primary" />
              Bitcoin (BTC) Default Address
            </CardTitle>
            <CardDescription className="text-white">
              Centralized BTC address for all user deposits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingBTC ? (
              <div className="space-y-3">
                <Input
                  value={btcAddress}
                  onChange={(e) => setBtcAddress(e.target.value)}
                  placeholder="Enter BTC address"
                  className="font-mono text-sm bg-white dark:bg-white text-black dark:text-black placeholder:text-gray-600 caret-black"
                  style={{ color: '#000' }}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveBTC}
                    disabled={updateBTCMutation.isPending}
                    className="flex-1"
                  >
                    {updateBTCMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingBTC(false)}
                    variant="outline"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-mono text-sm break-all text-white">
                    {defaultAddresses?.btc_address || 'Not configured'}
                  </p>
                </div>
                <Button onClick={handleEditBTC} variant="outline" className="w-full text-white">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Address
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* USDT TRC20 Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                T
              </div>
              USDT TRC20 Default Address
            </CardTitle>
            <CardDescription className="text-white">
              Centralized USDT TRC20 address for all user deposits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingUSDT ? (
              <div className="space-y-3">
                <Input
                  value={usdtAddress}
                  onChange={(e) => setUsdtAddress(e.target.value)}
                  placeholder="Enter USDT TRC20 address"
                  className="font-mono text-sm bg-white dark:bg-white text-black dark:text-black placeholder:text-gray-600 caret-black"
                  style={{ color: '#000' }}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveUSDT}
                    disabled={updateUSDTMutation.isPending}
                    className="flex-1"
                  >
                    {updateUSDTMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingUSDT(false)}
                    variant="outline"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-mono text-sm break-all text-white">
                    {defaultAddresses?.usdt_trc20_address || 'Not configured'}
                  </p>
                </div>
                <Button onClick={handleEditUSDT} variant="outline" className="w-full text-white">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Address
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="text-white">Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-white">
          <p>• These addresses are assigned to ALL users in the system</p>
          <p>• BTC and USDT TRC20 use centralized addresses (not HD wallets)</p>
          <p>• Changing these addresses will affect deposit addresses for all users</p>
          <p>• ETH, USDT-ERC20, and USDC-ERC20 use unique HD wallet addresses per user</p>
        </CardContent>
      </Card>
    </div>
  );
}
