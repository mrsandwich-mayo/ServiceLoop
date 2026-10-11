'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  User as FirebaseUser,
  getIdTokenResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  AdminSession, 
  PRIMARY_ADMIN_EMAIL,
  extractVerifiedAdminSession,
  clearAdminSession
} from '@/lib/adminAuth';

export function useAdminAuth(requireAuth = true) {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimError, setClaimError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!active) return;

      if (!firebaseUser) {
        setAdmin(null);
        setClaimError(null);
        setLoading(false);
        if (requireAuth) {
          router.replace('/admin/login');
        }
        return;
      }

      try {
        // ID token claims verification from Firebase Auth
        const verifiedSession = await extractVerifiedAdminSession(firebaseUser, false);
        if (!active) return;

        if (verifiedSession) {
          setAdmin(verifiedSession);
          setClaimError(null);
        } else {
          // Authenticated in Firebase Auth, but missing server-assigned `admin: true` claim
          setAdmin(null);
          setClaimError("Access denied: Authenticated account does not possess the 'admin: true' custom claim.");
          if (requireAuth) {
            router.replace('/admin/login?error=unauthorized_claim');
          }
        }
      } catch (err) {
        console.error('Error verifying admin authorization:', err);
        if (!active) return;
        setAdmin(null);
        setClaimError('Failed to verify administrative authorization.');
        if (requireAuth) {
          router.replace('/admin/login');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [requireAuth, router]);

  // If already authenticated with verified admin claim and visiting /admin/login, redirect to /admin
  useEffect(() => {
    if (!loading && admin && admin.hasAdminClaim && !requireAuth) {
      router.replace('/admin');
    }
  }, [loading, admin, requireAuth, router]);

  const loginAsAdmin = async (
    email: string,
    passkey: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setClaimError(null);

      // 1. Authenticate with real Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), passkey);
      const user = userCredential.user;

      // 2. Force token refresh to fetch the latest server-assigned custom claims
      const tokenResult = await getIdTokenResult(user, true);

      // 3. Strictly verify the server-assigned custom claim 'admin: true'
      if (tokenResult.claims.admin !== true) {
        // Revoke active session on client to prevent unauthorized access
        await firebaseSignOut(auth);
        clearAdminSession();
        setAdmin(null);
        const errMsg = "Access denied: Account is authenticated, but is missing the server-assigned 'admin: true' custom claim. Contact the platform administrator.";
        setClaimError(errMsg);
        setLoading(false);
        return { success: false, error: errMsg };
      }

      const verifiedSession: AdminSession = {
        uid: user.uid,
        email: user.email || email.trim(),
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'Administrator'),
        role: 'super_admin',
        authenticatedAt: user.metadata.lastSignInTime || new Date().toISOString(),
        token: tokenResult.token,
        hasAdminClaim: true,
      };

      setAdmin(verifiedSession);
      setClaimError(null);
      setLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setLoading(false);
      let message = 'Failed to authenticate administrator credentials.';
      if (err instanceof Error) {
        const msg = err.message;
        if (
          msg.includes('auth/invalid-credential') || 
          msg.includes('auth/wrong-password') || 
          msg.includes('auth/user-not-found')
        ) {
          message = 'Invalid administrator credentials. Please check your email and password.';
        } else if (msg.includes('auth/too-many-requests')) {
          message = 'Too many failed login attempts. Access temporarily restricted. Try again later.';
        } else if (msg.includes('auth/invalid-email')) {
          message = 'Invalid administrator email format.';
        } else if (msg) {
          message = msg;
        }
      }
      return { success: false, error: message };
    }
  };

  const logoutAdmin = async () => {
    clearAdminSession();
    await firebaseSignOut(auth);
    setAdmin(null);
    setClaimError(null);
    router.replace('/admin/login');
  };

  return {
    admin,
    loading,
    isAdmin: !!admin && admin.hasAdminClaim,
    claimError,
    primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
    loginAsAdmin,
    logoutAdmin,
  };
}

