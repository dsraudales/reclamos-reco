import { NextResponse } from "next/server";

import { getAdminUserForRoute } from "@/lib/auth";
import { getDownloadUrl } from "@/lib/storage";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const user = await getAdminUserForRoute();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { fileId } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: file, error } = await supabase
    .from("submission_files")
    .select("*")
    .eq("id", fileId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch file record", error);
    return NextResponse.json(
      { error: "No fue posible localizar el archivo." },
      { status: 500 },
    );
  }

  if (!file) {
    return NextResponse.json(
      { error: "Archivo no encontrado." },
      { status: 404 },
    );
  }

  const signedUrl = await getDownloadUrl(
    file.storage_bucket,
    file.storage_path,
    file.file_name,
  );
  return NextResponse.redirect(signedUrl);
}
