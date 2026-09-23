import { createClient } from '@supabase/supabase-js';
import { callNimJson } from '@/lib/ai/nim';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ExtractedResponseField {
  field_key: string;
  raw_value?: string;
  normalized_value?: string;
  currency?: string;
  unit?: string;
  confidence: number;
}

export interface ExtractedResponse {
  fields: ExtractedResponseField[];
  comparability_status: string;
  overall_confidence: number;
}

// Step 13: normalize raw supplier response text into structured fields
export async function extractSupplierResponse(rawText: string): Promise<ExtractedResponse> {
  if (!process.env.NIM_API_KEY) {
    const fallback: ExtractedResponse = {
      fields: [{ field_key: 'raw_text', raw_value: rawText.slice(0, 5000), normalized_value: rawText.slice(0, 5000), confidence: 1 }],
      comparability_status: 'needs_review',
      overall_confidence: 0,
    };
    return fallback;
  }

  const res = await callNimJson<ExtractedResponse>([
    {
      role: 'system',
      content: `You normalize supplier quotation responses for a HK sourcing company.
Return JSON with EXACTLY this shape:
{
  "fields": [{"field_key": never, "raw_value": never, "normalized_value": never, "currency": never, "unit": never, "confidence": number}],
  "comparability_status": "comparable" | "incomplete" | "quote_only" | "declined",
  "overall_confidence": number
}
Use field keys from this controlled vocabulary only:
unit_price, currency, incoterm, moq, lead_time_days, payment_terms, certifications, packaging_cost, tooling_cost, sample_cost, production_lead_time_days, quantity_breaks, notes.
Put true price in unit_price, its currency in currency; MOQ as integer string; lead_time_days as integer. Never fabricate numbers — if absent, mark confidence low (0.1-0.4) and leave normalized_value empty.`,
    },
    { role: 'user', content: rawText.slice(0, 12000) },
  ], { temperature: 0.1 });

  return res;
}

// Persist a parsed response under a supplier_rfq; derives supplier_quote
export async function ingestSupplierResponse(input: {
  supplierRfqId: string;
  rawText: string;
  extract?: ExtractedResponse;
}): Promise<{ responseId: string; quoteId?: string }> {
  const { data: rfq } = await supabase
    .from('supplier_rfqs')
    .select('id, supplier_id, batch_id')
    .eq('id', input.supplierRfqId)
    .single();

  if (!rfq) throw new Error('Supplier RFQ not found');

  const extracted = input.extract || (await extractSupplierResponse(input.rawText));

  const { data: response, error: respErr } = await supabase
    .from('supplier_responses')
    .insert({
      supplier_rfq_id: rfq.id,
      status: extracted.comparability_status === 'incomplete' ? 'incomplete' : 'received',
      comparability_status: extracted.comparability_status,
      raw_response_text: input.rawText,
      normalized_data_json: extracted,
      extraction_confidence: extracted.overall_confidence,
    })
    .select('id')
    .single();

  if (respErr || !response) throw respErr || new Error('Failed to save response');

  const fieldRows = extracted.fields.map((f) => ({
    supplier_response_id: response.id,
    field_key: f.field_key,
    raw_value: f.raw_value,
    normalized_value: f.normalized_value,
    currency: f.currency || null,
    unit: f.unit || null,
    confidence: f.confidence,
  }));
  await supabase.from('supplier_response_fields').insert(fieldRows);

  // Update RFQ status
  await supabase
    .from('supplier_rfqs')
    .update({ status: 'response_received', response_received_at: new Date().toISOString() })
    .eq('id', rfq.id);

  // Derive a supplier_quote when we have a unit price
  const priceField = extracted.fields.find((f) => f.field_key === 'unit_price');
  let quoteId: string | undefined;
  if (priceField?.normalized_value) {
    const { data: opp } = await supabase
      .from('supplier_rfq_batches')
      .select('opportunity_id')
      .eq('id', rfq.batch_id)
      .single();

    const leadField = extracted.fields.find((f) => f.field_key === 'lead_time_days');
    const payField = extracted.fields.find((f) => f.field_key === 'payment_terms');
    const moqField = extracted.fields.find((f) => f.field_key === 'moq');
    const incotermField = extracted.fields.find((f) => f.field_key === 'incoterm');

    const { data: quote, error: quoteErr } = await supabase
      .from('supplier_quotes')
      .insert({
        company_id: '',
        supplier_rfq_id: rfq.id,
        supplier_id: rfq.supplier_id,
        opportunity_id: opp?.opportunity_id || null,
        unit_price: parseFloat(priceField.normalized_value),
        currency: priceField.currency || extracted.fields.find((f) => f.field_key === 'currency')?.normalized_value || 'USD',
        moq: moqField?.normalized_value ? parseInt(moqField.normalized_value) : null,
        production_lead_time_days: leadField?.normalized_value ? parseInt(leadField.normalized_value) : null,
        payment_terms: payField?.normalized_value || null,
        incoterm: incotermField?.normalized_value || null,
        status: 'submitted',
      })
      .select('id')
      .single();

    if (!quoteErr && quote) {
      quoteId = quote.id;
      // Update with the missing company_id now that we have it via join
      const { data: batchRow } = await supabase
        .from('supplier_rfq_batches')
        .select('company_id, opportunity_id')
        .eq('id', rfq.batch_id)
        .single();
      if (batchRow?.company_id) {
        await supabase.from('supplier_quotes').update({ company_id: batchRow.company_id, opportunity_id: batchRow.opportunity_id }).eq('id', quote.id);
      }
    }
  }

  return { responseId: response.id, quoteId };
}