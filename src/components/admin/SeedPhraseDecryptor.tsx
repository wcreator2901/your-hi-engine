import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SeedPhraseDecryptor = () => {
  const [userId, setUserId] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  const { toast } = useToast();

  const decryptSeedPhrase = async () => {
    if (!userId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('decrypt-seed-phrase', {
        body: { userId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to decrypt seed phrase');
      }

      setSeedPhrase(data?.seedPhrase || '');
      setShowPhrase(true);

      toast({
        title: "Success",
        description: "Seed phrase decrypted successfully"
      });
    } catch (error: any) {
      console.error('Error decrypting seed phrase:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to decrypt seed phrase",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copySeedPhrase = async () => {
    try {
      await navigator.clipboard.writeText(seedPhrase);
      toast({
        title: "Copied",
        description: "Seed phrase copied to clipboard",
        duration: 1000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Seed Phrase Decryptor</h2>
      <p className="text-gray-600 mb-6">
        Enter a user ID to decrypt and view their seed phrase. This is for admin debugging purposes only.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            type="text"
            placeholder="Enter user ID (e.g., 8d0fda5d-9431-4e74-bae5-d0a27ef4432d)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <Button 
          onClick={decryptSeedPhrase} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Decrypting...' : 'Decrypt Seed Phrase'}
        </Button>

        {seedPhrase && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label>Decrypted Seed Phrase:</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPhrase(!showPhrase)}
                >
                  {showPhrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copySeedPhrase}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="font-mono text-sm p-3 bg-white border rounded">
              {showPhrase ? seedPhrase : '••••••••••••••••••••••••••••••••••••••••••••••••'}
            </div>
            {showPhrase && (
              <p className="text-xs text-gray-500 mt-2">
                Word count: {seedPhrase.split(' ').length}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SeedPhraseDecryptor;