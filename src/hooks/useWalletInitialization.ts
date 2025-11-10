import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useWalletInitialization = () => {
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndInitializeWallets = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if user has any wallets
        const { data: wallets, error: walletsError } = await supabase
          .from('user_wallets')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (walletsError) {
          console.error('Error checking wallets:', walletsError);
          setIsChecking(false);
          return;
        }

        // If user has wallets, no need to initialize
        if (wallets && wallets.length > 0) {
          console.log('✅ User already has wallets');
          setIsChecking(false);
          return;
        }

        console.log('⚠️ User has no wallets');
        setIsChecking(false);

      } catch (error) {
        console.error('Error in wallet check:', error);
        setIsChecking(false);
      }
    };

    checkAndInitializeWallets();
  }, [user]);

  const manuallyInitializeWallets = async (password: string) => {
    if (!user || !user.email) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return false;
    }

    setIsInitializing(true);
    
    try {
      console.log('🚀 Manually initializing wallets for user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('initialize-user-wallets', {
        body: {
          userId: user.id,
          userEmail: user.email,
          userPassword: password
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Wallet initialization successful:', data);
      
      toast({
        title: "Success!",
        description: "Your wallets have been initialized successfully.",
      });

      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      return true;
    } catch (error: any) {
      console.error('❌ Wallet initialization failed:', error);
      toast({
        title: "Initialization Failed",
        description: error.message || "Failed to initialize wallets. Please try again or contact support.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    isChecking,
    isInitializing,
    manuallyInitializeWallets
  };
};
