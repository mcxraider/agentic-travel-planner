'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  // Hide navbar on itinerary page (it has its own integrated header)
  if (pathname?.startsWith('/itinerary')) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 z-50 p-4">
      <Link
        href="/"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 backdrop-blur-sm border shadow-sm hover:shadow-md hover:bg-white transition-all group"
      >
        <Compass className="h-5 w-5 text-blue-600 group-hover:rotate-45 transition-transform" />
        <span className="font-bold text-lg text-gray-900">Wandr</span>
      </Link>
    </nav>
  );
}
