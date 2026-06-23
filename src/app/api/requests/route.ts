import { NextResponse } from "next/server";

import { createSubmission } from "@/lib/submissions";
import { isSubmissionStoragePath } from "@/lib/storage";
import { finalizeSubmissionSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = finalizeSubmissionSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Revisa los datos e intenta nuevamente.",
        },
        { status: 400 },
      );
    }

    const { submissionId, files } = parsed.data;
    const paths = files.map((file) => file.path);

    if (
      paths.some((path) => !isSubmissionStoragePath(submissionId, path)) ||
      new Set(paths).size !== paths.length
    ) {
      return NextResponse.json(
        { error: "La carga de archivos no es válida para esta solicitud." },
        { status: 400 },
      );
    }

    const result = await createSubmission({
      submissionId,
      fullName: parsed.data.fullName,
      clientCode: parsed.data.clientCode,
      phone: parsed.data.phone,
      email: parsed.data.email,
      files,
    });

    return NextResponse.json({
      requestId: result.id,
      message: "Solicitud recibida correctamente.",
    });
  } catch (error) {
    console.error("Failed to finalize submission", error);

    return NextResponse.json(
      {
        error:
          "No fue posible registrar la solicitud. Intenta nuevamente en unos minutos.",
      },
      { status: 500 },
    );
  }
}
