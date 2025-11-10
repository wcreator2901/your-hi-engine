import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Server-side encryption using secure secrets
async function encryptData(text: string): Promise<string> {
  const key = Deno.env.get('ENCRYPTION_SECRET_KEY');
  if (!key) {
    throw new Error('Encryption key not configured');
  }
  
  // Use Web Crypto API for secure encryption
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const keyData = encoder.encode(key.substring(0, 32)); // Use first 32 chars as key
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}

async function decryptData(encryptedText: string): Promise<string> {
  const key = Deno.env.get('ENCRYPTION_SECRET_KEY');
  if (!key) {
    throw new Error('Encryption key not configured');
  }
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.substring(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // Decode and separate IV from encrypted data
  const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    
    if (action === 'encrypt') {
      const encrypted = await encryptData(data);
      return new Response(
        JSON.stringify({ encrypted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'decrypt') {
      const decrypted = await decryptData(data);
      return new Response(
        JSON.stringify({ decrypted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Encryption error:', error);
    return new Response(
      JSON.stringify({ error: 'Encryption operation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});