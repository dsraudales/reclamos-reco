import "server-only";

import { getStorageEnv } from "@/lib/env";
import { getAdminDateKey } from "@/lib/formatters";
import type { SubmissionQueryFilters } from "@/lib/submission-filters";
import { deleteObjects } from "@/lib/storage";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  FinalizedFileInput,
  SubmissionFileRecord,
  SubmissionRecord,
} from "@/lib/types";

type CreateSubmissionInput = {
  submissionId: string;
  fullName: string;
  clientCode: string;
  phone?: string;
  email?: string;
  files: FinalizedFileInput[];
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesSearch(
  submission: SubmissionRecord,
  normalizedSearch: string | undefined,
) {
  if (!normalizedSearch) {
    return true;
  }

  const haystack = normalizeSearchValue(
    [
      submission.full_name,
      submission.client_code,
      submission.phone ?? "",
      submission.email ?? "",
      submission.notes ?? "",
    ].join(" "),
  );

  return haystack.includes(normalizedSearch);
}

function matchesDateRange(
  submission: SubmissionRecord,
  filters: SubmissionQueryFilters,
) {
  const createdDate = getAdminDateKey(submission.created_at);

  if (filters.dateFrom && createdDate < filters.dateFrom) {
    return false;
  }

  if (filters.dateTo && createdDate > filters.dateTo) {
    return false;
  }

  return true;
}

export async function listSubmissions(filters: SubmissionQueryFilters = {}) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const normalizedSearch = filters.search
    ? normalizeSearchValue(filters.search)
    : undefined;

  return ((data ?? []) as SubmissionRecord[]).filter(
    (submission) =>
      matchesSearch(submission, normalizedSearch) &&
      matchesDateRange(submission, filters),
  );
}

export async function getSubmissionDetail(submissionId: string) {
  const supabase = createAdminSupabaseClient();

  const [
    { data: submission, error: submissionError },
    { data: files, error: filesError },
  ] = await Promise.all([
    supabase.from("submissions").select("*").eq("id", submissionId).maybeSingle(),
    supabase
      .from("submission_files")
      .select("*")
      .eq("submission_id", submissionId)
      .order("sort_order", { ascending: true }),
  ]);

  if (submissionError) {
    throw submissionError;
  }

  if (filesError) {
    throw filesError;
  }

  return {
    submission: submission as SubmissionRecord | null,
    files: (files ?? []) as SubmissionFileRecord[],
  };
}

export async function createSubmission(input: CreateSubmissionInput) {
  const supabase = createAdminSupabaseClient();
  const { bucket } = getStorageEnv();

  try {
    const { error: submissionError } = await supabase.from("submissions").insert({
      id: input.submissionId,
      full_name: input.fullName,
      client_code: input.clientCode,
      phone: input.phone || null,
      email: input.email || null,
      files_count: input.files.length,
    });

    if (submissionError) {
      throw submissionError;
    }

    const { error: filesError } = await supabase.from("submission_files").insert(
      input.files.map((file) => ({
        submission_id: input.submissionId,
        file_name: file.fileName,
        storage_bucket: bucket,
        storage_path: file.path,
        content_type: file.contentType,
        size_bytes: file.sizeBytes,
        sort_order: file.sortOrder,
      })),
    );

    if (filesError) {
      await supabase.from("submissions").delete().eq("id", input.submissionId);
      throw filesError;
    }

    return { id: input.submissionId };
  } catch (error) {
    await deleteObjects(input.files.map((file) => file.path));
    throw error;
  }
}

export async function updateSubmissionManagement(input: {
  submissionId: string;
  status: SubmissionRecord["status"];
  notes?: string;
}) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("submissions")
    .update({
      status: input.status,
      notes: input.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.submissionId);

  if (error) {
    throw error;
  }
}
