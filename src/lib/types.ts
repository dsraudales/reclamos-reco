import type { SubmissionStatus } from "@/lib/constants";

export type SubmissionRecord = {
  id: string;
  full_name: string;
  client_code: string;
  phone: string | null;
  email: string | null;
  status: SubmissionStatus;
  notes: string | null;
  files_count: number;
  created_at: string;
  updated_at: string;
};

export type SubmissionFileRecord = {
  id: string;
  submission_id: string;
  file_name: string;
  storage_bucket: string;
  storage_path: string;
  content_type: string;
  size_bytes: number;
  sort_order: number;
  created_at: string;
};

export type UploadManifest = {
  name: string;
  size: number;
  type: string;
};

export type PlannedUpload = {
  bucket: string;
  path: string;
  token: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
};

export type FinalizedFileInput = Omit<PlannedUpload, "bucket" | "token">;
