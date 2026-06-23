"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasAdminAccess } from "@/lib/admin-access";
import { requireAdminUser } from "@/lib/auth";
import { updateSubmissionManagement } from "@/lib/submissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { submissionManagementSchema } from "@/lib/validation";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=missing_fields");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/admin/login?error=invalid_credentials");
  }

  if (!hasAdminAccess(data.user)) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=no_access");
  }

  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateSubmissionAction(formData: FormData) {
  await requireAdminUser();

  const parsed = submissionManagementSchema.safeParse({
    submissionId: formData.get("submissionId"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    const fallbackId = String(formData.get("submissionId") ?? "");
    redirect(`/admin/submissions/${fallbackId}?error=validation`);
  }

  await updateSubmissionManagement(parsed.data);
  revalidatePath("/admin");
  revalidatePath(`/admin/submissions/${parsed.data.submissionId}`);
  redirect(`/admin/submissions/${parsed.data.submissionId}?updated=1`);
}
