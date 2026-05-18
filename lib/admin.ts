export const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "bagman250@gmail.com";

export function isAdminEmail(email?: string | null) {
  return Boolean(email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
}
