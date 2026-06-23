import { NextResponse } from "next/server";

import { getSupabasePublicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { url, anonKey } = getSupabasePublicEnv();

    return NextResponse.json(
      {
        url,
        anonKey,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Missing public Supabase configuration.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
