import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/opportunities/[id]/won — mark opportunity won, snapshot the winning
// supplier/quote, and emit an order-handoff audit event (no orders table in 001/002)
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: opp } = await supabase
      .from('opportunities')
      .select('*, inquiries(id, subject, sender_name, sender_email), customers(legal_name, email, contact_name)')
      .eq('id', id)
      .single();

    if (!opp) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });

    // Winning supplier quote
    const { data: selectedQuote } = await supabase
      .from('supplier_quotes')
      .select('*, suppliers(legal_name)')
      .eq('opportunity_id', id)
      .eq('is_selected', true)
      .maybeSingle();

    const { data: comparison } = await supabase
      .from('supplier_comparisons')
      .select('*')
      .eq('opportunity_id', id)
      .eq('status', 'supplier_selected')
      .maybeSingle();

    const { data: calc } = await supabase
      .from('cost_calculations')
      .select('*')
      .eq('opportunity_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from('opportunities').update({ stage: 'won', status: 'won', updated_at: new Date().toISOString() }).eq('id', id);

    const handoff: Record<string, unknown> = {
      opportunity_reference: opp.reference_number,
      customer: {
        name: (opp.customers as any)?.contact_name || (opp.customers as any)?.legal_name || opp.sender_name || null,
        email: (opp.customers as any)?.email || opp.sender_email || null,
      },
      inquiry_subject: (opp.inquiries as any)?.subject || null,
      winning_supplier: (selectedQuote?.suppliers as any)?.legal_name || null,
      supplier_quote_id: selectedQuote?.id || null,
      unit_price: selectedQuote?.unit_price ?? null,
      currency: selectedQuote?.currency || 'USD',
      incoterm: selectedQuote?.incoterm || null,
      moq: selectedQuote?.moq ?? null,
      payment_terms: selectedQuote?.payment_terms || null,
      landed_cost_per_unit: (calc?.outputs_json as any)?.total_cost_per_unit ?? null,
      recommended_selling_price: (calc?.outputs_json as any)?.recommended_selling_price ?? null,
      comparison_id: comparison?.id || null,
      comparison_recommendation: comparison?.recommendation_json || null,
    };

    const { data: event, error } = await supabase
      .from('audit_events')
      .insert({
        company_id: opp.company_id,
        entity_type: 'opportunity',
        entity_id: id,
        action: 'order_handoff',
        actor_name: 'system',
        details_json: { handoff, marked_won_at: new Date().toISOString() },
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      stage: 'won',
      handoffEventId: event.id,
      handoff,
    });
  } catch (error: any) {
    console.error('Opportunity won error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark opportunity won' },
      { status: 500 }
    );
  }
}