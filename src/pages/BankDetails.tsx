
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface BankDetailsForm {
  fullName: string;
  bsbNumber: string;
  accountNumber: string;
}

const BankDetails = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<BankDetailsForm>({
    fullName: '',
    bsbNumber: '',
    accountNumber: ''
  });
  const [errors, setErrors] = useState<Partial<BankDetailsForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<BankDetailsForm> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('bankDetails.errorFullNameRequired');
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('bankDetails.errorFullNameLength');
    }

    if (!formData.bsbNumber.trim()) {
      newErrors.bsbNumber = t('bankDetails.errorBsbRequired');
    } else if (!/^\d{6}$/.test(formData.bsbNumber.replace(/\s/g, ''))) {
      newErrors.bsbNumber = t('bankDetails.errorBsbFormat');
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = t('bankDetails.errorAccountRequired');
    } else if (!/^\d{6,10}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = t('bankDetails.errorAccountFormat');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: t('bankDetails.successTitle'),
        description: t('bankDetails.successDescription'),
        duration: 1000,
      });

      // Reset form
      setFormData({
        fullName: '',
        bsbNumber: '',
        accountNumber: ''
      });
    } catch (error) {
      toast({
        title: t('bankDetails.errorTitle'),
        description: t('bankDetails.errorDescription'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BankDetailsForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const formatBSB = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}`;
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('bankDetails.backToDashboard')}
          </Link>
          <h1 className="text-3xl font-bold text-contrast mb-2">{t('bankDetails.title')}</h1>
          <p className="text-contrast-light">{t('bankDetails.subtitle')}</p>
        </div>

        {/* Bank Details Form */}
        <Card className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mr-4">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-contrast">{t('bankDetails.formTitle')}</h2>
              <p className="text-contrast-light">{t('bankDetails.formSubtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" className="text-contrast font-medium">
                {t('bankDetails.fullNameLabel')}
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder={t('bankDetails.fullNamePlaceholder')}
                className={`mt-2 ${errors.fullName ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* BSB Number */}
            <div>
              <Label htmlFor="bsbNumber" className="text-contrast font-medium">
                {t('bankDetails.bsbNumberLabel')}
              </Label>
              <Input
                id="bsbNumber"
                type="text"
                value={formData.bsbNumber}
                onChange={(e) => handleInputChange('bsbNumber', formatBSB(e.target.value))}
                placeholder={t('bankDetails.bsbNumberPlaceholder')}
                maxLength={7}
                className={`mt-2 ${errors.bsbNumber ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              />
              {errors.bsbNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.bsbNumber}</p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <Label htmlFor="accountNumber" className="text-contrast font-medium">
                {t('bankDetails.accountNumberLabel')}
              </Label>
              <Input
                id="accountNumber"
                type="text"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                placeholder={t('bankDetails.accountNumberPlaceholder')}
                maxLength={10}
                className={`mt-2 ${errors.accountNumber ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              />
              {errors.accountNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-blue-900 font-medium mb-1">{t('bankDetails.securityTitle')}</h4>
                  <p className="text-blue-700 text-sm">
                    {t('bankDetails.securityDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? t('bankDetails.saving') : t('bankDetails.saveBankDetails')}
              </Button>
              <Link to="/dashboard" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  {t('bankDetails.cancel')}
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default BankDetails;
