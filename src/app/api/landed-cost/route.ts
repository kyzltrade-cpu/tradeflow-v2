import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateCosts, getExchangeRate, type CostInputs } from '@/lib/cost-calculator';
import { DEMO_COMPANY_ID } from '@/lib/workflow/rfq';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/landed-cost — load a selected supplier quote, compute landed cost +
// margin, and persist a cost_calculations row
export async function POST(request: NextRequest) {
  try {
    const { supplierQuoteId, orderQuantity, targetCurrency, targetMargin } = await request.json();

    if (!supplierQuoteId || !orderQuantity) {
      return NextResponse.json({ error: 'supplierQuoteId and orderQuantity are required' }, { status: 400 });
    }

    const { data: quote } = await supabase
      .from('supplier_quotes')
      .select('*')
      .eq('id', supplierQuoteId)
      .single();

    if (!quote) return NextResponse.json({ error: 'Supplier quote not found' }, { status: 404 });

    // Resolve opportunity/company via the rfq -> batch chain
    let opportunityId: string | null = quote.opportunity_id || null;
    let companyId: string | null = null;
    if (quote.supplier_rfq_id) {
      const { data: rfq } = await supabase
        .from('supplier_rfqs')
        .select('batch_id')
        .eq('id', quote.supplier_rfq_id)
        .single();
      if (rfq?.batch_id) {
        const { data: batch } = await supabase
          .from('supplier_rfq_batches')
          .select('opportunity_id, company_id')
          .eq('id', rfq.batch_id)
          .single();
        opportunityId = opportunityId || batch?.opportunity_id || null;
        companyId = batch?.company_id || null;
      }
    }

    // 1. Get exchange rate from quote currency -> USD
    const exchangeRate = await getExchangeRate(quote.currency || 'USD', 'USD');

    // 2. Default cost inputs
    const costs: CostInputs = {
      unit_price: Number(quote.unit_price),
      currency: quote.currency || 'USD',
      moq: Number(quote.moq || 0),
      quantity: Number(orderQuantity),
      tooling_cost: Number(quote.tooling_cost || 0),
      sample_cost: Number(quote.sample_cost || 0),
      packaging_cost: Number(quote.packaging_cost || 0),
      incoterm: quote.incoterm || 'FOB',
      estimated_freight_per_unit: 0.5,
      insurance_rate: 0.3,
      duty_rate: 0,
      vat_rate: 0,
      exchange_rate: exchangeRate,
      target_currency: targetCurrency || 'USD',
      customer_exchange_rate: 1,
      target_margin_percentage: targetMargin || 20,
      minimum_margin_percentage: 10,
      order_quantity: Number(orderQuantity),
    };

    // 3. Compute
    const result = calculateCosts(costs);

    // 4. Persist
    const { data: saved, error } = await supabase
      .from('cost_calculations')
      .insert({
        opportunity_id: opportunityId,
        comparison_id: null,
        formula_version: '1.0',
        currency: costs.target_currency,
        inputs_json: {
          ...costs,
          supplier_quote_id: quote.id,
          supplier_rfq_id: quote.supplier_rfq_id,
        },
        outputs_json: result,
        warnings_json: result.warnings,
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      calculationId: saved.id,
      breakdown: result,
      exchangeRate,
      opportunityId,
      companyId,
    });
  } catch (error: any) {
    console.error('Landed cost error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compute landed cost' },
      { status: 500 }
    );
  }
}