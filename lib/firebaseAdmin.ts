import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function initFirebaseAdmin() {
  if (getApps().length) return;

  const serviceAccountBase64 =
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64;

  if (!serviceAccountBase64) {
    throw new Error("Falta FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64");
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, "base64").toString("utf8")
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getAdminDb() {
  initFirebaseAdmin();
  return getFirestore();
}
