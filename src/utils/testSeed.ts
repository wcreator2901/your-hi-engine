import { deriveEthereumAddress, validateMnemonic } from './hdWallet';

export function calculateAddressForSeed() {
  const testMnemonic = "news call solid spoil nature orbit nephew soda citizen pitch unveil quick";
  
  console.log('=== Address Generation Test ===');
  console.log('Seed phrase:', testMnemonic);
  
  if (!validateMnemonic(testMnemonic)) {
    console.error('❌ Invalid mnemonic provided');
    return null;
  }
  
  try {
    // Generate ETH address
    const ethAddress = deriveEthereumAddress(testMnemonic, 0);
    console.log('✅ ETH Address:', ethAddress.address);
    console.log('   Derivation Path:', ethAddress.derivationPath);
    
    return {
      eth: ethAddress.address
    };
  } catch (error) {
    console.error('❌ Error generating addresses:', error);
    return null;
  }
}

// Run the test immediately when this module is imported
calculateAddressForSeed();