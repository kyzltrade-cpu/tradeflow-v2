import { NextResponse } from 'next/server';
import { listDueFollowUps } from '@/lib/workflow/follow-ups';
import { DEMO_COMPANY_ID } from '@/lib/workflow/rfq';

// GET /api/follow-ups — due follow-up instances pending approval
export async function GET() {
  try {
    const items = await listDueFollowUps(DEMO_COMPANY_ID, true);
    return NextResponse.json({ followUps: items });
  } catch (error: any) {
    console.error('Follow-ups fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load follow-ups' },
      { status: 500 }
    );
  }
}