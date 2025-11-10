
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, CreditCard, ArrowRight } from 'lucide-react';
import FinchPayWidget from './FinchPayWidget';
import { useNavigate } from 'react-router-dom';

interface PaymentOptionsProps {
  symbol?: string;
  showDepositAddress?: boolean;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  symbol = 'ETH',
  showDepositAddress = true
}) => {
  const navigate = useNavigate();

  const handleViewDeposits = () => {
    navigate('/dashboard/deposit');
  };

  return (
    <Card className="p-4 sm:p-6 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
      
      <div className="space-y-4">
        {/* Finch Pay Option */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Buy Crypto Instantly</h4>
                <p className="text-sm text-gray-600">Purchase with debit/credit card</p>
              </div>
            </div>
          </div>
          
          <FinchPayWidget
            amount={100}
            currency="USD"
            cryptocurrency={symbol}
          />
        </div>

        {/* Traditional Deposit Option */}
        {showDepositAddress && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Deposit from Wallet</h4>
                  <p className="text-sm text-gray-600">Send crypto to your deposit address</p>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewDeposits}
            >
              View Deposit Addresses
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PaymentOptions;
