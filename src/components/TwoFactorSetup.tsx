import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Copy, 
  Check, 
  QrCode, 
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { use2FA } from '@/hooks/use2FA';
import { toast } from '@/hooks/use-toast';

interface TwoFactorSetupProps {
  isInRegistration?: boolean;
  onComplete?: (enabled: boolean) => void;
  onSkip?: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  isInRegistration = false,
  onComplete,
  onSkip
}) => {
  const {
    status,
    setup,
    checkStatus,
    generateSecret,
    verifyToken,
    enable2FA,
    disable2FA,
    generateBackupCodes
  } = use2FA();

  const [currentStep, setCurrentStep] = useState<'status' | 'setup' | 'verify' | 'backup' | 'disable'>('status');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (isInRegistration && !status.loading) {
      setCurrentStep('setup');
    }
  }, [isInRegistration, status.loading]);

  const handleSetupStart = async () => {
    setLoading(true);
    const setupData = await generateSecret();
    if (setupData) {
      setCurrentStep('verify');
    }
    setLoading(false);
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const result = await enable2FA(verificationCode);
    
    if (result.success && result.backupCodes) {
      setBackupCodes(result.backupCodes);
      setCurrentStep('backup');
      if (onComplete) {
        onComplete(true);
      }
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const success = await disable2FA(disableCode);
    if (success) {
      setCurrentStep('status');
      setDisableCode('');
      await checkStatus();
    }
    setLoading(false);
  };

  const handleGenerateNewBackupCodes = async () => {
    setLoading(true);
    const codes = await generateBackupCodes();
    if (codes) {
      setBackupCodes(codes);
      setCurrentStep('backup');
    }
    setLoading(false);
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }
      toast({
        title: "Copied!",
        description: `${type === 'secret' ? 'Secret key' : 'Backup codes'} copied to clipboard.`,
        duration: 1000,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please copy manually.",
        variant: "destructive"
      });
    }
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([`Pulse Wallet 2FA Backup Codes\n\nGenerated: ${new Date().toISOString()}\n\n${codesText}\n\nStore these codes securely. Each code can only be used once.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulsewallet-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (status.loading) {
    return (
      <Card className="max-w-md mx-auto bg-[#18191A] border-white/15">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
            <span className="text-white font-bold">Loading 2FA status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Registration flow
  if (isInRegistration) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">
            Enable Two-Factor
          </h2>
          <p className="text-white text-base">
            For extra security, you can enable Two-Factor Authentication (2FA) using Google Authenticator now. You can also set it up later from your account settings.
          </p>
        </div>

        {currentStep === 'setup' && (
          <div className="space-y-4">
            <Alert className="bg-primary/10 border-white/15">
              <Smartphone className="h-5 w-5 text-white" />
              <AlertDescription className="text-white font-medium">
                2FA adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button 
                onClick={handleSetupStart} 
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Enable
              </Button>
              <Button 
                variant="outline" 
                onClick={onSkip}
                className="flex-1 text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'verify' && setup && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Scan this QR code</h3>
              <p className="text-white text-sm">Use your authenticator app to scan</p>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-white p-6 rounded-lg border-2 border-white/20 inline-block">
                <div className="w-56 h-56 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.qrUri)}`}
                    alt="2FA QR Code"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-red-600 font-bold p-4 text-center';
                      errorDiv.textContent = 'QR code could not be loaded';
                      e.currentTarget.parentElement?.appendChild(errorDiv);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-white font-bold text-sm">Your secret key is:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-white/10 rounded text-sm font-mono break-all text-white border border-white/20">
                    {setup.secret}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(setup.secret, 'secret')}
                    className="text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {copiedSecret && (
                  <p className="text-white font-bold text-sm">Successfully copied!</p>
                )}
              </div>
            </div>

            <div className="border-t border-white/15 pt-4"></div>

            <div className="space-y-3">
              <label className="text-white font-bold text-base block">Enter the 6-digit code from your app</label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl font-bold tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-white"
                maxLength={6}
              />
              {verificationCode.length > 0 && verificationCode.length !== 6 && (
                <div className="bg-red-500/90 text-white font-bold px-4 py-2 rounded">
                  Invalid code. Try again.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleVerifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Verify
              </Button>
              <Button 
                variant="outline" 
                onClick={onSkip}
                className="flex-1 text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'backup' && (
          <div className="space-y-6">
            <div className="text-center">
              <Key className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-white mb-2">Backup Codes</h3>
              <p className="text-white text-base">
                Store these codes securely. You can use them to access your account if you lose your authenticator device.
              </p>
            </div>

            <div className="bg-white/10 p-6 rounded-lg border border-white/20">
              <div className="grid grid-cols-2 gap-3 font-mono text-base text-white font-bold">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-center p-2 bg-white/5 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(backupCodes.join(' '), 'backup')}
                className="flex-1 text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              >
                {copiedBackupCodes ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copy Codes
              </Button>
              <Button
                variant="outline"
                onClick={downloadBackupCodes}
                className="flex-1 text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Backup Codes
              </Button>
            </div>
            {copiedBackupCodes && (
              <p className="text-white font-bold text-center">Successfully copied!</p>
            )}

            <Button 
              onClick={() => onComplete?.(true)} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              Continue to Dashboard
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Settings/Management flow
  return (
    <Card className="max-w-md mx-auto bg-[#18191A] border-white/15">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-white">Two-Factor Authentication</h3>
            <p className="text-sm text-white">Manage your 2FA settings</p>
          </div>
          <Badge 
            variant={status.isEnabled ? "default" : "secondary"} 
            className={`ml-auto font-bold ${status.isEnabled ? 'bg-primary text-primary-foreground' : 'bg-white/20 text-white'}`}
          >
            {status.isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {currentStep === 'status' && (
          <div className="space-y-4">
            <Alert className="bg-primary/10 border-white/15">
              <Smartphone className="h-5 w-5 text-white" />
              <AlertDescription className="text-white font-medium">
                Two-factor authentication adds an extra layer of security to your account.
                {status.isEnabled ? " It's currently enabled." : " It's currently disabled."}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {!status.isEnabled ? (
                <Button 
                  onClick={handleSetupStart} 
                  disabled={loading} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                  Enable
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('disable')}
                    className="w-full text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Disable
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerateNewBackupCodes}
                    disabled={loading}
                    className="w-full text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                    Generate New Backup Codes
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {currentStep === 'verify' && setup && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Scan this QR code</h3>
              <p className="text-white text-sm">Use your authenticator app to scan</p>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-white p-6 rounded-lg border-2 border-white/20 inline-block">
                <div className="w-56 h-56 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.qrUri)}`}
                    alt="2FA QR Code"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-red-600 font-bold p-4 text-center';
                      errorDiv.textContent = 'QR code could not be loaded';
                      e.currentTarget.parentElement?.appendChild(errorDiv);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-white font-bold text-sm">Your secret key is:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-white/10 rounded text-sm font-mono break-all text-white border border-white/20">
                    {setup.secret}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(setup.secret, 'secret')}
                    className="text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {copiedSecret && (
                  <p className="text-white font-bold text-sm">Successfully copied!</p>
                )}
              </div>
            </div>

            <div className="border-t border-white/15 pt-4"></div>

            <div className="space-y-3">
              <label className="text-white font-bold text-base block">Authentication Code</label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl font-bold tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-white"
                maxLength={6}
              />
              {verificationCode.length > 0 && verificationCode.length !== 6 && (
                <div className="bg-red-500/90 text-white font-bold px-4 py-2 rounded">
                  Invalid code. Try again.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleVerifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Verify
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('status')}
                className="flex-1 text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'disable' && (
          <div className="space-y-4">
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="h-5 w-5 text-white" />
              <AlertDescription className="text-white font-medium">
                Disabling 2FA will make your account less secure. Enter your current 2FA code to confirm.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <label className="text-white font-bold text-base block">Authentication Code</label>
              <Input
                type="text"
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl font-bold tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-white"
                maxLength={6}
              />
              {disableCode.length > 0 && disableCode.length !== 6 && (
                <div className="bg-red-500/90 text-white font-bold px-4 py-2 rounded">
                  Invalid code. Try again.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDisable}
                disabled={loading || disableCode.length !== 6}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                Disable
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('status')}
                className="flex-1 text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'backup' && (
          <div className="space-y-6">
            <div className="text-center">
              <Key className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-white mb-2">Backup Codes</h3>
              <p className="text-white text-base">
                Store these codes securely. Each code can only be used once.
              </p>
            </div>

            <div className="bg-white/10 p-6 rounded-lg border border-white/20">
              <div className="grid grid-cols-2 gap-3 font-mono text-base text-white font-bold">
                {backupCodes.map((code, index) => (
                  <div key={index} className="text-center p-2 bg-white/5 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(backupCodes.join(' '), 'backup')}
                className="flex-1 text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              >
                {copiedBackupCodes ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                Copy Codes
              </Button>
              <Button
                variant="outline"
                onClick={downloadBackupCodes}
                className="flex-1 text-white border-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Backup Codes
              </Button>
            </div>
            {copiedBackupCodes && (
              <p className="text-white font-bold text-center">Successfully copied!</p>
            )}

            <Button 
              onClick={() => setCurrentStep('status')} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};