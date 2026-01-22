import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Placeholder mock response
  return NextResponse.json({
    day_number: body.day_number || 1,
    options: [],
    message: 'Mock day generation - implementation coming soon',
  });
}
