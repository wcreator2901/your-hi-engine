import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supportedAssets } from '@/data/supportedAssets';
import { useLivePrices } from '@/hooks/useLivePrices';

const AssetSelection = () => {
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  const { getPriceForCrypto } = useLivePrices();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cryptocurrency Overview</h1>
          <p className="text-gray-600">View current cryptocurrency prices and market data</p>
        </div>

        {/* Asset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportedAssets.map((crypto) => {
            const currentPrice = getPriceForCrypto(crypto.id);

            return (
              <Card key={crypto.id} className="p-6 h-full bg-white">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-xl">{crypto.logo}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{crypto.symbol}</h3>
                      <p className="text-gray-600">{crypto.name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Price</span>
                    <span className="font-bold text-gray-900">${currentPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-center text-gray-500 text-sm">
                  Live price tracking enabled
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssetSelection;
