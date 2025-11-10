import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDuration?: number;
}

// Enhanced rate limiting with configurable rules
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  'password-reset': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 3,
    blockDuration: 60 * 60 * 1000 // 1 hour block after limit exceeded
  },
  'login-attempt': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 5,
    blockDuration: 15 * 60 * 1000 // 15 minutes block
  },
  'seed-phrase-access': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 10,
    blockDuration: 2 * 60 * 60 * 1000 // 2 hours block
  },
  'admin-action': {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 20,
    blockDuration: 5 * 60 * 1000 // 5 minutes block
  }
};

// In-memory storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}>();

function checkRateLimit(identifier: string, action: string): {
  allowed: boolean;
  remainingAttempts?: number;
  resetTime?: number;
  blockedUntil?: number;
} {
  const config = rateLimitConfigs[action];
  if (!config) {
    console.log(`No rate limit config found for action: ${action}`);
    return { allowed: true };
  }

  const key = `${action}:${identifier}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Check if currently blocked
  if (record?.blockedUntil && now < record.blockedUntil) {
    return {
      allowed: false,
      blockedUntil: record.blockedUntil
    };
  }

  // Initialize or reset if window expired
  if (!record || (now - record.firstAttempt) > config.windowMs) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttempt: now
    });
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
      resetTime: now + config.windowMs
    };
  }

  // Check if under limit
  if (record.attempts < config.maxAttempts) {
    record.attempts++;
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - record.attempts,
      resetTime: record.firstAttempt + config.windowMs
    };
  }

  // Rate limit exceeded - set block if configured
  if (config.blockDuration) {
    record.blockedUntil = now + config.blockDuration;
    rateLimitStore.set(key, record);
  }

  return {
    allowed: false,
    remainingAttempts: 0,
    resetTime: record.firstAttempt + config.windowMs,
    blockedUntil: record.blockedUntil
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, action } = await req.json();

    if (!identifier || !action) {
      return new Response(
        JSON.stringify({ error: 'Identifier and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = checkRateLimit(identifier, action);

    const status = result.allowed ? 200 : 429;
    const response = {
      allowed: result.allowed,
      ...(!result.allowed && {
        error: result.blockedUntil 
          ? `Blocked until ${new Date(result.blockedUntil).toISOString()}`
          : 'Rate limit exceeded'
      }),
      ...(result.remainingAttempts !== undefined && { remainingAttempts: result.remainingAttempts }),
      ...(result.resetTime && { resetTime: result.resetTime }),
      ...(result.blockedUntil && { blockedUntil: result.blockedUntil })
    };

    console.log(`Rate limit check for ${action}:${identifier}:`, response);

    return new Response(
      JSON.stringify(response),
      { 
        status, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': result.remainingAttempts?.toString() || '0',
          'X-RateLimit-Reset': result.resetTime?.toString() || ''
        } 
      }
    );

  } catch (error) {
    console.error('Rate limit service error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});