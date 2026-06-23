import { NextResponse } from "next/server";

import { deleteObjects, isSubmissionStoragePath } from "@/lib/storage";
import { cleanupUploadsSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = cleanupUploadsSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const safePaths = parsed.data.paths.filter((path) =>
      isSubmissionStoragePath(parsed.data.submissionId, path),
    );

    await deleteObjects(safePaths);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to clean orphaned uploads", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
