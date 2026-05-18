import { NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ profile: null }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ profile: null });
    }

    const data = snapshot.docs[0].data();

    return NextResponse.json({
      profile: {
        name: data.name || data.displayName || "Vendedor",
        photoURL: data.photoURL || "",
        createdAt: data.createdAt?.toMillis?.() || null,
      },
    });
  } catch (error) {
    console.warn("No se pudo cargar perfil publico de vendedor:", error);
    return NextResponse.json({ profile: null });
  }
}
