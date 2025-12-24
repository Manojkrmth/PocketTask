
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingScreen } from '@/components/loading-screen';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cmadmin/dashboard');
  }, [router]);

  return <LoadingScreen />;
}
