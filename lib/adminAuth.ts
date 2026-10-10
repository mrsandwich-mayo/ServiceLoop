export interface AdminSession {
  email: string;
  name: string;
  role: 'super_admin' | 'platform_admin';
  authenticatedAt: string;
  token: string;
}

export const PRIMARY_ADMIN_EMAIL = 'abdullah.csc2004@gmail.com';
export const ADMIN_SESSION_KEY = 'serviceloop_admin_session';

/**
 * Returns current admin session from storage if valid
 */
export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (session && session.email && (session.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() || session.role === 'super_admin')) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Stores admin session in persistent local storage
 */
export function setAdminSession(session: AdminSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

/**
 * Clears current admin session
 */
export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

/**
 * Quick check if client is authenticated as administrator
 */
export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}
