import type { User } from "@supabase/supabase-js";

import { getAdminEmails } from "@/lib/env";

type MinimalUser = Pick<User, "email" | "app_metadata" | "user_metadata">;

export function hasAdminAccess(user: MinimalUser | null | undefined) {
  if (!user?.email) {
    return false;
  }

  const email = user.email.toLowerCase();
  const adminEmails = getAdminEmails();

  return (
    adminEmails.includes(email) ||
    user.app_metadata?.role === "admin" ||
    user.user_metadata?.role === "admin"
  );
}
