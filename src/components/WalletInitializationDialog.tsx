import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Lock } from 'lucide-react';

interface WalletInitializationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInitialize: (password: string) => Promise<boolean>;
  isInitializing: boolean;
}

export const WalletInitializationDialog: React.FC<WalletInitializationDialogProps> = ({
  open,
  onOpenChange,
  onInitialize,
  isInitializing
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      return;
    }

    const success = await onInitialize(password);
    if (success) {
      setPassword('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Initialize Your Wallet
          </DialogTitle>
          <DialogDescription>
            Your wallet needs to be set up to start using the platform. Please enter your password to initialize your wallets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Account Password
            </Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isInitializing}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {showPassword ? 'Hide' : 'Show'} password
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ This will create HD wallets for ETH, USDT, USDC, BTC, and USDT-TRC20. 
              Your wallet addresses will be securely generated and encrypted.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isInitializing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!password || isInitializing}
              className="flex-1"
            >
              {isInitializing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Initializing...
                </>
              ) : (
                'Initialize Wallets'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
