import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting staking profit calculations...')

    // Get all active staking records
    const { data: stakingRecords, error: stakingError } = await supabaseClient
      .from('user_staking')
      .select('*')
      .eq('is_staking', true)

    if (stakingError) {
      console.error('Error fetching staking records:', stakingError)
      throw stakingError
    }

    console.log(`Found ${stakingRecords?.length || 0} active staking records`)

    if (!stakingRecords || stakingRecords.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active staking records found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let updatedCount = 0

    for (const stakingRecord of stakingRecords) {
      try {
        // Get user's ETH wallet balance
        const { data: wallet } = await supabaseClient
          .from('user_wallets')
          .select('balance_crypto')
          .eq('user_id', stakingRecord.user_id)
          .eq('asset_symbol', 'ETH')
          .single()

        if (!wallet) {
          console.log(`No ETH wallet found for user ${stakingRecord.user_id}`)
          continue
        }

        const ethBalance = parseFloat(wallet.balance_crypto || '0')
        if (ethBalance <= 0) {
          console.log(`User ${stakingRecord.user_id} has no ETH balance`)
          continue
        }

        const now = new Date()
        const stakingStartTime = new Date(stakingRecord.staking_start_time)
        const lastCalculationTime = new Date(stakingRecord.last_calculation_time)

        // Calculate time elapsed since last calculation (in seconds)
        const timeSinceLastCalc = (now.getTime() - lastCalculationTime.getTime()) / 1000

        // Calculate daily rate: prefer per-user configured or fallback to 0.0065 (0.65%)
        const dailyRate = typeof stakingRecord.daily_yield_percent === 'number' ? stakingRecord.daily_yield_percent : 0.0065
        const secondlyRate = dailyRate / (24 * 60 * 60) // Convert to per-second rate

        // CRITICAL FIX: Calculate profit only on BASE staking amount (balance minus already earned profits)
        // This prevents incorrect compounding
        const baseStakingAmount = ethBalance - (stakingRecord.total_profits_earned || 0)
        const newProfits = baseStakingAmount * secondlyRate * timeSinceLastCalc

        console.log(`User ${stakingRecord.user_id}: baseAmount=${baseStakingAmount}, timeSinceLastCalc=${timeSinceLastCalc}s, newProfits=${newProfits}`)

        // Update the staking record (accumulate profits)
        const { error: updateError } = await supabaseClient
          .from('user_staking')
          .update({
            accrued_profits: (stakingRecord.accrued_profits || 0) + newProfits,
            total_profits_earned: (stakingRecord.total_profits_earned || 0) + newProfits,
            last_calculation_time: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', stakingRecord.id)

        if (updateError) {
          console.error(`Error updating staking record for user ${stakingRecord.user_id}:`, updateError)
        } else {
          updatedCount++
          console.log(`Updated staking profits for user ${stakingRecord.user_id}`)
        }

      } catch (userError) {
        console.error(`Error processing user ${stakingRecord.user_id}:`, userError)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully updated ${updatedCount} staking records`,
        processedRecords: updatedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})