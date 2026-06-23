import { createClient } from "@supabase/supabase-js";

let browserClient:
  | ReturnType<typeof createClient>
  | null = null;
let browserConfigPromise:
  | Promise<{
      url: string;
      anonKey: string;
    }>
  | null = null;

async function getBrowserSupabaseConfig() {
  if (!browserConfigPromise) {
    browserConfigPromise = fetch("/api/public-config", {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          url?: string;
          anonKey?: string;
          error?: string;
        };

        if (!response.ok || !data.url || !data.anonKey) {
          throw new Error(
            data.error ??
              "No fue posible cargar la configuracion de Supabase.",
          );
        }

        return {
          url: data.url,
          anonKey: data.anonKey,
        };
      })
      .catch((error) => {
        browserConfigPromise = null;
        throw error;
      });
  }

  return browserConfigPromise;
}

export async function createBrowserSupabaseClient() {
  if (!browserClient) {
    const { url, anonKey } = await getBrowserSupabaseConfig();
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}
