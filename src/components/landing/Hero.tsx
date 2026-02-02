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

export function Hero() {
  const { status } = useServerHealth();
  const isServerAvailable = status === 'healthy';

  return (
    <section className="py-20 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          Plan Your Trip in Minutes, Not Hours
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          AI-powered trip planning that understands your preferences. Create detailed day-by-day
          itineraries through simple conversation.
        </p>
        {isServerAvailable ? (
          <Link href="/plan">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Planning
            </Button>
          </Link>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="lg" className="text-lg px-8 py-6" disabled>
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Start Planning
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
