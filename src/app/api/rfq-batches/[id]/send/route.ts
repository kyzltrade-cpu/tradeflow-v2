import { NextRequest, NextResponse } from 'next/server';
import { approveAndSendBatch } from '@/lib/workflow/rfq';

// POST /api/rfq-batches/[id]/send — approve + send all pending RFQ drafts in a batch
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await approveAndSendBatch(id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('RFQ batch send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send RFQ batch' },
      { status: 500 }
    );
  }
}