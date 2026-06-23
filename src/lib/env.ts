function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizePrefix(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export function getSupabasePublicEnv() {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseServiceEnv() {
  return {
    ...getSupabasePublicEnv(),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getStorageEnv() {
  return {
    bucket: requireEnv("SUPABASE_STORAGE_BUCKET"),
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
