import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRfqBatch, DEMO_COMPANY_ID } from '@/lib/workflow/rfq';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/rfq-batches — create an RFQ batch from an opportunity + suppliers,
// drafting one outbound email per supplier (pending approval)
export async function POST(request: NextRequest) {
  try {
    const { opportunityId, supplierIds, responseDeadline, disclosurePolicy } = await request.json();

    if (!opportunityId || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return NextResponse.json(
        { error: 'opportunityId and supplierIds[] are required' },
        { status: 400 }
      );
    }

    const result = await createRfqBatch({ opportunityId, supplierIds, responseDeadline, disclosurePolicy });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('RFQ batch create error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create RFQ batch' },
      { status: 500 }
    );
  }
}

// GET /api/rfq-batches — list real batches with suppliers + responses
export async function GET() {
  try {
    const { data: batches } = await supabase
      .from('supplier_rfq_batches')
      .select('*')
      .eq('company_id', DEMO_COMPANY_ID)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!batches) return NextResponse.json({ batches: [] });

    const batchIds = batches.map((b) => b.id);

    const { data: rfqs } = await supabase
      .from('supplier_rfqs')
      .select('*')
      .in('batch_id', batchIds);

    const supplierIds = Array.from(new Set((rfqs || []).map((r) => r.supplier_id)));
    const { data: suppliers } = supplierIds.length
      ? await supabase.from('suppliers').select('id, legal_name, contact_name')
      : { data: [] };

    const supplierMap = new Map((suppliers || []).map((s) => [s.id, s]));

    const { data: responses } = await supabase
      .from('supplier_responses')
      .select('supplier_rfq_id, status, extraction_confidence, created_at')
      .in(
        'supplier_rfq_id',
        (rfqs || []).length ? (rfqs as any[]).map((r) => r.id) : ['']
      );

    const respByRfq = new Map();
    (responses || []).forEach((res) => {
      if (!respByRfq.has(res.supplier_rfq_id)) respByRfq.set(res.supplier_rfq_id, []);
      respByRfq.get(res.supplier_rfq_id).push(res);
    });

    const enriched = batches.map((batch) => {
      const batchRfqs = (rfqs || []).filter((r) => r.batch_id === batch.id).map((r) => ({
        ...r,
        supplier: supplierMap.get(r.supplier_id) || null,
        responses: respByRfq.get(r.id) || [],
      }));
      return {
        ...batch,
        rfqs: batchRfqs,
        responded: batchRfqs.filter((r) => r.status === 'response_received').length,
      };
    });

    return NextResponse.json({ batches: enriched });
  } catch (error: any) {
    console.error('RFQ batches fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch RFQ batches' },
      { status: 500 }
    );
  }
}