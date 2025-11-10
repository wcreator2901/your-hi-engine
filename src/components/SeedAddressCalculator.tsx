import React, { useEffect, useState } from 'react';
import { deriveEthereumAddress, validateMnemonic } from '@/utils/hdWallet';

export const SeedAddressCalculator = () => {
  const [addresses, setAddresses] = useState<any>(null);
  
  useEffect(() => {
    const testMnemonic = "news call solid spoil nature orbit nephew soda citizen pitch unveil quick";
    
    console.log('=== Calculating addresses for seed ===');
    
    if (!validateMnemonic(testMnemonic)) {
      console.error('Invalid mnemonic');
      return;
    }
    
    try {
      const ethAddress = deriveEthereumAddress(testMnemonic, 0);
      
      const results = {
        eth: ethAddress.address
      };
      
      console.log('ETH Address:', results.eth);
      
      setAddresses(results);
    } catch (error) {
      console.error('Error calculating addresses:', error);
    }
  }, []);
  
  if (!addresses) {
    return <div>Calculating addresses...</div>;
  }
  
  return (
    <div className="p-4 bg-card rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Addresses for seed phrase:</h3>
      <div className="space-y-2">
        <div><strong>ETH:</strong> {addresses.eth}</div>
      </div>
    </div>
  );
};