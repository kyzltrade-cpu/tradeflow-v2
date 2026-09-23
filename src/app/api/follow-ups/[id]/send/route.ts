import { NextRequest, NextResponse } from 'next/server';
import { approveAndSendFollowUp } from '@/lib/workflow/follow-ups';

// POST /api/follow-ups/[id]/send — approve a due follow-up and send it
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { customMessage } = await request.json().catch(() => ({}));
    const result = await approveAndSendFollowUp(id, undefined, customMessage);
    if (!result.sent) {
      return NextResponse.json({ error: result.error || 'Send failed' }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Follow-up send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send follow-up' },
      { status: 500 }
    );
  }
}