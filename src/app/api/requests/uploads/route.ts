import { NextResponse } from "next/server";

import { createUploadPlan } from "@/lib/storage";
import { prepareUploadsSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = prepareUploadsSchema.safeParse(payload);

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

    const submissionId = crypto.randomUUID();
    const uploads = await createUploadPlan(submissionId, parsed.data.files);

    return NextResponse.json({
      submissionId,
      uploads,
    });
  } catch (error) {
    console.error("Failed to prepare uploads", error);

    return NextResponse.json(
      { error: "No fue posible preparar la carga de imágenes." },
      { status: 500 },
    );
  }
}
