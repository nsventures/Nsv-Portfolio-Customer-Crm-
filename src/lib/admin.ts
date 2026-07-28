export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'prateek@nsventures.in').toLowerCase()

export function isAllowedAdminEmail(email: string | null | undefined) {
  return email?.toLowerCase() === ADMIN_EMAIL
}
