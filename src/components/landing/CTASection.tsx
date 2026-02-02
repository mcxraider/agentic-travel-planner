'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useServerHealth } from '@/hooks/use-server-health';

export function CTASection() {
  const { status } = useServerHealth();
  const isServerAvailable = status === 'healthy';

  return (
    <section className="py-20 px-4 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to plan your next adventure?</h2>
        <p className="text-muted-foreground mb-8">
          Start a conversation with our AI and watch your perfect itinerary come together.
        </p>
        {isServerAvailable ? (
          <Link href="/plan">
            <Button size="lg" variant="default">
              Get Started
            </Button>
          </Link>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="lg" variant="default" disabled>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Get Started
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Service temporarily unavailable. Please try again later.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </section>
  );
}
