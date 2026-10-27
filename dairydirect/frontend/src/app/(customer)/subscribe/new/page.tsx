"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

function NewSubscriptionContent() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return null;
}

export default function NewSubscriptionScreen() {
  return (
    <Suspense fallback={null}>
      <NewSubscriptionContent />
    </Suspense>
  );
}
