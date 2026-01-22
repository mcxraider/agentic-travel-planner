import { Hero, ProblemStatement, CTASection } from '@/components/landing';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <ProblemStatement />
      <CTASection />
    </main>
  );
}
