import { createClient } from '@supabase/supabase-js';
import { callNimJson } from '@/lib/ai/nim';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ComparisonCandidate {
  supplierId: string;
  supplierName: string;
  unitPrice?: number;
  currency?: string;
  incoterm?: string;
  moq?: number;
  leadTimeDays?: number;
  paymentTerms?: string;
  certifications?: string;
  totalLanded?: number;
  extractionConfidence?: number;
  notes?: string;
}

// Step 14: build a comparison for an opportunity from all submitted supplier quotes
export async function buildComparison(opportunityId: string): Promise<{ comparisonId: string; candidates: ComparisonCandidate[] }> {
  const { data: quotes } = await supabase
    .from('supplier_quotes')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .in('status', ['submitted', 'shortlisted', 'selected']);

  const supplierIds = Array.from(new Set((quotes || []).map((q) => q.supplier_id)));
  const { data: suppliers } = supplierIds.length
    ? await supabase.from('suppliers').select('id, legal_name, certifications, performance_score')
    : { data: [] };
  const supplierMap = new Map((suppliers || []).map((s) => [s.id, s]));

  const rfpNote = (q: any) => q.notes || null;

  const candidates: ComparisonCandidate[] = (quotes || []).map((q) => {
    const s = supplierMap.get(q.supplier_id);
    return {
      supplierId: q.supplier_id,
      supplierName: s?.legal_name || 'Unknown Supplier',
      unitPrice: q.unit_price !== null ? Number(q.unit_price) : undefined,
      currency: q.currency || 'USD',
      incoterm: q.incoterm || undefined,
      moq: q.moq || undefined,
      leadTimeDays: q.production_lead_time_days || undefined,
      paymentTerms: q.payment_terms || undefined,
      certifications: s?.certifications?.join(', ') || undefined,
      extractionConfidence: undefined,
      notes: rfpNote(q),
      totalLanded: undefined,
    };
  });

  // Sort by unit price; undefined prices last
  candidates.sort((a, b) => {
    const pa = a.unitPrice ?? Infinity;
    const pb = b.unitPrice ?? Infinity;
    return pa - pb;
  });

  // Upsert a comparison record
  const { data: existing } = await supabase
    .from('supplier_comparisons')
    .select('id')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const recommendation = await draftRecommendation(opportunityId, candidates);

  if (existing) {
    await supabase
      .from('supplier_comparisons')
      .update({ status: 'ready_for_review', recommendation_json: recommendation })
      .eq('id', existing.id);
    return { comparisonId: existing.id, candidates };
  }

  const { data: opp } = await supabase.from('opportunities').select('*').eq('id', opportunityId).single();

  const { data: comp, error } = await supabase
    .from('supplier_comparisons')
    .insert({
      opportunity_id: opportunityId,
      requirement_version_id: opp?.inquiry_id ? undefined : undefined,
      status: 'ready_for_review',
      recommendation_json: recommendation,
    })
    .select('id')
    .single();

  if (error || !comp) throw error || new Error('Failed to create comparison');

  return { comparisonId: comp.id, candidates };
}

// AI recommendation (or deterministic fallback)
async function draftRecommendation(opportunityId: string, candidates: ComparisonCandidate[]): Promise<Record<string, unknown>> {
  if (process.env.NIM_API_KEY && candidates.length > 0) {
    try {
      const res = await callNimJson<{ reasoning: string; recommended_supplier_id?: string; risk_notes: string[] }>(
        [
          {
            role: 'system',
            content: `You are a HK sourcing manager selecting the best supplier bid.
Return JSON: {"reasoning": string, "recommended_supplier_id": string|null, "risk_notes": string[]}.
Base the recommendation on unit price, lead time, MOQ, payment terms, and certifications shown. If no clear winner, set recommended_supplier_id to null.`,
          },
          {
            role: 'user',
            content: `Candidates:\n${JSON.stringify(candidates, null, 2)}`,
          },
        ],
        { temperature: 0.1 }
      );
      return { reasoning: res.reasoning, recommended_supplier_id: res.recommended_supplier_id || null, risk_notes: res.risk_notes, candidates };
    } catch (err) {
      console.error('Recommendation AI failed:', err);
    }
  }

  const best = candidates.find((c) => c.unitPrice !== undefined);
  return {
    reasoning: best
      ? `Lowest unit price: ${best.supplierName} at ${best.currency} ${best.unitPrice}.`
      : 'No complete quotes yet for automated recommendation.',
    recommended_supplier_id: best?.supplierId || null,
    risk_notes: [],
    candidates,
  };
}

// Select a winning supplier
export async function selectSupplier(comparisonId: string, supplierId: string): Promise<boolean> {
  const { data: comp } = await supabase
    .from('supplier_comparisons')
    .select('*')
    .eq('id', comparisonId)
    .single();

  if (!comp) throw new Error('Comparison not found');

  await supabase
    .from('supplier_comparisons')
    .update({ status: 'supplier_selected', selected_supplier_id: supplierId })
    .eq('id', comparisonId);

  await supabase.from('supplier_quotes').update({ is_selected: false, status: 'rejected' }).eq('opportunity_id', comp.opportunity_id);
  await supabase.from('supplier_quotes').update({ is_selected: true, status: 'selected' }).eq('supplier_id', supplierId).eq('opportunity_id', comp.opportunity_id);

  await supabase.from('opportunities').update({ stage: 'quote_draft' }).eq('id', comp.opportunity_id);

  return true;
}