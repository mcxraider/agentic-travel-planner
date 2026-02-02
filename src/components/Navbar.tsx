'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, User } from 'lucide-react';
import { HealthStatusIndicator } from './HealthStatusIndicator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserProfileModal } from './UserProfileModal';
import { useTripStore } from '@/store';

export function Navbar() {
  const pathname = usePathname();
  const { userProfile } = useTripStore();
  const [profileOpen, setProfileOpen] = useState(false);

  // Hide navbar on itinerary and plan pages
  if (pathname?.startsWith('/itinerary') || pathname?.startsWith('/plan')) {
    return null;
  }

  // Get user initials for avatar
  const initials = userProfile.user_name
    ? userProfile.user_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
        {/* Logo - Left side */}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 backdrop-blur-sm border shadow-sm hover:shadow-md hover:bg-white transition-all group"
        >
          <Compass className="h-5 w-5 text-blue-600 group-hover:rotate-45 transition-transform" />
          <span className="font-bold text-lg text-gray-900">Trippi</span>
          <HealthStatusIndicator className="ml-1" />
        </Link>

        {/* Profile Button - Right side */}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white/80 backdrop-blur-sm border shadow-sm hover:shadow-md hover:bg-white h-10 w-10"
          onClick={() => setProfileOpen(true)}
          title={userProfile.user_name || 'Set up your profile'}
        >
          {initials ? (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>
      </nav>

      <UserProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
