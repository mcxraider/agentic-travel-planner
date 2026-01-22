import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
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
        <Link href="/plan">
          <Button size="lg" className="text-lg px-8 py-6">
            Start Planning
          </Button>
        </Link>
      </div>
    </section>
  );
}
