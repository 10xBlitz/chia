import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error(
        "Supabase admin credentials are missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }
    
    adminClient = createClient(url, key);
  }
  
  return adminClient;
}

// Export a getter function that lazily initializes
export function getSupabaseAdminClient() {
  return getSupabaseAdmin();
}

// For backward compatibility, export a proxy that lazily initializes
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = client[prop as keyof typeof client];
    
    if (typeof value === "function") {
      return value.bind(client);
    }
    
    return value;
  },
});
