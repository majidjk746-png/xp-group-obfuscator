import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword, signToken } from "@/lib/auth";
import { getUserStore } from "@/lib/user-store";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = LoginSchema.parse(body);

    const store = await getUserStore();
    const user = await store.findUserByEmail(data.email);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials", code: "AUTH_FAILED" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials", code: "AUTH_FAILED" },
        { status: 401 }
      );
    }

    const token = signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, apiKey: user.apiKey, plan: user.plan },
      token,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION" },
        { status: 400 }
      );
    }
    console.error("[login]", e);
    return NextResponse.json({ error: "Internal error", code: "INTERNAL" }, { status: 500 });
  }
}
