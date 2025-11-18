const { createClient } = require('@supabase/supabase-js');
const { config } = require('./env');

/**
 * Creates a Supabase client with service role key (for backend operations)
 * Use this for operations that require elevated privileges
 */
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Creates a Supabase client with anon key (for public operations)
 * Use this for public data like routes listing
 */
const supabasePublic = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

module.exports = { supabaseAdmin, supabasePublic };
