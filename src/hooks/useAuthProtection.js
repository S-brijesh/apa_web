// hooks/useAuthProtection.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth2 } from '../app/lib/firebase2'; 

export default function useAuthProtection() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true); // 👈 Add this

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth2, (user) => {
      if (!user) {
        router.replace('/login');
      } else {
        setCheckingAuth(false); // ✅ Only allow render when user is authenticated
      }
    });

    return () => unsubscribe();
  }, [router]);

  return checkingAuth;
}
