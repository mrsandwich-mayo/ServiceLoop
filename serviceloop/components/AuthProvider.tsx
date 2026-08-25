'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnboarded: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isOnboarded: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const res = await fetch(`/api/business?uid=${currentUser.uid}`);
          const data = await res.json();
          
          if (res.ok && data.exists) {
            setIsOnboarded(true);
          } else {
            setIsOnboarded(false);
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          setIsOnboarded(false);
        }
      } else {
        setIsOnboarded(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/register';
    
    if (!user && !isAuthRoute) {
      router.push('/login');
    } else if (user && !isOnboarded && pathname !== '/onboarding') {
      router.push('/onboarding');
    } else if (user && isOnboarded && (isAuthRoute || pathname === '/onboarding' || pathname === '/')) {
      router.push('/dashboard');
    }
  }, [user, loading, isOnboarded, pathname, router]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isOnboarded, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
