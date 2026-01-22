import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-20 px-4 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to plan your next adventure?</h2>
        <p className="text-muted-foreground mb-8">
          Start a conversation with our AI and watch your perfect itinerary come together.
        </p>
        <Link href="/plan">
          <Button size="lg" variant="default">
            Get Started
          </Button>
        </Link>
      </div>
    </section>
  );
}
