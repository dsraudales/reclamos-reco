import "server-only";

import { STORAGE_DOWNLOAD_TTL_SECONDS } from "@/lib/constants";
import { getStorageEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { PlannedUpload, UploadManifest } from "@/lib/types";

function normalizeFileName(fileName: string) {
  const extensionIndex = fileName.lastIndexOf(".");
  const rawExtension =
    extensionIndex >= 0 ? fileName.slice(extensionIndex).toLowerCase() : "";
  const rawBaseName =
    extensionIndex >= 0 ? fileName.slice(0, extensionIndex) : fileName;

  const safeBaseName = rawBaseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60);

  return `${safeBaseName || "imagen"}-${crypto.randomUUID().slice(0, 8)}${rawExtension}`;
}

function makeSafeDownloadName(fileName: string) {
  return (
    fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-") || "archivo"
  );
}

export function buildStorageObjectPath(
  submissionId: string,
  originalName: string,
) {
  const { uploadPrefix } = getStorageEnv();
  return `${uploadPrefix}/${submissionId}/${normalizeFileName(originalName)}`;
}

export function isSubmissionStoragePath(submissionId: string, path: string) {
  const { uploadPrefix } = getStorageEnv();
  return path.startsWith(`${uploadPrefix}/${submissionId}/`);
}

export async function createUploadPlan(
  submissionId: string,
  files: UploadManifest[],
): Promise<PlannedUpload[]> {
  const supabase = createAdminSupabaseClient();
  const { bucket } = getStorageEnv();

  return Promise.all(
    files.map(async (file, sortOrder) => {
      const path = buildStorageObjectPath(submissionId, file.name);
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(path);

      if (error || !data) {
        throw error ?? new Error("No fue posible firmar la carga.");
      }

      return {
        bucket,
        path,
        token: data.token,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        sortOrder,
      };
    }),
  );
}

export async function deleteObjects(paths: string[]) {
  if (!paths.length) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { bucket } = getStorageEnv();
  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw error;
  }
}

export async function getDownloadUrl(
  bucket: string,
  path: string,
  fileName: string,
) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, STORAGE_DOWNLOAD_TTL_SECONDS, {
      download: makeSafeDownloadName(fileName),
    });

  if (error || !data?.signedUrl) {
    throw error ?? new Error("No fue posible firmar la descarga.");
  }

  return data.signedUrl;
}
