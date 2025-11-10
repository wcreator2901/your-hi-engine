import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TwoFactorSetup } from '@/components/TwoFactorSetup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Copy, Key, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const generatePrivateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 12; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

const TwoFactorAuth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrGeneratePrivateKey = async () => {
      if (!user) return;

      try {
        // Check if user already has a private key
        const { data: existingKey, error: fetchError } = await supabase
          .from('user_private_keys')
          .select('private_key')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching private key:', fetchError);
          setLoading(false);
          return;
        }

        if (existingKey) {
          // User already has a key
          setPrivateKey(existingKey.private_key);
        } else {
          // Generate new key
          const newKey = generatePrivateKey();
          
          const { error: insertError } = await supabase
            .from('user_private_keys')
            .insert({
              user_id: user.id,
              private_key: newKey,
            });

          if (insertError) {
            console.error('Error saving private key:', insertError);
            toast({
              title: 'Error',
              description: 'Failed to generate private key. Please refresh the page.',
              variant: 'destructive',
            });
          } else {
            setPrivateKey(newKey);
            toast({
              title: 'Private Key Generated',
              description: 'Your account recovery key has been created. Please save it securely.',
            });
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrGeneratePrivateKey();
  }, [user]);

  const handleCopyKey = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Private key copied to clipboard',
        duration: 1000,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#18191A] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="gap-2 text-white hover:text-white/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-white">
            Two-Factor Authentication
          </h1>
          <p className="text-white text-base">
            Secure your account with an additional layer of protection using Google Authenticator or similar TOTP apps.
          </p>
        </div>

        {/* Private Key Card */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Key className="w-5 h-5 text-blue-400" />
              Account Recovery Key
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your 12-character private key for password recovery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-400">
                Loading your private key...
              </div>
            ) : privateKey ? (
              <>
                <div className="bg-black/40 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <code className="text-2xl font-mono text-blue-300 tracking-wider">
                      {privateKey}
                    </code>
                    <Button
                      onClick={handleCopyKey}
                      variant="ghost"
                      size="sm"
                      className="ml-4 text-blue-400 hover:text-blue-300"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold text-yellow-300 text-sm">Security Warnings</span>
                  </div>
                  <ul className="text-yellow-200 text-sm space-y-1 list-disc list-inside">
                    <li>This key can reset your password - keep it secure!</li>
                    <li>Store it in a safe place (password manager, secure notes)</li>
                    <li>Never share this key with anyone</li>
                    <li>This key is shown only on this page</li>
                  </ul>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-200 text-sm">
                    <strong>How to use:</strong> If you forget your password, you can use this 12-character key 
                    along with your email address to reset your password on the login page.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-red-400">
                Failed to load private key. Please refresh the page.
              </div>
            )}
          </CardContent>
        </Card>
        
        <TwoFactorSetup />
      </div>
    </div>
  );
};

export default TwoFactorAuth;
