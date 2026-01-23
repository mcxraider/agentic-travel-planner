import { NextRequest, NextResponse } from 'next/server';
import { Itinerary, ValidationResult } from '@/types';
import { validateItinerary } from '@/lib/mock-data/mock-conflicts';

interface ValidateEditRequestBody {
  itinerary: Itinerary;
}

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  const body: ValidateEditRequestBody = await request.json();
  const { itinerary } = body;

  // Simulate API delay (1-2 seconds for "AI processing")
  await delay(1000 + Math.random() * 1000);

  // Validate the itinerary
  const result: ValidationResult = validateItinerary(itinerary);

  return NextResponse.json(result);
}
