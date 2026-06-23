import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { hasAdminAccess } from "@/lib/admin-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentUserOrNull() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAdminUser() {
  const user = await getCurrentUserOrNull();

  if (!user) {
    redirect("/admin/login");
  }

  if (!hasAdminAccess(user)) {
    redirect("/admin/login?error=no_access");
  }

  return user;
}

export async function getAdminUserForRoute(): Promise<User | null> {
  const user = await getCurrentUserOrNull();

  if (!user || !hasAdminAccess(user)) {
    return null;
  }

  return user;
}
