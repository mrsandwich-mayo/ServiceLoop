'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Business } from '@/types/business';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  business: Business | null;
  loading: boolean;
  isOnboarded: boolean;
  signOut: () => Promise<void>;
  checkOnboarded: () => Promise<boolean>;
  signInAsDemo: (name?: string, businessName?: string) => void;
  registerLocalAccount: (accountData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    businessName: string;
    businessType: string;
    location: string;
  }) => { success: boolean; error?: string };
  loginLocalAccount: (email: string, password: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  business: null,
  loading: true,
  isOnboarded: false,
  signOut: async () => {},
  checkOnboarded: async () => false,
  signInAsDemo: () => {},
  registerLocalAccount: () => ({ success: false }),
  loginLocalAccount: () => ({ success: false }),
});

const DEMO_STORAGE_KEY = 'serviceloop_demo_user';
const DEMO_BUSINESS_KEY = 'serviceloop_demo_business';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  /**
   * Look up the business whose ownerId equals the authenticated Firebase UID.
   */
  const checkBusinessStatus = async (uid: string): Promise<boolean> => {
    try {
      // 1. Direct document lookup in 'businesses' by UID (default V1 tenant key)
      const docRef = doc(db, 'businesses', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Business;
        setBusiness(data);
        setIsOnboarded(true);
        return true;
      }

      // 2. Query lookup by ownerId == uid
      const q = query(collection(db, 'businesses'), where('ownerId', '==', uid));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const d = querySnap.docs[0];
        const data = { id: d.id, ...d.data() } as Business;
        setBusiness(data);
        setIsOnboarded(true);
        return true;
      }

      // No business profile exists for this authenticated UID
      setBusiness(null);
      setIsOnboarded(false);
      return false;
    } catch (error: unknown) {
      console.warn('Error checking business onboarding status in Firestore:', error);
      setBusiness(null);
      setIsOnboarded(false);
      return false;
    }
  };

  useEffect(() => {
    let active = true;

    // Firebase Auth is the authoritative source of identity
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!active) return;

      if (firebaseUser) {
        // Authenticated with real Firebase Auth
        if (typeof window !== 'undefined') {
          localStorage.removeItem(DEMO_STORAGE_KEY);
        }

        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          isDemo: false,
        };
        setUser(appUser);
        await checkBusinessStatus(firebaseUser.uid);
        if (active) setLoading(false);
      } else {
        // Check if demo preview session is active
        let demoActive = false;
        if (typeof window !== 'undefined') {
          const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
          if (storedDemo) {
            try {
              const parsed = JSON.parse(storedDemo);
              if (parsed?.isDemo) {
                demoActive = true;
                setUser(parsed);
                setIsOnboarded(true);
                const demoBiz = localStorage.getItem(DEMO_BUSINESS_KEY);
                if (demoBiz) {
                  try {
                    setBusiness(JSON.parse(demoBiz));
                  } catch {}
                }
              }
            } catch {
              localStorage.removeItem(DEMO_STORAGE_KEY);
            }
          }
        }

        if (!demoActive && active) {
          setUser(null);
          setBusiness(null);
          setIsOnboarded(false);
        }
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/register';
    const isPublicRoute = pathname === '/' || isAuthRoute;

    // 1. Unauthenticated users cannot access protected routes
    if (!user && !isPublicRoute) {
      router.push('/login');
    }
    // 2. Authenticated users with NO business profile must complete onboarding
    else if (user && !isOnboarded && pathname !== '/onboarding' && pathname !== '/') {
      router.push('/onboarding');
    }
    // 3. Authenticated users with an existing business profile should be in the dashboard
    else if (user && isOnboarded && (isAuthRoute || pathname === '/onboarding')) {
      router.push('/dashboard');
    }
  }, [user, loading, isOnboarded, pathname, router]);

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      localStorage.removeItem(DEMO_BUSINESS_KEY);
    }
    await firebaseSignOut(auth);
    setUser(null);
    setBusiness(null);
    setIsOnboarded(false);
    router.push('/login');
  };

  const checkOnboarded = async (): Promise<boolean> => {
    if (user && !user.isDemo) {
      return await checkBusinessStatus(user.uid);
    } else if (user?.isDemo) {
      setIsOnboarded(true);
      return true;
    }
    return false;
  };

  const signInAsDemo = (name = 'Rajesh Kumar', businessName = 'Apex Electrical & Facility Services') => {
    const demoUser: AppUser = {
      uid: 'demo_user_serviceloop',
      email: 'demo@serviceloop.in',
      displayName: name,
      isDemo: true,
    };
    const demoBusiness: Business = {
      ownerId: demoUser.uid,
      businessName,
      ownerName: name,
      businessType: 'Electrical & Facility Care',
      location: 'Bengaluru, Karnataka',
      phone: '+91 98765 43210',
      verificationStatus: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
      localStorage.setItem(DEMO_BUSINESS_KEY, JSON.stringify(demoBusiness));
    }

    setUser(demoUser);
    setBusiness(demoBusiness);
    setIsOnboarded(true);
    router.push('/dashboard');
  };

  const registerLocalAccount = (accountData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    businessName: string;
    businessType: string;
    location: string;
  }): { success: boolean; error?: string } => {
    if (typeof window === 'undefined') return { success: false, error: 'Window not available' };

    const normEmail = accountData.email.trim().toLowerCase();
    const ACCOUNTS_KEY = 'serviceloop_registered_accounts';
    let accounts: Array<{
      uid: string;
      email: string;
      passwordHash: string;
      user: AppUser;
      business: Business;
    }> = [];

    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (raw) accounts = JSON.parse(raw);
    } catch {}

    if (accounts.some((a) => a.email.toLowerCase() === normEmail)) {
      return { success: false, error: 'An account with this email already exists. Please log in instead.' };
    }

    const uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const appUser: AppUser = {
      uid,
      email: accountData.email.trim(),
      displayName: accountData.name.trim(),
      isDemo: true, // enables client-side CRM functionality without cloud auth failure
    };

    const newBusiness: Business = {
      id: uid,
      ownerId: uid,
      businessName: accountData.businessName.trim(),
      ownerName: accountData.name.trim(),
      businessType: accountData.businessType.trim(),
      location: accountData.location.trim(),
      phone: accountData.phone.trim(),
      email: accountData.email.trim(),
      verificationStatus: 'PENDING_VERIFICATION',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    accounts.push({
      uid,
      email: normEmail,
      passwordHash: btoa(accountData.password),
      user: appUser,
      business: newBusiness,
    });
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(appUser));
    localStorage.setItem(DEMO_BUSINESS_KEY, JSON.stringify(newBusiness));
    localStorage.setItem(`serviceloop_registered_business_${uid}`, JSON.stringify(newBusiness));

    setUser(appUser);
    setBusiness(newBusiness);
    setIsOnboarded(true);

    return { success: true };
  };

  const loginLocalAccount = (
    emailInput: string,
    passwordInput: string
  ): { success: boolean; error?: string } => {
    if (typeof window === 'undefined') return { success: false, error: 'Window not available' };

    const normEmail = emailInput.trim().toLowerCase();
    const ACCOUNTS_KEY = 'serviceloop_registered_accounts';
    let accounts: Array<{
      uid: string;
      email: string;
      passwordHash: string;
      user: AppUser;
      business: Business;
    }> = [];

    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (raw) accounts = JSON.parse(raw);
    } catch {}

    const found = accounts.find((a) => a.email.toLowerCase() === normEmail);
    if (!found) {
      return {
        success: false,
        error: 'No business account found with this email. Please register below.',
      };
    }

    if (found.passwordHash !== btoa(passwordInput)) {
      return {
        success: false,
        error: 'Incorrect password for this account. Please check your credentials.',
      };
    }

    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(found.user));
    localStorage.setItem(DEMO_BUSINESS_KEY, JSON.stringify(found.business));
    localStorage.setItem(`serviceloop_registered_business_${found.uid}`, JSON.stringify(found.business));

    setUser(found.user);
    setBusiness(found.business);
    setIsOnboarded(true);

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        loading,
        isOnboarded,
        signOut,
        checkOnboarded,
        signInAsDemo,
        registerLocalAccount,
        loginLocalAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
