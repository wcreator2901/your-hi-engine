import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Plus, Eye, EyeOff, Wallet, QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSingleWalletData } from '@/hooks/useSingleWalletData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateAddressFormat } from '@/utils/hdWallet';

interface HDWalletAddressesProps {
  onGenerateNewAddresses?: () => void;
}

export const HDWalletAddresses: React.FC<HDWalletAddressesProps> = ({ 
  onGenerateNewAddresses 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visibleAddresses, setVisibleAddresses] = useState<Set<string>>(new Set());

  // Fetch all HD wallet addresses for the user
  const { data: hdWallets, isLoading, refetch } = useQuery<any[]>({
    queryKey: ['hd-wallets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const result: any = (supabase as any)
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_hd_wallet', true)
        .order('asset_symbol', { ascending: true })
        .order('address_index', { ascending: true });

      const { data, error } = await result;

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });

  const toggleAddressVisibility = (walletId: string) => {
    const newVisible = new Set(visibleAddresses);
    if (newVisible.has(walletId)) {
      newVisible.delete(walletId);
    } else {
      newVisible.add(walletId);
    }
    setVisibleAddresses(newVisible);
  };

  const copyToClipboard = (address: string, assetSymbol: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied!",
      description: `${assetSymbol} address copied to clipboard`,
      duration: 1000,
    });
  };

  const getAssetColor = (asset: string): string => {
    switch (asset) {
      case 'BTC':
        return 'bg-primary';
      case 'ETH':
        return 'bg-blue-500';
      case 'USDT-ERC20':
        return 'bg-primary';
      default:
        return 'bg-gray-500';
    }
  };

  const getNetworkName = (asset: string): string => {
    switch (asset) {
      case 'BTC':
        return 'Bitcoin Network';
      case 'ETH':
        return 'Ethereum Network';
      case 'USDT-ERC20':
        return 'Ethereum Network (ERC-20)';
      default:
        return 'Unknown Network';
    }
  };

  const formatAddress = (address: string, isVisible: boolean): string => {
    if (!isVisible) {
      return '•'.repeat(12);
    }
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const isValidAddress = (address: string, asset: string): boolean => {
    return validateAddressFormat(address, asset);
  };

  // Group wallets by asset
  const groupedWallets = hdWallets?.reduce((acc: Record<string, any[]>, wallet: any) => {
    if (!acc[wallet.asset_symbol]) {
      acc[wallet.asset_symbol] = [];
    }
    acc[wallet.asset_symbol].push(wallet);
    return acc;
  }, {} as Record<string, any[]>);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (!hdWallets || hdWallets.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No HD Wallet Found</h3>
          <p className="text-gray-500 mb-4">
            Generate your first HD wallet to get unique addresses for all supported cryptocurrencies.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">HD Wallet Addresses</h2>
          <p className="text-sm text-gray-500">
            Your deterministic addresses derived from your BIP39 seed phrase
          </p>
        </div>
        {onGenerateNewAddresses && (
          <Button
            onClick={onGenerateNewAddresses}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Generate Next Addresses
          </Button>
        )}
      </div>

      {Object.entries(groupedWallets || {}).map(([asset, wallets]: [string, any[]]) => (
        <Card key={asset} className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${getAssetColor(asset)}`} />
            <div>
              <h3 className="font-medium text-gray-900">{asset}</h3>
              <p className="text-xs text-gray-500">{getNetworkName(asset)}</p>
            </div>
            <Badge variant="outline" className="ml-auto">
              {wallets.length} address{wallets.length > 1 ? 'es' : ''}
            </Badge>
          </div>

          <div className="space-y-2">
            {wallets.map((wallet) => {
              const isVisible = visibleAddresses.has(wallet.id);
              const isValid = isValidAddress(wallet.wallet_address, asset);
              
              return (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        Address #{(wallet.address_index || 0) + 1}
                      </span>
                      {!isValid && (
                        <Badge variant="destructive" className="text-xs">
                          Invalid Format
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-gray-600 bg-white px-2 py-1 rounded">
                        {isVisible 
                          ? wallet.wallet_address 
                          : formatAddress(wallet.wallet_address, false)
                        }
                      </code>
                      {wallet.derivation_path && (
                        <span className="text-xs text-gray-400">
                          {wallet.derivation_path}/{wallet.address_index || 0}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAddressVisibility(wallet.id)}
                      className="h-8 w-8 p-0"
                    >
                      {isVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    {isVisible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(wallet.wallet_address, asset)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">✅ HD Wallet Benefits</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• All addresses are derived from your 12-word seed phrase</li>
          <li>• Compatible with standard wallets (Atomic, MetaMask, etc.)</li>
          <li>• Each address follows BIP44/84 derivation standards</li>
          <li>• Generate unlimited addresses from the same seed</li>
          <li>• Enhanced privacy through address rotation</li>
        </ul>
      </div>
    </div>
  );
};