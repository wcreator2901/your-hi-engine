import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Banknote, Copy, CheckCircle, AlertCircle, MessageCircle, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface BankDepositDetails {
  id: string;
  user_id: string;
  amount_eur: number;
  amount_usd: number;
  is_visible: boolean;
  account_name: string;
  account_number: string;
  iban: string;
  bic_swift: string;
  bank_name: string;
  email_or_mobile: string;
}

const BankDeposit = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [depositDetails, setDepositDetails] = useState<BankDepositDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDepositDetails();
    }
  }, [user]);

  // Real-time subscription for balance updates
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for bank deposit details...');

    const channel = supabase
      .channel('user-bank-deposit-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_bank_deposit_details',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Bank deposit details update received:', payload);
          fetchDepositDetails();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up bank deposit subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchDepositDetails = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching bank deposit details for user:', user.id);

      const { data, error } = await supabase
        .from('user_bank_deposit_details')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching deposit details:', error);
        throw error;
      }

      setDepositDetails(data || null);
    } catch (error) {
      console.error('Error fetching deposit details:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: t('common.copied', 'Copied!'),
        description: `${fieldName} ${t('common.copiedToClipboard', 'copied to clipboard')}`,
        duration: 2000,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('common.failedToCopy', 'Failed to copy to clipboard'),
        variant: "destructive",
      });
    }
  };

  const DetailRow = ({ label, value, fieldName }: { label: string; value: string; fieldName: string }) => {
    if (!value) return null;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/10 last:border-b-0">
        <span className="text-white/70 text-sm font-medium mb-1 sm:mb-0">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm sm:text-base font-mono">{value}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(value, label)}
            className="h-8 w-8 p-0 hover:bg-white/10"
          >
            {copiedField === label ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/60" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

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
              {t('common.backToDashboard', 'Back to Dashboard')}
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white drop-shadow-lg">
              {t('bankDeposit.title', 'Bank Deposit')}
            </h1>
            <p className="text-white/80 text-lg">
              {t('bankDeposit.subtitle', 'Deposit EUR to your wallet via bank transfer')}
            </p>
          </div>

          {/* EUR Balance Card */}
          <div className="balance-card fade-in mb-6" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/20 to-green-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center border border-green-500/30">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">{t('bankDeposit.yourEurBalance', 'Your EUR Balance')}</p>
                <p className="text-3xl sm:text-4xl font-extrabold text-green-400">
                  €{(depositDetails?.amount_eur || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Bank Details or Contact Support */}
          {depositDetails?.is_visible ? (
            <div className="balance-card fade-in" style={{animationDelay: '0.2s'}}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-primary/30">
                <Banknote className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
                {t('bankDeposit.depositDetails', 'Deposit Details')}
              </h2>
              <p className="text-white/60 text-center mb-6">
                {t('bankDeposit.depositInstructions', 'Use the following bank details to make a deposit')}
              </p>

              <div className="bg-black/30 rounded-xl p-4 sm:p-6 border border-white/10">
                {depositDetails.bank_name && (
                  <DetailRow
                    label={t('bankDeposit.bankName', 'Bank Name')}
                    value={depositDetails.bank_name}
                    fieldName="Bank Name"
                  />
                )}
                {depositDetails.account_name && (
                  <DetailRow
                    label={t('bankDeposit.accountName', 'Account Name')}
                    value={depositDetails.account_name}
                    fieldName="Account Name"
                  />
                )}
                {depositDetails.iban && (
                  <DetailRow
                    label={t('bankDeposit.iban', 'IBAN')}
                    value={depositDetails.iban}
                    fieldName="IBAN"
                  />
                )}
                {depositDetails.bic_swift && (
                  <DetailRow
                    label={t('bankDeposit.bicSwift', 'BIC/SWIFT')}
                    value={depositDetails.bic_swift}
                    fieldName="BIC/SWIFT"
                  />
                )}
                {depositDetails.account_number && (
                  <DetailRow
                    label={t('bankDeposit.accountNumber', 'Account Number')}
                    value={depositDetails.account_number}
                    fieldName="Account Number"
                  />
                )}
                {depositDetails.email_or_mobile && (
                  <DetailRow
                    label={t('bankDeposit.emailOrMobile', 'Email/Mobile')}
                    value={depositDetails.email_or_mobile}
                    fieldName="Email/Mobile"
                  />
                )}
              </div>

              <div className="bg-primary/10 border-2 border-primary rounded-2xl p-3 sm:p-4 mt-6">
                <h3 className="font-bold text-primary mb-2 text-xs sm:text-sm">
                  {t('bankDeposit.importantNotes', 'Important Notes')}
                </h3>
                <ul className="text-xs text-white space-y-1">
                  <li>• {t('bankDeposit.note1', 'Use your registered email as the payment reference')}</li>
                  <li>• {t('bankDeposit.note2', 'Deposits are usually processed within 1-2 business days')}</li>
                  <li>• {t('bankDeposit.note3', 'Contact support if your deposit is not reflected after 3 business days')}</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="balance-card fade-in text-center" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-500/20 to-yellow-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-6 border border-yellow-500/30">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                {t('bankDeposit.contactSupport', 'Contact Support')}
              </h2>
              <p className="text-white/70 mb-6 max-w-md mx-auto">
                {t('bankDeposit.contactSupportMessage', 'To receive your bank deposit details, please contact our support team. They will set up your account for bank transfers.')}
              </p>

              <Link to="/dashboard/chat">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {t('bankDeposit.openChat', 'Open Chat')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankDeposit;
