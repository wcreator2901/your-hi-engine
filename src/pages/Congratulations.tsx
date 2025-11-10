import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Key, Copy, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Congratulations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasAttemptedGeneration = useRef(false);
  const queryClient = useQueryClient();


  // Fetch user's private key once (no polling)
  const { data: privateKey, isLoading, refetch } = useQuery({
    queryKey: ['user-private-key', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_private_keys')
        .select('private_key, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data && data.length > 0 ? data[0].private_key : null;
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: Infinity, // Cache forever
  });

  useEffect(() => {
    if (user && !privateKey && !generating && !hasAttemptedGeneration.current) {
      hasAttemptedGeneration.current = true;
      handleGeneratePrivateKey();
    }
  }, [user, privateKey, generating]);

  const handleCopyPrivateKey = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      setCopied(true);
      toast.success('Private key copied to clipboard!', { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGeneratePrivateKey = async () => {
    try {
      setGenerating(true);
      const { data, error } = await supabase.functions.invoke('generate-user-private-key', { body: {} });
      if (error) throw error;
      const newKey = (data as any)?.privateKey || (data as any)?.private_key;
      if (newKey) {
        queryClient.setQueryData(['user-private-key', user?.id], newKey);
      }
      await refetch();
      setGenerating(false);
    } catch (e: any) {
      console.error('Generate key error', e);
      toast.error('Failed to generate private key');
      setGenerating(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))]">
      <Card className="w-full max-w-2xl border-2 border-[hsl(var(--border))] shadow-xl bg-gradient-to-br from-[hsl(var(--background-card))]/80 to-[hsl(var(--background-secondary))]/60 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-[hsl(var(--accent-blue))]/20 rounded-full flex items-center justify-center border-2 border-[hsl(var(--accent-blue))]/30">
            <CheckCircle2 className="w-12 h-12 text-[hsl(var(--accent-blue))]" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            Welcome to Pulse Wallet!
          </CardTitle>
          <CardDescription className="text-lg text-white">
            Your account has been created successfully
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-[hsl(var(--accent-blue))]/10 border-2 border-[hsl(var(--accent-blue))]/20 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Key className="w-6 h-6 text-[hsl(var(--accent-blue))] flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-2">Your Private Key</h3>
                <p className="text-sm text-white mb-4">
                  This is your master private key. Keep it safe and never share it with anyone.
                </p>
                <div className="bg-[hsl(var(--background-primary))]/50 border-2 border-[hsl(var(--border))] rounded-lg p-4 mb-3">
                  <code className="text-sm text-white break-all font-mono">
                    {isLoading || generating ? 'Generating your private key...' : (privateKey ?? 'Loading...')}
                  </code>
                </div>
                {privateKey && (
                  <Button
                    onClick={handleCopyPrivateKey}
                    size="sm"
                    className={`mx-auto w-64 transition-all ${
                      copied 
                        ? 'bg-primary hover:bg-primary' 
                        : 'bg-primary hover:bg-primary/90'
                    } text-white`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Private Key
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4">
            <p className="text-sm text-white font-medium">
              ⚠️ Critical: Store your private key in a secure location. Anyone with access to this key can control your funds!
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleGoToDashboard}
              className="mx-auto w-64 bg-primary hover:bg-primary/90 text-white"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
