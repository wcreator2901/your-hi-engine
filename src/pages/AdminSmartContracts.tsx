import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';
import { Plus, Edit, Trash2, Loader2, Code, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SmartContract {
  id: string;
  contract_name: string;
  contract_description: string;
  contract_code: string;
  is_deployed: boolean;
  is_active: boolean;
  deployment_address: string | null;
  network: string | null;
  created_at: string;
  created_by: string;
}

interface ContractWallet {
  id: string;
  contract_id: string;
  wallet_address: string;
  wallet_name: string;
}

export default function AdminSmartContracts() {
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [walletsDialogOpen, setWalletsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<SmartContract | null>(null);
  const [selectedContractForWallets, setSelectedContractForWallets] = useState<string | null>(null);
  const [contractWallets, setContractWallets] = useState<ContractWallet[]>([]);

  // Form state
  const [contractName, setContractName] = useState('');
  const [contractDescription, setContractDescription] = useState('');
  const [contractCode, setContractCode] = useState('');
  const [network, setNetwork] = useState('mainnet');
  const [isActive, setIsActive] = useState(true);

  // Wallet form state
  const [walletAddress, setWalletAddress] = useState('');
  const [walletName, setWalletName] = useState('');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('smart_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
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

  const fetchContractWallets = async (contractId: string) => {
    try {
      const { data, error } = await supabase
        .from('contract_wallets')
        .select('*')
        .eq('contract_id', contractId);

      if (error) throw error;
      setContractWallets(data || []);
    } catch (error: any) {
      console.error('Error fetching wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contract wallets',
        variant: 'destructive'
      });
    }
  };

  const openDialog = (contract?: SmartContract) => {
    if (contract) {
      setEditingContract(contract);
      setContractName(contract.contract_name);
      setContractDescription(contract.contract_description);
      setContractCode(contract.contract_code);
      setNetwork(contract.network || 'mainnet');
      setIsActive(contract.is_active);
    } else {
      setEditingContract(null);
      setContractName('');
      setContractDescription('');
      setContractCode('');
      setNetwork('mainnet');
      setIsActive(true);
    }
    setDialogOpen(true);
  };

  const openWalletsDialog = async (contractId: string) => {
    setSelectedContractForWallets(contractId);
    await fetchContractWallets(contractId);
    setWalletsDialogOpen(true);
  };

  const saveContract = async () => {
    if (!contractName || !contractDescription) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingContract) {
        const contractData = {
          contract_name: contractName,
          contract_description: contractDescription,
          contract_code: contractCode,
          network,
          is_active: isActive
        };

        const { error } = await supabase
          .from('smart_contracts')
          .update(contractData)
          .eq('id', editingContract.id);

        if (error) throw error;
      } else {
        const contractData = {
          contract_name: contractName,
          contract_address: contractName, // Use contract name as default address or generate unique ID
          contract_description: contractDescription,
          contract_code: contractCode,
          network,
          is_active: isActive,
          created_by: user.id
        };

        const { error } = await supabase
          .from('smart_contracts')
          .insert([contractData]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Contract ${editingContract ? 'updated' : 'created'} successfully`
      });

      setDialogOpen(false);
      fetchContracts();
    } catch (error: any) {
      console.error('Error saving contract:', error);
      toast({
        title: 'Error',
        description: 'Failed to save contract',
        variant: 'destructive'
      });
    }
  };

  const deployContract = async (contractId: string) => {
    try {
      // Simulate deployment by generating a mock address
      const mockAddress = '0x' + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const { error } = await supabase
        .from('smart_contracts')
        .update({
          is_deployed: true,
          deployment_address: mockAddress
        })
        .eq('id', contractId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contract deployed successfully'
      });

      fetchContracts();
    } catch (error: any) {
      console.error('Error deploying contract:', error);
      toast({
        title: 'Error',
        description: 'Failed to deploy contract',
        variant: 'destructive'
      });
    }
  };

  const addWallet = async () => {
    if (!walletAddress || !walletName || !selectedContractForWallets) {
      toast({
        title: 'Error',
        description: 'Please fill in all wallet fields',
        variant: 'destructive'
      });
      return;
    }

    // Check wallet limit (max 5 per contract)
    if (contractWallets.length >= 5) {
      toast({
        title: 'Error',
        description: 'Maximum 5 wallets per contract',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contract_wallets')
        .insert({
          contract_id: selectedContractForWallets,
          wallet_address: walletAddress,
          wallet_name: walletName
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Wallet added successfully'
      });

      setWalletAddress('');
      setWalletName('');
      fetchContractWallets(selectedContractForWallets);
    } catch (error: any) {
      console.error('Error adding wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to add wallet',
        variant: 'destructive'
      });
    }
  };

  const deleteWallet = async (walletId: string) => {
    try {
      const { error } = await supabase
        .from('contract_wallets')
        .delete()
        .eq('id', walletId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Wallet removed successfully'
      });

      if (selectedContractForWallets) {
        fetchContractWallets(selectedContractForWallets);
      }
    } catch (error: any) {
      console.error('Error deleting wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove wallet',
        variant: 'destructive'
      });
    }
  };

  const deleteContract = async (contractId: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) return;

    try {
      const { error } = await supabase
        .from('smart_contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contract deleted successfully'
      });

      fetchContracts();
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contract',
        variant: 'destructive'
      });
    }
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Smart Contract Management</h1>
            <p className="text-muted-foreground">
              Create, deploy, and manage smart contracts
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingContract ? 'Edit Contract' : 'Create New Contract'}
                </DialogTitle>
                <DialogDescription>
                  {editingContract ? 'Update contract details' : 'Create a new smart contract'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Contract Name *</Label>
                  <Input
                    placeholder="My Smart Contract"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="Describe the contract purpose..."
                    value={contractDescription}
                    onChange={(e) => setContractDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Code</Label>
                  <Textarea
                    placeholder="// Enter contract code here..."
                    value={contractCode}
                    onChange={(e) => setContractCode(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Network</Label>
                  <Input
                    placeholder="mainnet"
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label>Active (visible to users)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveContract}>
                  {editingContract ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Contracts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Smart Contracts</CardTitle>
            <CardDescription>
              Manage all smart contracts on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No contracts created yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.contract_name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {contract.contract_description}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={contract.is_deployed ? 'default' : 'secondary'}>
                            {contract.is_deployed ? 'Deployed' : 'Not Deployed'}
                          </Badge>
                          <Badge variant={contract.is_active ? 'default' : 'outline'}>
                            {contract.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.network || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(contract.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!contract.is_deployed && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => deployContract(contract.id)}
                            >
                              Deploy
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openWalletsDialog(contract.id)}
                          >
                            <Wallet className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(contract)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteContract(contract.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Wallets Management Dialog */}
        <Dialog open={walletsDialogOpen} onOpenChange={setWalletsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Contract Wallets</DialogTitle>
              <DialogDescription>
                Manage wallet addresses for this contract (max 5)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Wallets: {contractWallets.length}/5
                </AlertDescription>
              </Alert>

              {/* Add Wallet Form */}
              {contractWallets.length < 5 && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Add New Wallet</h4>
                  <div className="space-y-2">
                    <Label>Wallet Name</Label>
                    <Input
                      placeholder="Main Wallet"
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <Input
                      placeholder="0x..."
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                    />
                  </div>
                  <Button onClick={addWallet}>Add Wallet</Button>
                </div>
              )}

              {/* Wallets List */}
              <div className="space-y-2">
                <h4 className="font-medium">Current Wallets</h4>
                {contractWallets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No wallets added yet</p>
                ) : (
                  <div className="space-y-2">
                    {contractWallets.map((wallet) => (
                      <div
                        key={wallet.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{wallet.wallet_name}</p>
                          <code className="text-xs text-muted-foreground truncate block">
                            {wallet.wallet_address}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteWallet(wallet.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWalletsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
