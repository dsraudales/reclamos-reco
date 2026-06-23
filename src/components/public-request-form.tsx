"use client";

import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Paperclip,
  Send,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_FILES,
} from "@/lib/constants";
import { formatFileSize, shortenId } from "@/lib/formatters";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type SubmissionStatusState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

type PreparedUpload = {
  submissionId: string;
  uploads: Array<{
    bucket: string;
    path: string;
    token: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    sortOrder: number;
  }>;
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

function isAcceptedImage(file: File) {
  return ACCEPTED_IMAGE_TYPES.includes(
    file.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
  );
}

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function mergeSelectedFiles(existingFiles: File[], incomingFiles: File[]) {
  const merged = new Map(existingFiles.map((file) => [getFileKey(file), file]));

  for (const file of incomingFiles) {
    merged.set(getFileKey(file), file);
  }

  return Array.from(merged.values());
}

export function PublicRequestForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmissionStatusState>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  function clearSelectedFiles() {
    setSelectedFiles([]);
    setStatus(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const incomingFiles = Array.from(event.target.files ?? []);

    if (!incomingFiles.length) {
      return;
    }

    const invalidType = incomingFiles.find((file) => !isAcceptedImage(file));
    if (invalidType) {
      setStatus({
        type: "error",
        message: `El archivo "${invalidType.name}" no tiene un formato permitido.`,
      });
      event.target.value = "";
      return;
    }

    const oversizedFile = incomingFiles.find(
      (file) => file.size > MAX_FILE_SIZE_BYTES,
    );
    if (oversizedFile) {
      setStatus({
        type: "error",
        message: `El archivo "${oversizedFile.name}" supera el máximo de ${MAX_FILE_SIZE_MB} MB.`,
      });
      event.target.value = "";
      return;
    }

    const mergedFiles = mergeSelectedFiles(selectedFiles, incomingFiles);

    if (mergedFiles.length > MAX_FILES) {
      setStatus({
        type: "error",
        message: `Solo puedes adjuntar hasta ${MAX_FILES} imágenes.`,
      });
      event.target.value = "";
      return;
    }

    setSelectedFiles(mergedFiles);
    setStatus(null);
    event.target.value = "";
  }

  async function cleanupUploads(submissionId: string, paths: string[]) {
    if (!paths.length) {
      return;
    }

    try {
      await fetch("/api/requests/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          paths,
        }),
      });
    } catch {
      // Best-effort cleanup for partially uploaded files.
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFiles.length) {
      setStatus({
        type: "error",
        message: "Adjunta al menos una imagen para continuar.",
      });
      return;
    }

    const form = event.currentTarget;
    const fullName = String(new FormData(form).get("fullName") ?? "").trim();
    const clientCode = String(new FormData(form).get("clientCode") ?? "").trim();
    const phone = String(new FormData(form).get("phone") ?? "").trim();
    const email = String(new FormData(form).get("email") ?? "").trim();

    const payload = {
      fullName,
      clientCode,
      phone,
      email,
      files: selectedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    };

    let preparedUpload: PreparedUpload | null = null;
    const uploadedPaths: string[] = [];
    setIsSubmitting(true);
    setStatus(null);

    try {
      const supabase = await createBrowserSupabaseClient();

      setProgressMessage("Preparando la carga segura...");

      const prepareResponse = await fetch("/api/requests/uploads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const prepareData = (await prepareResponse.json()) as
        | PreparedUpload
        | { error?: string };

      if (
        !prepareResponse.ok ||
        !("uploads" in prepareData) ||
        !("submissionId" in prepareData)
      ) {
        throw new Error(
          ("error" in prepareData ? prepareData.error : undefined) ??
            "No fue posible preparar la solicitud.",
        );
      }

      preparedUpload = prepareData;

      for (const upload of preparedUpload.uploads) {
        const file = selectedFiles[upload.sortOrder];

        setProgressMessage(
          `Subiendo imagen ${upload.sortOrder + 1} de ${selectedFiles.length}...`,
        );

        const { error } = await supabase.storage
          .from(upload.bucket)
          .uploadToSignedUrl(upload.path, upload.token, file, {
            contentType: upload.contentType,
          });

        if (error) {
          throw new Error(`Falló la carga del archivo "${upload.fileName}".`);
        }

        uploadedPaths.push(upload.path);
      }

      setProgressMessage("Registrando la solicitud...");

      const finalizeResponse = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          clientCode,
          phone,
          email,
          submissionId: preparedUpload.submissionId,
          files: preparedUpload.uploads.map((file) => ({
            path: file.path,
            fileName: file.fileName,
            contentType: file.contentType,
            sizeBytes: file.sizeBytes,
            sortOrder: file.sortOrder,
          })),
        }),
      });

      const finalizeData = (await finalizeResponse.json()) as {
        error?: string;
        requestId?: string;
      };

      if (!finalizeResponse.ok || !finalizeData.requestId) {
        throw new Error(
          finalizeData.error ??
            "No fue posible completar el registro de la solicitud.",
        );
      }

      form.reset();
      clearSelectedFiles();
      setStatus({
        type: "success",
        message: `Solicitud enviada correctamente. Código de referencia: ${shortenId(finalizeData.requestId)}.`,
      });
    } catch (error) {
      if (preparedUpload) {
        await cleanupUploads(preparedUpload.submissionId, uploadedPaths);
      }

      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No fue posible procesar la solicitud.",
      });
    } finally {
      setIsSubmitting(false);
      setProgressMessage(null);
    }
  }

  return (
    <section className="rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_24px_60px_rgba(15,35,62,0.10)] sm:p-7">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
          Formulario público
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Completa los datos del cliente y carga las imágenes de respaldo. Este
          envío permite adjuntar varias fotografías en una sola solicitud.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="text-sm font-semibold text-slate-700"
          >
            Nombre completo
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="Nombre completo del cliente"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="clientCode"
            className="text-sm font-semibold text-slate-700"
          >
            Número/Código del cliente
          </label>
          <input
            id="clientCode"
            name="clientCode"
            type="text"
            required
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="Ejemplo: 157896"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-semibold text-slate-700"
            >
              Número de teléfono
              <span className="ml-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Opcional
              </span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              disabled={isSubmitting}
              className={inputClassName}
              placeholder="+504 9999-9999"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-slate-700"
            >
              Correo electrónico
              <span className="ml-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                Opcional
              </span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              disabled={isSubmitting}
              className={inputClassName}
              placeholder="cliente@correo.com"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Fotografías de respaldo
            </label>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Máximo {MAX_FILES} archivos · {MAX_FILE_SIZE_MB} MB c/u
            </p>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center transition hover:border-brand hover:bg-brand/5">
            <Paperclip className="h-6 w-6 text-brand" />
            <span className="mt-3 text-sm font-semibold text-ink">
              Seleccionar imágenes
            </span>
            <span className="mt-2 text-sm text-slate-500">
              Puedes seguir agregando archivos hasta completar el límite.
            </span>
            <input
              ref={fileInputRef}
              name="images"
              type="file"
              multiple
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              disabled={isSubmitting}
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {selectedFiles.length ? (
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {selectedFiles.length} archivo(s) seleccionado(s)
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Tamaño total aproximado: {formatFileSize(totalSize)}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
                  onClick={clearSelectedFiles}
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {selectedFiles.map((file) => (
                  <div
                    key={getFileKey(file)}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{file.name}</p>
                      <p className="mt-1 text-slate-500">
                        {file.type || "Imagen"} · {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {progressMessage ? (
          <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {progressMessage}
          </div>
        ) : null}

        {status ? (
          <div
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
              status.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Procesando solicitud..." : "Enviar solicitud"}
        </button>
      </form>
    </section>
  );
}
