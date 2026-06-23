function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizePrefix(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    // Next.js only inlines public env vars in browser bundles when they are
    // referenced directly, not through process.env[name].
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL", url),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey),
  };
}

export function getSupabaseServiceEnv() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    ...getSupabasePublicEnv(),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey),
  };
}

export function getStorageEnv() {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  return {
    bucket: requireEnv("SUPABASE_STORAGE_BUCKET", bucket),
    uploadPrefix: normalizePrefix(
      process.env.SUPABASE_STORAGE_UPLOAD_PREFIX ?? "solicitudes",
    ),
  };
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}
