import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supportedAssets } from '@/data/supportedAssets';
import { useToast } from '@/components/ui/use-toast';

const WithdrawAsset = () => {
  const { symbol } = useParams();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    address: '',
    amount: '',
    memo: ''
  });
  
  const crypto = supportedAssets.find(c => c.symbol.toLowerCase() === symbol?.toLowerCase());
  
  if (!crypto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cryptocurrency Not Found</h1>
          <Link to="/withdraw">
            <Button>Back to Withdraw</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Withdrawal Initiated",
      description: `Withdrawal of ${formData.amount} ${crypto.symbol} has been initiated.`,
      duration: 1000,
    });
  };

  const maxAmount = 0;
  const networkFee = 0.0001;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/withdraw" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Withdraw
          </Link>
          <div className="flex items-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-white font-bold text-xl">{crypto.logo}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Withdraw {crypto.symbol}</h1>
              <p className="text-gray-600">{crypto.name}</p>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="p-6 mb-6 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">Available Balance</p>
              <p className="text-2xl font-bold text-gray-900">{maxAmount} {crypto.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm">USD Value</p>
              <p className="text-lg font-semibold text-gray-900">$0.00</p>
            </div>
          </div>
        </Card>

        {/* Warning Card */}
        <Card className="p-6 mb-6 border-red-200 bg-red-50">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-red-800 mb-1">Important Warning</p>
              <p className="text-red-700">
                Double-check the withdrawal address. Cryptocurrency transactions are irreversible and funds sent to incorrect addresses will be lost permanently.
              </p>
            </div>
          </div>
        </Card>

        {/* Withdrawal Form */}
        <Card className="p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="address" className="text-gray-900 font-medium">Withdrawal Address *</Label>
              <Input
                id="address"
                placeholder={`Enter ${crypto.symbol} address`}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="amount" className="text-gray-900 font-medium">Amount *</Label>
              <div className="relative mt-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000000"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                  className="pr-20"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mr-2 text-blue-600 hover:text-blue-700"
                    onClick={() => handleInputChange('amount', maxAmount.toString())}
                  >
                    Max
                  </Button>
                  <span className="text-gray-500 text-sm mr-3">{crypto.symbol}</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="memo" className="text-gray-900 font-medium">Memo/Tag (Optional)</Label>
              <Input
                id="memo"
                placeholder="Enter memo or destination tag if required"
                value={formData.memo}
                onChange={(e) => handleInputChange('memo', e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Some exchanges require a memo or destination tag
              </p>
            </div>

            {/* Transaction Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount to withdraw:</span>
                <span className="text-gray-900">{formData.amount || '0'} {crypto.symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Network fee:</span>
                <span className="text-gray-900">{networkFee} {crypto.symbol}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span className="text-gray-900">You will receive:</span>
                <span className="text-gray-900">
                  {Math.max(0, parseFloat(formData.amount || '0') - networkFee).toFixed(8)} {crypto.symbol}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={!formData.address || !formData.amount || parseFloat(formData.amount || '0') <= 0}
              >
                Confirm Withdrawal
              </Button>
              <Link to="/withdraw" className="block">
                <Button variant="outline" className="w-full">
                  Choose Different Asset
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default WithdrawAsset;
