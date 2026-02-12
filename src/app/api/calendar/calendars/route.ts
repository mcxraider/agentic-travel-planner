import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      // Graceful degradation: return demo data when not authenticated
      return NextResponse.json({
        items: [
          {
            id: 'primary',
            summary: 'My Calendar (Demo)',
            primary: true,
          },
        ],
        _demo: true,
      });
    }

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      // On auth failure, return demo data
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          items: [
            {
              id: 'primary',
              summary: 'My Calendar (Demo)',
              primary: true,
            },
          ],
          _demo: true,
        });
      }
      return NextResponse.json(
        { error: 'Failed to fetch calendars' },
        { status: response.status }
      );
    }

    const data = await response.json();

    const items = (data.items || []).map(
      (cal: { id: string; summary: string; primary?: boolean; backgroundColor?: string }) => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary || false,
        backgroundColor: cal.backgroundColor,
      })
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      {
        items: [
          {
            id: 'primary',
            summary: 'My Calendar (Demo)',
            primary: true,
          },
        ],
        _demo: true,
      }
    );
  }
}
