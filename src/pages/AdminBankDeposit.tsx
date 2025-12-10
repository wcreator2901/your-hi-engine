import React, { useState, useEffect } from 'react';
import { Search, Banknote, Save, Edit, Check, X, Eye, EyeOff, DollarSign, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface UserProfile {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

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

const AdminBankDeposit = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [depositDetails, setDepositDetails] = useState<BankDepositDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    amount_eur: 0,
    is_visible: false,
    account_name: '',
    account_number: '',
    iban: '',
    bic_swift: '',
    bank_name: '',
    email_or_mobile: '',
  });

  // Editing state
  const [editingEurBalance, setEditingEurBalance] = useState(false);
  const [newEurBalance, setNewEurBalance] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchDepositDetails();
    }
  }, [selectedUserId]);

  // Real-time subscription for deposit details updates
  useEffect(() => {
    if (!selectedUserId) return;

    console.log('Setting up real-time subscription for bank deposit details...');

    const channel = supabase
      .channel('admin-bank-deposit-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_bank_deposit_details',
          filter: `user_id=eq.${selectedUserId}`
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
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users for bank deposit management...');

      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('first_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Get user emails from auth to filter out orphaned profiles
      const { data: sessionResult } = await supabase.auth.getSession();
      const token = sessionResult?.session?.access_token;
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke('get-user-emails', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (emailError) {
        console.error('Error fetching user emails:', emailError);
      }

      // Filter out orphaned profiles
      const validProfiles = profiles?.filter(profile =>
        emailResponse?.users?.some((u: any) => u.id === profile.user_id)
      );

      const usersWithEmails = validProfiles?.map(profile => ({
        id: profile.user_id,
        full_name: profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.full_name || profile.email || 'Unknown User',
        email: profile.email || `${profile.user_id}@example.com`
      })) || [];

      console.log('Fetched users:', usersWithEmails);
      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepositDetails = async () => {
    if (!selectedUserId) return;

    try {
      console.log('Fetching bank deposit details for user:', selectedUserId);

      const { data, error } = await supabase
        .from('user_bank_deposit_details')
        .select('*')
        .eq('user_id', selectedUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching deposit details:', error);
        throw error;
      }

      if (data) {
        setDepositDetails(data);
        setFormData({
          amount_eur: data.amount_eur || 0,
          is_visible: data.is_visible || false,
          account_name: data.account_name || '',
          account_number: data.account_number || '',
          iban: data.iban || '',
          bic_swift: data.bic_swift || '',
          bank_name: data.bank_name || '',
          email_or_mobile: data.email_or_mobile || '',
        });
      } else {
        // No existing record, reset form
        setDepositDetails(null);
        setFormData({
          amount_eur: 0,
          is_visible: false,
          account_name: '',
          account_number: '',
          iban: '',
          bic_swift: '',
          bank_name: '',
          email_or_mobile: '',
        });
      }
    } catch (error) {
      console.error('Error fetching deposit details:', error);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
    setEditingEurBalance(false);
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveDepositDetails = async () => {
    if (!selectedUserId) return;

    try {
      setSaving(true);
      console.log('Saving bank deposit details...');

      const dataToSave = {
        user_id: selectedUserId,
        amount_eur: formData.amount_eur,
        is_visible: formData.is_visible,
        account_name: formData.account_name,
        account_number: formData.account_number,
        iban: formData.iban,
        bic_swift: formData.bic_swift,
        bank_name: formData.bank_name,
        email_or_mobile: formData.email_or_mobile,
        updated_at: new Date().toISOString(),
      };

      if (depositDetails?.id) {
        // Update existing record
        const { error } = await supabase
          .from('user_bank_deposit_details')
          .update(dataToSave)
          .eq('id', depositDetails.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_bank_deposit_details')
          .insert([dataToSave]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Bank deposit details saved successfully",
        duration: 2000,
      });

      await fetchDepositDetails();
    } catch (error) {
      console.error('Error saving deposit details:', error);
      toast({
        title: "Error",
        description: "Failed to save bank deposit details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveEurBalance = async () => {
    const eurAmount = parseFloat(newEurBalance);
    if (isNaN(eurAmount) || eurAmount < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      if (depositDetails?.id) {
        const { error } = await supabase
          .from('user_bank_deposit_details')
          .update({
            amount_eur: eurAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', depositDetails.id);

        if (error) throw error;
      } else {
        // Create new record with just the EUR balance
        const { error } = await supabase
          .from('user_bank_deposit_details')
          .insert([{
            user_id: selectedUserId,
            amount_eur: eurAmount,
          }]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `EUR balance updated to €${eurAmount.toFixed(2)}`,
        duration: 2000,
      });

      setFormData(prev => ({ ...prev, amount_eur: eurAmount }));
      setEditingEurBalance(false);
      setNewEurBalance('');
      await fetchDepositDetails();
    } catch (error) {
      console.error('Error saving EUR balance:', error);
      toast({
        title: "Error",
        description: "Failed to update EUR balance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[hsl(var(--accent-blue))]/5 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(var(--accent-purple))]/5 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container-responsive space-y-6 sm:space-y-8 py-6 sm:py-8 relative z-10">
        <div className="text-center mb-8 fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="icon-container">
              <Banknote className="w-5 sm:w-8 h-5 sm:h-8 text-white" />
            </div>
            <h1 className="text-[1.625rem] sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {t('admin.bankDeposit', 'Admin Bank Deposit')}
            </h1>
          </div>
          <p className="text-white text-[0.65rem] sm:text-base max-w-2xl mx-auto font-medium">
            {t('admin.bankDepositDescription', 'Configure bank deposit details and EUR balance for users.')}
          </p>
        </div>

        <div className="wallet-card fade-in" style={{animationDelay: '0.1s'}}>
          {/* User Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="icon-container bg-[#F97316]/20">
                <Search className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-[#F97316]" />
              </div>
              <Label className="text-[0.8125rem] sm:text-xl font-extrabold text-white">
                {t('admin.selectUser', 'Select User')}
              </Label>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-3.5 sm:w-5 h-3.5 sm:h-5" />
              <Input
                placeholder={t('admin.searchUsers', 'Search users by name or email')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-11 bg-black text-white placeholder:text-white/50 border-white/20 focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] text-[0.65rem] sm:text-base h-8 sm:h-10"
              />
            </div>

            <Select value={selectedUserId} onValueChange={handleUserSelect}>
              <SelectTrigger className="glass-card border-border text-white text-[0.65rem] sm:text-base h-8 sm:h-10">
                <SelectValue placeholder={t('admin.selectUserPlaceholder', 'Select a user...')} className="text-white" />
              </SelectTrigger>
              <SelectContent className="glass-card border-border shadow-xl z-50 max-h-60 overflow-auto bg-slate-800">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-white/60 text-[0.65rem] sm:text-sm">
                    {loading ? t('common.loading', 'Loading...') : t('admin.noUsersFound', 'No users found')}
                  </div>
                ) : (
                  filteredUsers.map((user, index) => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className="hover:bg-slate-700 focus:bg-slate-700 text-white fade-in text-[0.65rem] sm:text-sm"
                      style={{animationDelay: `${0.05 * index}s`}}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{user.full_name}</span>
                        <span className="text-[0.585rem] sm:text-xs text-white/60">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedUser && (
              <div className="bg-gradient-to-r from-[#F97316]/20 to-[#F97316]/10 p-3 sm:p-5 rounded-xl border-2 border-[#F97316]/40 fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="icon-container bg-[#F97316]/30">
                    <Shield className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-white" />
                  </div>
                  <h3 className="text-[0.7475rem] sm:text-lg font-bold text-white">{t('admin.selectedUser', 'Selected User')}</h3>
                </div>
                <div className="text-[0.65rem] sm:text-base text-white space-y-2">
                  <p className="flex items-center gap-2">
                    <strong className="font-bold">{t('common.name', 'Name')}:</strong>
                    <span className="font-medium">{selectedUser.full_name}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <strong className="font-bold">{t('common.email', 'Email')}:</strong>
                    <span className="font-medium">{selectedUser.email}</span>
                  </p>
                </div>
              </div>
            )}

            {/* EUR Balance Section */}
            {selectedUser && (
              <div className="bg-gradient-to-r from-green-500/20 to-green-500/10 p-4 sm:p-6 rounded-xl border-2 border-green-500/40 fade-in space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="icon-container bg-green-500/30">
                    <DollarSign className="w-4 sm:w-6 h-4 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-xl font-bold text-white">{t('admin.eurBalance', 'EUR Balance')}</h3>
                </div>

                <div className="bg-black/30 p-4 rounded-lg border border-white/20">
                  <p className="text-xs sm:text-sm text-white/80 mb-1 font-medium">{t('admin.currentEurBalance', 'Current EUR Balance')}</p>

                  {editingEurBalance ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-green-400 text-xl font-bold">€</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={newEurBalance}
                          onChange={(e) => setNewEurBalance(e.target.value)}
                          className="w-full sm:w-40 bg-black text-white border-white/20 text-lg font-bold"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={saveEurBalance}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold"
                          disabled={saving}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {t('common.save', 'Save')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingEurBalance(false);
                            setNewEurBalance('');
                          }}
                          className="border-white/40 text-white hover:bg-white/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-2xl sm:text-4xl font-extrabold text-green-400">
                        €{(formData.amount_eur || 0).toFixed(2)}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingEurBalance(true);
                          setNewEurBalance(formData.amount_eur.toString());
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {t('common.edit', 'Edit')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bank Details Form */}
            {selectedUser && (
              <div className="asset-card fade-in border-2 border-white/10 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b-2 border-white/15">
                  <h3 className="text-[0.81rem] sm:text-2xl font-extrabold text-white flex items-center gap-3">
                    <div className="icon-container bg-[#F97316]/20">
                      <Banknote className="w-3.5 sm:w-5 h-3.5 sm:h-5 text-[#F97316]" />
                    </div>
                    {t('admin.bankDetails', 'Bank Details Configuration')}
                  </h3>
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/20">
                  <div className="flex items-center gap-3">
                    {formData.is_visible ? (
                      <Eye className="w-5 h-5 text-green-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-white font-bold">{t('admin.visibility', 'Visibility')}</p>
                      <p className="text-white/60 text-sm">
                        {formData.is_visible
                          ? t('admin.visibilityOnDesc', 'User can see bank details')
                          : t('admin.visibilityOffDesc', 'User sees "Contact Support" message')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => handleInputChange('is_visible', checked)}
                  />
                </div>

                {/* Bank Details Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white font-bold">{t('admin.accountName', 'Account Name')}</Label>
                    <Input
                      value={formData.account_name}
                      onChange={(e) => handleInputChange('account_name', e.target.value)}
                      placeholder={t('admin.accountNamePlaceholder', 'Enter account holder name')}
                      className="bg-black text-white border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-bold">{t('admin.bankName', 'Bank Name')}</Label>
                    <Input
                      value={formData.bank_name}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      placeholder={t('admin.bankNamePlaceholder', 'Enter bank name')}
                      className="bg-black text-white border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-bold">{t('admin.iban', 'IBAN')}</Label>
                    <Input
                      value={formData.iban}
                      onChange={(e) => handleInputChange('iban', e.target.value)}
                      placeholder={t('admin.ibanPlaceholder', 'Enter IBAN')}
                      className="bg-black text-white border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-bold">{t('admin.bicSwift', 'BIC/SWIFT')}</Label>
                    <Input
                      value={formData.bic_swift}
                      onChange={(e) => handleInputChange('bic_swift', e.target.value)}
                      placeholder={t('admin.bicSwiftPlaceholder', 'Enter BIC/SWIFT code')}
                      className="bg-black text-white border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-bold">{t('admin.accountNumber', 'Account Number')}</Label>
                    <Input
                      value={formData.account_number}
                      onChange={(e) => handleInputChange('account_number', e.target.value)}
                      placeholder={t('admin.accountNumberPlaceholder', 'Enter account number')}
                      className="bg-black text-white border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-bold">{t('admin.emailOrMobile', 'Email or Mobile')}</Label>
                    <Input
                      value={formData.email_or_mobile}
                      onChange={(e) => handleInputChange('email_or_mobile', e.target.value)}
                      placeholder={t('admin.emailOrMobilePlaceholder', 'Enter email or mobile for transfers')}
                      className="bg-black text-white border-white/20"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={saveDepositDetails}
                  disabled={saving}
                  className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-bold py-3"
                >
                  {saving ? (
                    <>
                      <Save className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.saving', 'Saving...')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t('admin.saveBankDetails', 'Save Bank Details')}
                    </>
                  )}
                </Button>
              </div>
            )}

            {!selectedUser && (
              <div className="text-center py-12">
                <Banknote className="w-8 sm:w-12 h-8 sm:h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                <p className="text-secondary text-[0.65rem] sm:text-base">{t('admin.selectUserToManage', 'Select a user to manage their bank deposit details')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBankDeposit;
