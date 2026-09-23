import { NextRequest, NextResponse } from 'next/server';
import { ingestSupplierResponse, extractSupplierResponse } from '@/lib/workflow/responses';

// POST /api/responses — ingest a raw supplier response, extract structured
// fields, and persist normalized data + derived supplier quote
export async function POST(request: NextRequest) {
  try {
    const { supplierRfqId, rawText } = await request.json();

    if (!supplierRfqId || !rawText) {
      return NextResponse.json({ error: 'supplierRfqId and rawText are required' }, { status: 400 });
    }

    const extracted = await extractSupplierResponse(rawText);
    const result = await ingestSupplierResponse({ supplierRfqId, rawText, extract: extracted });

    return NextResponse.json({
      success: true,
      ...result,
      extraction: extracted,
    });
  } catch (error: any) {
    console.error('Response ingest error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to ingest supplier response' },
      { status: 500 }
    );
  }
}