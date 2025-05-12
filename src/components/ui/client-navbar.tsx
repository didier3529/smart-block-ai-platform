'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { useEffect, useState } from 'react';

export function ClientNavbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render during SSR to avoid hydration mismatches
  if (!mounted) {
    return null;
  }
  
  // Don't show navbar on dashboard routes
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }
  
  return <Navbar />;
} 