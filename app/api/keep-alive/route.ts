import { NextResponse } from "next/server";
import { getSupabase, hasSupabaseEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured" },
      { status: 503 }
    );
  }

  const { count, error } = await getSupabase()
    .from("items")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ totalRecords: count ?? 0 });
}
