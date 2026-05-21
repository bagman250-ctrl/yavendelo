import type { User } from "firebase/auth";
import { doc, type Firestore, getDoc } from "firebase/firestore";

type UserProfile = {
  name?: string;
  displayName?: string;
  nombre?: string;
};

function isUsableName(value?: string | null) {
  const cleanValue = value?.trim();
  return Boolean(cleanValue && !cleanValue.includes("@"));
}

export async function getNotificationActorName(db: Firestore, user: User) {
  try {
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const profile = profileSnap.exists() ? (profileSnap.data() as UserProfile) : null;
    const profileName = profile?.name || profile?.displayName || profile?.nombre;

    if (isUsableName(profileName)) return profileName?.trim() || "Alguien";
  } catch (error) {
    console.error("Error obteniendo nombre para notificacion:", error);
  }

  if (isUsableName(user.displayName)) return user.displayName?.trim() || "Alguien";

  return "Alguien";
}

export function hideEmailsFromNotification(text?: string) {
  return (text || "Tienes actividad nueva.").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "Alguien");
}
