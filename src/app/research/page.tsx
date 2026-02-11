'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressBar } from '@/components/planning';
import { Card } from '@/components/ui/card';
import { useTripStore } from '@/store';
import { MOCK_RESEARCH_INPUT } from '@/lib/mock-data';
import { Loader2 } from 'lucide-react';

const STEP_RESEARCH = 3;

const RESEARCH_STAGES = [
  'Analyzing preferences...',
  'Searching activities...',
  'Finding locations...',
  'Building itinerary...',
];

const STAGE_INTERVAL = 1200; // ms per stage
const TOTAL_DURATION = 5000; // ms before redirect

export default function ResearchPage() {
  const router = useRouter();
  const { tripData, setPhase } = useTripStore();
  const [stageIndex, setStageIndex] = useState(0);

  // Use trip store data if available, otherwise fall back to mock
  const destination = tripData?.destination ?? MOCK_RESEARCH_INPUT.trip_details.destination;
  const startDate = tripData?.startDate
    ? new Date(tripData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : MOCK_RESEARCH_INPUT.trip_details.travel_dates.start;
  const endDate = tripData?.endDate
    ? new Date(tripData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : MOCK_RESEARCH_INPUT.trip_details.travel_dates.end;

  // Cycle through research stages
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % RESEARCH_STAGES.length);
    }, STAGE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Auto-redirect after duration
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPhase('planning');
      router.push('/select');
    }, TOTAL_DURATION);

    return () => clearTimeout(timeout);
  }, [setPhase, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <ProgressBar currentStep={STEP_RESEARCH} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Researching Your Trip</h1>
            <p className="text-muted-foreground">
              {destination} &middot; {startDate} - {endDate}
            </p>
          </div>

          <Card className="p-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />

              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground transition-all duration-300">
                  {RESEARCH_STAGES[stageIndex]}
                </p>
                <p className="text-sm text-muted-foreground">
                  Finding the best options based on your preferences
                </p>
              </div>

              {/* Stage indicators */}
              <div className="flex gap-2">
                {RESEARCH_STAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                      i <= stageIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
