import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { hashPassword, signToken, generateApiKey } from "@/lib/auth";
import { getUserStore } from "@/lib/user-store";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = RegisterSchema.parse(body);

    const store = await getUserStore();

    const existing = await store.findUserByEmail(data.email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);
    const apiKey = generateApiKey();

    const user = await store.createUser({
      id: crypto.randomUUID(),
      email: data.email,
      passwordHash,
      name: data.name,
      apiKey,
      plan: "FREE",
    });

    const token = signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, apiKey: user.apiKey, plan: user.plan },
      token,
    }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION", details: e.issues.map((x: { message: string }) => x.message) },
        { status: 400 }
      );
    }
    console.error("[register]", e);
    return NextResponse.json({ error: "Internal error", code: "INTERNAL" }, { status: 500 });
  }
}
