import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield } from 'lucide-react';
import { use2FA } from '@/hooks/use2FA';
import { toast } from '@/hooks/use-toast';

interface TwoFactorVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  actionText?: string;
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Two-Factor Authentication Required",
  description = "Enter your 6-digit code from your authenticator app to continue.",
  actionText = "Verify Code"
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const { verifyToken } = use2FA();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyToken(code);
      
      if (isValid) {
        toast({
          title: "Success",
          description: "2FA verification successful",
        });
        setCode('');
        onSuccess(); // Only call onSuccess, not onClose to avoid signing out
      } else {
        setError('Invalid code. Please check your authenticator app and try again.');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-[hsl(var(--accent-blue))]/20 to-[hsl(var(--accent-purple))]/20 rounded-full border border-[hsl(var(--accent-blue))]/30">
            <Shield className="w-6 h-6 text-accent-blue" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="twofa-code">6-Digit Code</Label>
            <Input
              id="twofa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setCode(value);
                if (error) setError('');
              }}
              className="text-center text-lg tracking-widest"
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={code.length !== 6 || isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                actionText
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};