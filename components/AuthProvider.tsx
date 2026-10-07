'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreErrors';
import { usePathname, useRouter } from 'next/navigation';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  isDemo?: boolean;
  isCustomAuth?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isOnboarded: boolean;
  signOut: () => Promise<void>;
  checkOnboarded: () => Promise<void>;
  signInAsDemo: (name?: string, businessName?: string) => void;
  signInWithCustomAccount: (customUser: AppUser) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isOnboarded: false,
  signOut: async () => {},
  checkOnboarded: async () => {},
  signInAsDemo: () => {},
  signInWithCustomAccount: () => {},
});

const DEMO_STORAGE_KEY = 'serviceloop_demo_user';
const DEMO_BUSINESS_KEY = 'serviceloop_demo_business';
const AUTH_USER_STORAGE_KEY = 'serviceloop_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Deterministic initial state to prevent SSR/client hydration mismatch
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const checkBusinessStatus = async (currentUser: { uid: string }) => {
    try {
      const docRef = doc(db, 'businesses', currentUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setIsOnboarded(true);
        return;
      }

      // Check fallback API
      const res = await fetch(`/api/business?uid=${currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setIsOnboarded(Boolean(data.exists));
      } else {
        setIsOnboarded(false);
      }
    } catch (error: unknown) {
      console.warn('Error checking business onboarding status, retrying:', error);
      try {
        handleFirestoreError(error, OperationType.GET, `businesses/${currentUser.uid}`);
      } catch {
        setIsOnboarded(false);
      }
    }
  };

  useEffect(() => {
    let active = true;

    // Load demo user or custom registered user in a microtask after initial hydration
    queueMicrotask(() => {
      if (!active) return;
      if (typeof window !== 'undefined') {
        const storedAuth = localStorage.getItem(AUTH_USER_STORAGE_KEY);
        if (storedAuth) {
          try {
            const parsed = JSON.parse(storedAuth);
            setUser(parsed);
            setIsOnboarded(true);
            setLoading(false);
            return;
          } catch {
            localStorage.removeItem(AUTH_USER_STORAGE_KEY);
          }
        }

        const storedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
        if (storedDemo) {
          try {
            const parsed = JSON.parse(storedDemo);
            setUser(parsed);
            setIsOnboarded(true);
            setLoading(false);
            return;
          } catch {
            localStorage.removeItem(DEMO_STORAGE_KEY);
          }
        }
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          isDemo: false,
        });
        await checkBusinessStatus(currentUser);
      } else {
        const demoStored = typeof window !== 'undefined' ? localStorage.getItem(DEMO_STORAGE_KEY) : null;
        const authStored = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_STORAGE_KEY) : null;
        if (!demoStored && !authStored) {
          setUser(null);
          setIsOnboarded(false);
        }
      }

      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/register';
    const isPublicRoute = pathname === '/' || isAuthRoute;

    // Do NOT redirect unauthenticated users away from public routes like '/'
    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && !isOnboarded && pathname !== '/onboarding' && pathname !== '/' && pathname !== '/register') {
      router.push('/onboarding');
    } else if (user && isOnboarded && isAuthRoute) {
      router.push('/dashboard');
    }
  }, [user, loading, isOnboarded, pathname, router]);

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
    await firebaseSignOut(auth);
    setUser(null);
    setIsOnboarded(false);
    router.push('/login');
  };

  const signInWithCustomAccount = (customUser: AppUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(customUser));
    }
    setUser(customUser);
    setIsOnboarded(true);
    router.push('/dashboard');
  };

  const signInAsDemo = (name = 'Rajesh Kumar', businessName = 'Apex Electrical & Facility Services') => {
    const demoUser: AppUser = {
      uid: 'demo_user_serviceloop',
      email: 'demo@serviceloop.in',
      displayName: name,
      isDemo: true,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
      const existingBiz = localStorage.getItem(DEMO_BUSINESS_KEY);
      if (!existingBiz) {
        localStorage.setItem(
          DEMO_BUSINESS_KEY,
          JSON.stringify({
            ownerId: demoUser.uid,
            businessName,
            ownerName: name,
            businessType: 'Electrical & Facility Care',
            location: 'Bengaluru, Karnataka',
            phone: '+91 98765 43210',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        );
      }
    }
    setUser(demoUser);
    setIsOnboarded(true);
    router.push('/dashboard');
  };

  const checkOnboarded = async () => {
    if (user && !user.isDemo && !user.isCustomAuth) {
      await checkBusinessStatus(user);
    } else if (user?.isDemo || user?.isCustomAuth) {
      setIsOnboarded(true);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOnboarded, signOut, checkOnboarded, signInAsDemo, signInWithCustomAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
