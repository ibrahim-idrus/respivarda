export const runtime = "nodejs";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { feedback, feedbackStatusEnum } from "@/src/db/schema";

// ponytail: no auth on triage mutations. ceiling: anyone can change status.
// upgrade: clerk role check. See route.ts ponytail.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (
    typeof b.status !== "string" ||
    !(feedbackStatusEnum.enumValues as readonly string[]).includes(b.status)
  ) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const [updated] = await db
    .update(feedback)
    .set({
      status: b.status as (typeof feedbackStatusEnum.enumValues)[number],
      updatedAt: new Date(),
    })
    .where(eq(feedback.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Laporan tidak ditemukan" },
      { status: 404 },
    );
  }
  return NextResponse.json(updated);
}
