// Script to update user addresses via edge function
const updateUserAddresses = async () => {
  const userId = '7c4b74ef-c3c7-4098-8ad4-3ba7150825ee';
  
  try {
    const response = await fetch('https://tqhleqytnmoyasiskggb.supabase.co/functions/v1/update-user-addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sb-tqhleqytnmoyasiskggb-auth-token')}`
      },
      body: JSON.stringify({ userId })
    });
    
    const result = await response.json();
    console.log('User addresses updated:', result);
  } catch (error) {
    console.error('Error updating addresses:', error);
  }
};

// Execute the update
updateUserAddresses();