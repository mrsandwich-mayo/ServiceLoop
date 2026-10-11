import { User, getIdTokenResult } from 'firebase/auth';

export interface AdminSession {
  uid: string;
  email: string;
  name: string;
  role: 'super_admin' | 'platform_admin';
  authenticatedAt: string;
  token?: string;
  hasAdminClaim: boolean;
}

export const PRIMARY_ADMIN_EMAIL = 'abdullah.csc2004@gmail.com';
export const ADMIN_SESSION_KEY = 'serviceloop_admin_session';

/**
 * Validates whether a Firebase Auth user has the trusted server-assigned `admin: true` custom claim.
 * Checks the decoded ID token claims directly from Firebase Authentication.
 */
export async function verifyAdminClaim(user: User | null, forceRefresh = false): Promise<boolean> {
  if (!user) return false;
  try {
    const tokenResult = await getIdTokenResult(user, forceRefresh);
    return tokenResult.claims.admin === true;
  } catch (err) {
    console.error('Failed to retrieve or verify ID token claims:', err);
    return false;
  }
}

/**
 * Extracts a verified AdminSession object from an authenticated Firebase User,
 * ONLY IF the user possesses the server-assigned `admin: true` custom claim.
 * Returns null if the claim is missing or verification fails.
 */
export async function extractVerifiedAdminSession(
  user: User | null,
  forceRefresh = false
): Promise<AdminSession | null> {
  if (!user) return null;
  try {
    const tokenResult = await getIdTokenResult(user, forceRefresh);
    if (tokenResult.claims.admin !== true) {
      return null;
    }

    return {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || (user.email ? user.email.split('@')[0] : 'Administrator'),
      role: 'super_admin',
      authenticatedAt: user.metadata.lastSignInTime || new Date().toISOString(),
      token: tokenResult.token,
      hasAdminClaim: true,
    };
  } catch (err) {
    console.error('Failed to extract admin session:', err);
    return null;
  }
}

/**
 * Clears any legacy administrative session markers from storage
 */
export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {}
}

/**
 * Legacy accessor preserved for backward compatibility.
 * Strictly returns null to prevent browser storage or client-side bypass.
 */
export function getAdminSession(): AdminSession | null {
  return null;
}

/**
 * Admin authentication check must be evaluated via useAdminAuth hook or verifyAdminClaim()
 */
export function isAdminAuthenticated(): boolean {
  return false;
}

