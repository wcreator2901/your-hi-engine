import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, Key, Lock, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PasswordResetWithPrivateKeyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PasswordResetWithPrivateKey: React.FC<PasswordResetWithPrivateKeyProps> = ({
  open,
  onOpenChange,
}) => {
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = () => {
    setStep('email');
    setEmail('');
    setPrivateKey('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setLoading(false);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setStep('verify');
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (privateKey.length !== 12) {
      setError('Private key must be exactly 12 characters');
      return;
    }

    setStep('reset');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      console.log('Calling reset-password-with-private-key function...');

      const { data, error: resetError } = await supabase.functions.invoke(
        'reset-password-with-private-key',
        {
          body: {
            email: email.toLowerCase().trim(),
            privateKey: privateKey,
            newPassword: newPassword,
          },
        }
      );

      if (resetError) {
        console.error('Password reset error:', resetError);
        setError(resetError.message || 'Password reset failed');
        setLoading(false);
        return;
      }

      if (data?.error) {
        console.error('Password reset failed:', data.error);
        setError(String(data.error));
        setLoading(false);
        return;
      }

      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now sign in with your new password.',
      });

      handleReset();
      onOpenChange(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleReset(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="flex items-center gap-3 text-2xl font-semibold text-white">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            Reset Your Password
          </DialogTitle>
          <DialogDescription className="text-base text-white/80 leading-relaxed">
            Recover your account using your 12-character private key
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="border-destructive/50 bg-destructive/10 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive font-medium ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6 pt-2">
            <div className="space-y-3">
              <Label htmlFor="email" className="flex items-center gap-2.5 text-base font-medium text-white">
                <Mail className="w-4 h-4 text-primary" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                autoFocus
                className="h-12 text-base text-white bg-background/50 border-border focus:border-primary transition-all placeholder:text-white/50"
              />
              <p className="text-sm text-white/70">
                Enter the email address associated with your account
              </p>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11 text-base border-border hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-11 text-base bg-primary hover:bg-primary/90">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Verify Private Key */}
        {step === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-6 pt-2">
            <div className="space-y-3">
              <Label htmlFor="privateKey" className="flex items-center gap-2.5 text-base font-medium text-white">
                <Key className="w-4 h-4 text-primary" />
                Private Recovery Key
              </Label>
              <Input
                id="privateKey"
                type="text"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="12-character key"
                required
                maxLength={12}
                autoFocus
                className="h-12 text-base text-white font-mono tracking-wider bg-background/50 border-border focus:border-primary transition-all placeholder:text-white/50"
              />
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Key className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white/70 leading-relaxed">
                  This is the 12-character recovery key provided on your Two-Factor Authentication page
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('email')}
                className="flex-1 h-11 text-base border-border hover:bg-muted/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button type="submit" className="flex-1 h-11 text-base bg-primary hover:bg-primary/90">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6 pt-2">
            <div className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="newPassword" className="flex items-center gap-2.5 text-base font-medium text-white">
                  <Lock className="w-4 h-4 text-primary" />
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  minLength={6}
                  autoFocus
                  className="h-12 text-base text-white bg-background/50 border-border focus:border-primary transition-all placeholder:text-white/50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-base font-medium text-white">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  minLength={6}
                  className="h-12 text-base text-white bg-background/50 border-border focus:border-primary transition-all placeholder:text-white/50"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-white text-sm">Password Requirements</p>
                <p className="text-white/70 text-sm leading-relaxed">
                  Password must be at least 6 characters long. After resetting, you can sign in immediately with your new credentials.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('verify')}
                disabled={loading}
                className="flex-1 h-11 text-base border-border hover:bg-muted/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 h-11 text-base bg-primary hover:bg-primary/90 font-semibold"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
