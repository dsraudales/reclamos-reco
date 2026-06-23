import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/env";

let browserClient:
  | ReturnType<typeof createClient>
  | null = null;

export function createBrowserSupabaseClient() {
  if (!browserClient) {
    const { url, anonKey } = getSupabasePublicEnv();
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}
