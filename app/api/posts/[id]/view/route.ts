import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebaseAdmin";

function timeout(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("view_timeout")), ms);
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ ok: false, error: "post_id_required" }, { status: 400 });
  }

  try {
    const adminDb = getAdminDb();

    await Promise.race([
      adminDb.collection("posts").doc(id).update({
        views: FieldValue.increment(1),
        lastViewedAt: Date.now(),
      }),
      timeout(2500),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error registrando vista:", error);

    return NextResponse.json({
      ok: false,
      warning: "view_not_registered",
    });
  }
}
