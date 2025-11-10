import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Transaction {
  id: string
  user_id: string
  currency: string
  transaction_type: string
  amount: number
  status: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { transaction } = await req.json() as { transaction: Transaction }
    
    console.log('🔄 Syncing wallet balance for transaction:', {
      transaction_id: transaction.id,
      user_id: transaction.user_id,
      currency: transaction.currency,
      type: transaction.transaction_type,
      amount: transaction.amount,
      status: transaction.status
    })

    // Only update wallet balance if transaction is completed
    if (transaction.status !== 'completed') {
      console.log('⏭️ Skipping wallet update - transaction not completed')
      return new Response(
        JSON.stringify({ message: 'Transaction not completed, wallet not updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Find the user's wallet for this currency
    const { data: wallets, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('asset_symbol', transaction.currency)
      .eq('is_active', true)

    if (walletError) {
      console.error('❌ Error fetching wallet:', walletError)
      throw walletError
    }

    let wallet = wallets && wallets.length > 0 ? wallets[0] : null

    if (!wallet) {
      console.log('⚠️ No wallet found for currency, creating one:', transaction.currency)
      const { data: newWallet, error: createError } = await supabaseClient
        .from('user_wallets')
        .insert({
          user_id: transaction.user_id,
          asset_symbol: transaction.currency,
          balance_crypto: 0,
          balance_fiat: 0,
          is_active: true,
          wallet_name: `${transaction.currency} Wallet`
        })
        .select('*')
        .single()

      if (createError) {
        console.error('❌ Error creating wallet:', createError)
        throw createError
      }

      wallet = newWallet
      console.log('🆕 Created wallet:', { wallet_id: wallet.id })
    }

    console.log('💼 Current wallet balance:', {
      wallet_id: wallet.id,
      current_crypto: wallet.balance_crypto,
      current_fiat: wallet.balance_fiat
    })

    // Calculate new balance based on transaction type
    let newCryptoBalance = wallet.balance_crypto
    
    if (transaction.transaction_type === 'deposit' || transaction.transaction_type === 'bank_transfer') {
      newCryptoBalance += transaction.amount
      console.log('➕ Adding to balance:', transaction.amount)
    } else if (transaction.transaction_type === 'withdrawal') {
      newCryptoBalance -= transaction.amount
      console.log('➖ Subtracting from balance:', transaction.amount)
      
      // Validate sufficient balance for withdrawals
      if (newCryptoBalance < 0) {
        console.error('❌ Insufficient balance for withdrawal')
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient balance',
            message: `User has ${wallet.balance_crypto} ${transaction.currency} but tried to withdraw ${transaction.amount}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Additional check: ensure balance never goes negative
    if (newCryptoBalance < 0) {
      console.error('❌ Transaction would result in negative balance')
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient balance',
          message: `Transaction would result in negative balance: ${newCryptoBalance}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('💰 New balance:', newCryptoBalance)

    // Update the wallet balance
    const { error: updateError } = await supabaseClient
      .from('user_wallets')
      .update({
        balance_crypto: newCryptoBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    if (updateError) {
      console.error('❌ Error updating wallet:', updateError)
      throw updateError
    }

    console.log('✅ Wallet balance synced successfully')

    return new Response(
      JSON.stringify({ 
        message: 'Wallet balance updated successfully',
        new_balance: newCryptoBalance
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('❌ Error in sync-wallet-balance:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
