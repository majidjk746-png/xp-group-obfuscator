import { NextResponse } from "next/server";

export async function GET() {
  const dbVars: Record<string, string> = {};
  for (const [key, val] of Object.entries(process.env)) {
    if (key.includes("DATABASE") || key.includes("POSTGRES") || key.includes("PG")) {
      dbVars[key] = val ? val.slice(0, 40) + "..." : "(empty)";
    }
  }
  return NextResponse.json(dbVars, {
    headers: { "Cache-Control": "no-store" },
  });
}
