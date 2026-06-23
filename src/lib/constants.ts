export const MAX_FILES = 10;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const SUBMISSION_STATUSES = ["new", "in_review", "resolved"] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  new: "Nueva",
  in_review: "En revisión",
  resolved: "Resuelta",
};

export const STORAGE_DOWNLOAD_TTL_SECONDS = 60 * 5;
