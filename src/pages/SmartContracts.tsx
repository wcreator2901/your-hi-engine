import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Layout } from '@/components/Layout';

interface SmartContract {
  id: string;
  contract_name: string;
  contract_description: string;
  contract_code: string;
  is_deployed: boolean;
  deployment_address: string | null;
  network: string | null;
  created_at: string;
}

interface ContractWallet {
  id: string;
  wallet_address: string;
  wallet_name: string;
}

export default function SmartContracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [contractWallets, setContractWallets] = useState<{ [key: string]: ContractWallet[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, [user]);

  const fetchContracts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch contracts assigned to this user or public contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('smart_contracts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      setContracts(contractsData || []);

      // Fetch wallets for each contract
      if (contractsData && contractsData.length > 0) {
        const walletsMap: { [key: string]: ContractWallet[] } = {};
        
        for (const contract of contractsData) {
          const { data: wallets } = await supabase
            .from('contract_wallets')
            .select('*')
            .eq('contract_id', contract.id)
            .limit(5);

          if (wallets) {
            walletsMap[contract.id] = wallets;
          }
        }

        setContractWallets(walletsMap);
      }
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load smart contracts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
      duration: 1000,
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Smart Contracts</h1>
          <p className="text-muted-foreground">
            View and interact with available smart contracts on the platform
          </p>
        </div>

        {contracts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                No smart contracts available at the moment
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {contracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {contract.contract_name}
                        {contract.is_deployed && (
                          <Badge variant="default">Deployed</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {contract.contract_description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contract.is_deployed && contract.deployment_address && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Contract Address:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(contract.deployment_address!, 'Address')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <code className="text-xs break-all">{contract.deployment_address}</code>
                      </div>
                      {contract.network && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Network:</span>
                          <Badge variant="outline">{contract.network}</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {contractWallets[contract.id] && contractWallets[contract.id].length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Associated Wallets:</span>
                      <div className="space-y-2">
                        {contractWallets[contract.id].map((wallet) => (
                          <div
                            key={wallet.id}
                            className="flex items-center justify-between bg-muted p-2 rounded-md"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{wallet.wallet_name}</p>
                              <code className="text-xs text-muted-foreground truncate block">
                                {wallet.wallet_address}
                              </code>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(wallet.wallet_address, 'Wallet address')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(contract.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
