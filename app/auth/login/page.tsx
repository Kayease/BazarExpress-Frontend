"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/app-provider';

export default function LoginPage() {
  const router = useRouter();
  const { setIsLoginOpen } = useAppContext();

  useEffect(() => {
    // Redirect to home page and open login modal
    router.push('/');
    setIsLoginOpen(true);
  }, [router, setIsLoginOpen]);

  return null; // This page immediately redirects
}
