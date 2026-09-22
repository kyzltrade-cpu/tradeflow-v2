// API Route: Quote Validation with Citations
// POST /api/quotes/validate — Validate a quote before sending
// GET /api/quotes/validate?id=xxx — Get validation status for a quote

import { NextRequest, NextResponse } from 'next/server';
import { validateQuote, formatValidationSummary, saveValidationResult } from '@/lib/quote-validation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — Check validation status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quoteId = searchParams.get('id');

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID required' }, { status: 400 });
    }

    const { data: quote } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Get cost components
    const { data: costComponents } = await supabase
      .from('quote_cost_components')
      .select('*')
      .eq('quote_id', quoteId)
      .order('sort_order');

    // Get supplier quotes (line items)
    const { data: supplierQuotes } = await supabase
      .from('supplier_quotes')
      .select('*')
      .eq('company_id', quote.company_id);

    // Build validation input
    const validationInput = {
      id: quote.id,
      company_id: quote.company_id,
      inquiry_id: quote.inquiry_id,
      customer_id: quote.customer_id,
      status: quote.status,
      currency: quote.currency,
      incoterm: quote.incoterm || 'FOB',
      valid_until: quote.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      terms: quote.terms || [],
      lines: (supplierQuotes || []).map((sq: any) => ({
        id: sq.id,
        product_name: sq.product_name || sq.description || 'Unknown',
        quantity: sq.quantity || 0,
        unit_price: sq.unit_price || 0,
        currency: sq.currency || 'USD',
        total: (sq.quantity || 0) * (sq.unit_price || 0),
        source_citation: null // Will be loaded from citation_sources
      })),
      costComponents: (costComponents || []).map((cc: any) => ({
        id: cc.id,
        name: cc.name,
        amount: cc.amount || 0,
        currency: cc.currency || 'USD',
        source_type: cc.source_type || 'internal_estimate',
        source_detail: cc.source_detail || '',
        confidence: cc.confidence || 0.5,
        is_estimate: cc.is_estimate || false
      })),
      totalAmount: quote.total_amount || 0,
      marginPercentage: quote.margin_percentage || 0
    };

    // Get company's minimum margin
    const { data: company } = await supabase
      .from('companies')
      .select('default_margin_percentage')
      .eq('id', quote.company_id)
      .single();

    const minMargin = company?.default_margin_percentage || 5;

    // Run validation
    const result = await validateQuote(validationInput, quote.company_id, minMargin);

    // Save result
    await saveValidationResult(quoteId, result);

    return NextResponse.json({
      quoteId,
      ...result,
      summary: formatValidationSummary(result)
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST — Validate and fix issues
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quoteId, companyId, action } = body;

    if (!quoteId || !companyId) {
      return NextResponse.json({ error: 'quoteId and companyId required' }, { status: 400 });
    }

    if (action === 're-validate') {
      // Re-run validation after user fixes issues
      const { data: quote } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (!quote) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
      }

      // Reload and validate
      const { data: costComponents } = await supabase
        .from('quote_cost_components')
        .select('*')
        .eq('quote_id', quoteId);

      const { data: supplierQuotes } = await supabase
        .from('supplier_quotes')
        .select('*')
        .eq('company_id', companyId);

      const validationInput = {
        id: quote.id,
        company_id: quote.company_id,
        inquiry_id: quote.inquiry_id,
        customer_id: quote.customer_id,
        status: quote.status,
        currency: quote.currency,
        incoterm: quote.incoterm || 'FOB',
        valid_until: quote.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        terms: quote.terms || [],
        lines: (supplierQuotes || []).map((sq: any) => ({
          id: sq.id,
          product_name: sq.product_name || 'Unknown',
          quantity: sq.quantity || 0,
          unit_price: sq.unit_price || 0,
          currency: sq.currency || 'USD',
          total: (sq.quantity || 0) * (sq.unit_price || 0),
          source_citation: null
        })),
        costComponents: (costComponents || []).map((cc: any) => ({
          id: cc.id,
          name: cc.name,
          amount: cc.amount || 0,
          currency: cc.currency || 'USD',
          source_type: cc.source_type || 'internal_estimate',
          source_detail: cc.source_detail || '',
          confidence: cc.confidence || 0.5,
          is_estimate: cc.is_estimate || false
        })),
        totalAmount: quote.total_amount || 0,
        marginPercentage: quote.margin_percentage || 0
      };

      const { data: company } = await supabase
        .from('companies')
        .select('default_margin_percentage')
        .eq('id', companyId)
        .single();

      const result = await validateQuote(validationInput, companyId, company?.default_margin_percentage || 5);
      await saveValidationResult(quoteId, result);

      return NextResponse.json({
        quoteId,
        ...result,
        summary: formatValidationSummary(result)
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
