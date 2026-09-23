import { NextRequest, NextResponse } from 'next/server';
import { buildComparison } from '@/lib/workflow/comparison';

// POST /api/comparisons — build/refresh a comparison for an opportunity
export async function POST(request: NextRequest) {
  try {
    const { opportunityId } = await request.json();
    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 });
    }
    const result = await buildComparison(opportunityId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Comparison build error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to build comparison' },
      { status: 500 }
    );
  }
}