import { NextRequest, NextResponse } from 'next/server';
import { selectSupplier } from '@/lib/workflow/comparison';

// POST /api/comparisons/[id]/select — select the winning supplier
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supplierId } = await request.json();
    if (!supplierId) {
      return NextResponse.json({ error: 'supplierId is required' }, { status: 400 });
    }
    await selectSupplier(id, supplierId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Supplier selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to select supplier' },
      { status: 500 }
    );
  }
}