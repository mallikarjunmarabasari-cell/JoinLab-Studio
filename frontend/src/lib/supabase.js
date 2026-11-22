
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables')
}

// export const supabase: Makes the shared client available throughout React
export const supabase = createClient( //Initializes the Supabase client
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true, //Persists the user's session across reloads
      autoRefreshToken: true, //Refreshes expiring access tokens
      detectSessionInUrl: true, //Detects authentication callback information in the URL
    },
  }
)
