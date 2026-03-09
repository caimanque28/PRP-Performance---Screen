import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key are required. Please configure them in the settings.');
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

// Export a proxy that behaves like the supabase client but initializes lazily
// and handles missing configuration gracefully for the UI.
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop: string | symbol) {
    // Handle symbols (like for React devtools or internal JS stuff)
    if (typeof prop === 'symbol') {
      return (target as any)[prop];
    }

    let instance: any;
    try {
      instance = getSupabase();
    } catch (e) {
      // Return dummy handlers for common Supabase methods to prevent crashes
      if (prop === 'auth') {
        return {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: async () => ({ data: {}, error: { message: 'Supabase not configured' } }),
          signUp: async () => ({ data: {}, error: { message: 'Supabase not configured' } }),
          signOut: async () => ({ error: null }),
        };
      }
      if (prop === 'from') {
        return () => ({
          select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
          insert: () => ({ error: { message: 'Supabase not configured' } }),
          update: () => ({ error: { message: 'Supabase not configured' } }),
          delete: () => ({ error: { message: 'Supabase not configured' } }),
        });
      }
      return undefined;
    }
    
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
