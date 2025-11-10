import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Banknote } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '@/utils/currencyFormatter';
import { TwoFactorVerification } from '@/components/TwoFactorVerification';
import { use2FA } from '@/hooks/use2FA';

const bankTransferSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().min(1, 'Account name is required'),
  institutionNumber: z.string().min(1, 'Institution number is required'),
  transitNumber: z.string().min(1, 'Transit number is required'),
  emailOrMobile: z.string().min(1, 'Email or mobile number is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
});

type BankTransferFormData = z.infer<typeof bankTransferSchema>;

const BankTransfer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1.36); // Default USD to CAD rate
  const [cadAmount, setCadAmount] = useState<string>('');
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<'cad' | 'usd'>('cad');
  const [show2FAVerification, setShow2FAVerification] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<BankTransferFormData | null>(null);
  const isMobile = useIsMobile();
  const { status: twoFAStatus } = use2FA();
  const [userBalances, setUserBalances] = useState<{ [key: string]: number }>({});
  const [insufficientBalance, setInsufficientBalance] = useState(false);

  const form = useForm<BankTransferFormData>({
    resolver: zodResolver(bankTransferSchema),
    defaultValues: {
      accountNumber: '',
      accountName: '',
      institutionNumber: '',
      transitNumber: '',
      emailOrMobile: '',
      amount: 0,
    },
  });

  // Fetch USD/CAD exchange rate on component mount and update every 5 minutes
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data.rates && data.rates.CAD) {
          setExchangeRate(data.rates.CAD);
          console.log('USD/CAD Exchange Rate Updated:', data.rates.CAD);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        // Keep default rate if API fails
      }
    };

    fetchExchangeRate();
    
    // Update exchange rate every 5 minutes
    const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch user balances to check for sufficient funds
  useEffect(() => {
    const fetchBalances = async () => {
      if (!user) return;
      
      try {
        const { data: wallets, error } = await supabase
          .from('user_wallets')
          .select('asset_symbol, balance_crypto')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) throw error;

        const balances: { [key: string]: number } = {};
        wallets?.forEach(wallet => {
          balances[wallet.asset_symbol] = Number(wallet.balance_crypto) || 0;
        });
        setUserBalances(balances);
      } catch (error) {
        console.error('Error fetching user balances:', error);
      }
    };

    fetchBalances();
  }, [user]);

  // Handle CAD amount change
  const handleCadChange = (value: string) => {
    setCadAmount(value);
    setLastUpdated('cad');
    
    if (value && exchangeRate > 0) {
      const cadValue = parseFloat(value);
      const usdValue = (cadValue / exchangeRate).toFixed(2);
      setUsdAmount(usdValue);
      form.setValue('amount', cadValue);
      
      // Check for insufficient balance - assume we'll deduct from the crypto with highest balance
      const maxBalance = Math.max(...Object.values(userBalances), 0);
      setInsufficientBalance(cadValue > maxBalance * 100000); // Rough check since we don't know which crypto user will use
    } else {
      setUsdAmount('');
      setInsufficientBalance(false);
    }
  };

  // Handle USD amount change
  const handleUsdChange = (value: string) => {
    setUsdAmount(value);
    setLastUpdated('usd');
    
    if (value && exchangeRate > 0) {
      const usdValue = parseFloat(value);
      const cadValue = (usdValue * exchangeRate).toFixed(2);
      setCadAmount(cadValue);
      form.setValue('amount', parseFloat(cadValue));
      
      // Check for insufficient balance
      const maxBalance = Math.max(...Object.values(userBalances), 0);
      setInsufficientBalance(parseFloat(cadValue) > maxBalance * 100000);
    } else {
      setCadAmount('');
      setInsufficientBalance(false);
    }
  };

  const handleTransferSubmit = async (data: BankTransferFormData) => {
    console.log('Form data submitted:', data);
    
    // Validate form data before proceeding
    const validation = bankTransferSchema.safeParse(data);
    if (!validation.success) {
      console.error('Form validation failed:', validation.error);
      toast({
        title: "Validation Error",
        description: validation.error.errors.map(err => err.message).join(', '),
        variant: "destructive",
      });
      return;
    }

    // Check if 2FA is enabled
    if (twoFAStatus.isEnabled) {
      // Store the transfer data and show 2FA verification
      setPendingTransfer(data);
      setShow2FAVerification(true);
      return;
    }

    // If no 2FA, proceed directly
    await processBankTransfer(data);
  };

  const processBankTransfer = async (data: BankTransferFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to make a bank transfer request",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: transaction, error: transactionError } = await supabase
        .from('user_transactions')
        .insert([{
          user_id: user.id,
          transaction_type: 'bank_transfer',
          currency: 'CAD',
          amount: data.amount,
          status: 'pending',
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      const { error: bankTransferError } = await supabase
        .from('bank_accounts')
        .insert([{
          user_id: user.id,
          transaction_id: transaction.id,
          account_number: data.accountNumber,
          account_name: data.accountName,
          bsb_number: `${data.institutionNumber}-${data.transitNumber}`,
          email_or_mobile: data.emailOrMobile,
          amount_fiat: data.amount,
        }]);

      if (bankTransferError) throw bankTransferError;

      toast({
        title: "Success",
        description: "Bank transfer request submitted successfully",
        duration: 1000,
      });

      form.reset();
      setCadAmount('');
      setUsdAmount('');
      navigate('/dashboard/history');
    } catch (error) {
      console.error('Error submitting bank transfer:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit bank transfer request";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASuccess = async () => {
    if (pendingTransfer) {
      await processBankTransfer(pendingTransfer);
      setPendingTransfer(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[hsl(var(--accent-blue))]/5 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(var(--accent-purple))]/5 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container-responsive space-y-6 sm:space-y-8 py-6 sm:py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 fade-in">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center text-primary hover:text-primary/80 mb-4 text-sm sm:text-base transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white drop-shadow-lg">Bank Transfer</h1>
            <p className="text-white/80 text-lg">Request a bank transfer from your Pulse Wallet account</p>
          </div>

          {/* Bank Transfer Form */}
          <div className="balance-card fade-in" style={{animationDelay: '0.1s'}}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-primary/30">
              <Banknote className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">Bank Transfer Request</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleTransferSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base text-white font-bold">Account Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter account holder name" 
                          className="bg-[#18191A] text-white placeholder:text-[#CCCCCC] border-white/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base text-white font-bold">Account Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter account number" 
                          className="bg-[#18191A] text-white placeholder:text-[#CCCCCC] border-white/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="institutionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base text-white font-bold">Institution Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter institution number" 
                          className="bg-[#18191A] text-white placeholder:text-[#CCCCCC] border-white/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base text-white font-bold">Transit Number (Branch Number):</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter transit number" 
                          className="bg-[#18191A] text-white placeholder:text-[#CCCCCC] border-white/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailOrMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base text-white font-bold">Email or Mobile Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter email or mobile number" 
                          className="bg-[#18191A] text-white placeholder:text-[#CCCCCC] border-white/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount Fields - CAD and USD */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm sm:text-base text-white font-bold">Amount (CAD)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      className="bg-[#18191A] text-white placeholder:text-[#CCCCCC] border-white/20" 
                      value={cadAmount}
                      onChange={(e) => handleCadChange(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm sm:text-base text-white font-bold">Amount (USD)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      className="bg-[#18191A] text-white placeholder:text-[#CCCCCC] border-white/20" 
                      value={usdAmount}
                      onChange={(e) => handleUsdChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-primary/10 border-2 border-primary rounded-2xl p-3 sm:p-4">
                  <h3 className="font-bold text-primary mb-2 text-xs sm:text-sm">Important Notes:</h3>
                  <ul className="text-xs text-white space-y-1">
                    <li className="font-medium">• <strong>Bank transfer requests are processed within 1–3 business days</strong></li>
                    <li className="font-medium">• <strong>Ensure all bank details are correct</strong> to avoid delays</li>
                    <li className="font-medium">• You will receive a confirmation email once processed</li>
                    <li className="font-medium">• Contact support if you need to modify your request</li>
                    <li className="font-medium">• Exchange rates are updated in real-time and may fluctuate</li>
                  </ul>
                </div>

                {insufficientBalance && (
                  <div className="bg-red-500/20 border-2 border-red-500 rounded-2xl p-3 sm:p-4">
                    <h3 className="font-bold text-red-500 mb-2 text-xs sm:text-sm">⚠️ Insufficient Balance</h3>
                    <p className="text-xs text-white">
                      The requested amount exceeds your available wallet balance. Please reduce the amount or add funds to your wallet.
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base border-0" 
                  disabled={isSubmitting || !cadAmount || insufficientBalance}
                  size={isMobile ? "default" : "lg"}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Bank Transfer Request'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* 2FA Verification Modal */}
      <TwoFactorVerification
        isOpen={show2FAVerification}
        onClose={() => {
          setShow2FAVerification(false);
          setPendingTransfer(null);
        }}
        onSuccess={handle2FASuccess}
        title="Secure Your Transfer"
        description="Enter your 6-digit code from your authenticator app to authorize this bank transfer."
        actionText="Authorize Transfer"
      />
    </div>
  );
};

export default BankTransfer;
