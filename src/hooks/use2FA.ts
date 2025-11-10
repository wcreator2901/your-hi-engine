import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface TwoFAStatus {
  isEnabled: boolean;
  hasSetup: boolean;
  loading: boolean;
}

interface TwoFASetup {
  secret: string;
  qrUri: string;
}

export const use2FA = () => {
  const [status, setStatus] = useState<TwoFAStatus>({
    isEnabled: false,
    hasSetup: false,
    loading: true
  });
  const [setup, setSetup] = useState<TwoFASetup | null>(null);
  const { user } = useAuth();

  const checkStatus = useCallback(async () => {
    if (!user) {
      setStatus({ isEnabled: false, hasSetup: false, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_2fa')
        .select('is_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking 2FA status:', error);
        setStatus({ isEnabled: false, hasSetup: false, loading: false });
        return;
      }

      setStatus({
        isEnabled: data?.is_enabled || false,
        hasSetup: !!data,
        loading: false
      });
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      setStatus({ isEnabled: false, hasSetup: false, loading: false });
    }
  }, [user]);

  const generateSecret = useCallback(async (): Promise<TwoFASetup | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to set up 2FA",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'generate' }
      });

      if (error) throw error;

      const setupData = data as TwoFASetup;
      setSetup(setupData);
      return setupData;
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      toast({
        title: "Error",
        description: "Failed to generate 2FA secret. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [user]);

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'verify', token }
      });

      if (error) throw error;

      return data.valid;
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      return false;
    }
  }, [user]);

  const enable2FA = useCallback(async (token: string): Promise<{ success: boolean; backupCodes?: string[] }> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to enable 2FA",
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'enable', token }
      });

      if (error) throw error;

      if (data.enabled) {
        setStatus(prev => ({ ...prev, isEnabled: true, hasSetup: true }));
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been successfully enabled.",
        });
        return { success: true, backupCodes: data.backupCodes };
      }

      return { success: false };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to enable 2FA. Please check your code and try again.",
        variant: "destructive"
      });
      return { success: false };
    }
  }, [user]);

  const disable2FA = useCallback(async (token: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to disable 2FA",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'disable', token }
      });

      if (error) throw error;

      if (data.disabled) {
        setStatus(prev => ({ ...prev, isEnabled: false }));
        setSetup(null);
        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been disabled.",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable 2FA. Please check your code and try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [user]);

  const generateBackupCodes = useCallback(async (): Promise<string[] | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to generate backup codes",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'backup-codes' }
      });

      if (error) throw error;

      toast({
        title: "Backup Codes Generated",
        description: "New backup codes have been generated. Please save them securely.",
      });

      return data.backupCodes;
    } catch (error) {
      console.error('Error generating backup codes:', error);
      toast({
        title: "Error",
        description: "Failed to generate backup codes. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [user]);

  return {
    status,
    setup,
    checkStatus,
    generateSecret,
    verifyToken,
    enable2FA,
    disable2FA,
    generateBackupCodes
  };
};