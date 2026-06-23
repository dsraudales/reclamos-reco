import { z } from "zod";

import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES,
  SUBMISSION_STATUSES,
} from "@/lib/constants";

const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    },
    z.string().max(maxLength).optional(),
  );

const optionalEmail = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim().toLowerCase();
    return trimmed.length ? trimmed : undefined;
  },
  z.string().email().max(120).optional(),
);

export const requestPayloadSchema = z.object({
  fullName: z.string().trim().min(5).max(120),
  clientCode: z.string().trim().min(3).max(40),
  phone: optionalText(30),
  email: optionalEmail,
});

export const uploadManifestSchema = z.object({
  name: z.string().trim().min(1).max(160),
  size: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  type: z
    .string()
    .trim()
    .refine((value) => ACCEPTED_IMAGE_TYPES.includes(value as never), {
      message: "Formato de imagen no permitido.",
    }),
});

export const prepareUploadsSchema = requestPayloadSchema.extend({
  files: z.array(uploadManifestSchema).min(1).max(MAX_FILES),
});

export const finalizedFileSchema = z.object({
  path: z.string().trim().min(1).max(500),
  fileName: z.string().trim().min(1).max(160),
  contentType: z
    .string()
    .trim()
    .refine((value) => ACCEPTED_IMAGE_TYPES.includes(value as never), {
      message: "Formato de imagen no permitido.",
    }),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  sortOrder: z.number().int().min(0).max(MAX_FILES - 1),
});

export const finalizeSubmissionSchema = requestPayloadSchema.extend({
  submissionId: z.string().uuid(),
  files: z.array(finalizedFileSchema).min(1).max(MAX_FILES),
});

export const cleanupUploadsSchema = z.object({
  submissionId: z.string().uuid(),
  paths: z.array(z.string().trim().min(1).max(500)).max(MAX_FILES),
});

export const submissionManagementSchema = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(SUBMISSION_STATUSES),
  notes: optionalText(2000),
});
