'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the debugger components
const NavigationDebugger = dynamic(
  () => import('./navigation-debugger').then(mod => mod.NavigationDebugger),
  { ssr: false }
);

const AuthDebugger = dynamic(
  () => import('./auth-debugger').then(mod => mod.AuthDebugger),
  { ssr: false }
);

export function ClientDebuggers() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <NavigationDebugger />
      <AuthDebugger />
    </>
  );
} 