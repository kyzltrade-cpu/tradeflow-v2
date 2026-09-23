import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildComparison, selectSupplier, type ComparisonCandidate } from '@/lib/workflow/comparison';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/comparisons/[id] — fetch an opportunity's comparison
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: comp } = await supabase.from('supplier_comparisons').select('*').eq('id', id).single();
    if (!comp) return NextResponse.json({ error: 'Comparison not found' }, { status: 404 });

    const rec = (comp.recommendation_json || {}) as Record<string, any>;
    return NextResponse.json({
      comparison: comp,
      candidates: (rec.candidates as ComparisonCandidate[]) || [],
      reasoning: rec.reasoning || null,
      recommendedSupplierId: rec.recommended_supplier_id || null,
      riskNotes: rec.risk_notes || [],
    });
  } catch (error: any) {
    console.error('Comparison fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch comparison' }, { status: 500 });
  }
}