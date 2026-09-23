import { NextRequest, NextResponse } from 'next/server';
import { fetchRecentEmails, getHistoryId } from '@/lib/composio/gmail';

// GET /api/gmail/sync - Fetch recent Gmail messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('max') || '20', 10);

    const [messages, historyId] = await Promise.all([
      fetchRecentEmails(maxResults),
      getHistoryId(),
    ]);

    return NextResponse.json({
      messages,
      historyId,
      count: messages.length,
    });
  } catch (error: any) {
    console.error('Gmail sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync Gmail' },
      { status: 500 }
    );
  }
}
