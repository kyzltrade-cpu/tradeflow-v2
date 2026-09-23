import { createClient } from '@supabase/supabase-js';
import { callNimJson } from '@/lib/ai/nim';
import { sendEmail } from '@/lib/composio/gmail';

export const DEMO_COMPANY_ID = 'de16b018-a635-4b45-a5ee-101dea1d66a1';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const DEFAULT_DISCLOSURE = {
  customer_name_hidden: true,
  quantity_visible: true,
  destination_visible: true,
  incoterm: 'FOB',
};

export interface RfqCreateInput {
  opportunityId: string;
  supplierIds: string[];
  responseDeadline?: string;
  disclosurePolicy?: Record<string, unknown>;
}

export function buildRfqReference(seq: number): string {
  const y = new Date().getFullYear().toString().slice(-2);
  return `TF-RFQ-${y}-${String(seq).padStart(4, '0')}`;
}

// Build an RFQ email body for one supplier. Uses AI when available,
// otherwise a deterministic English template.
export async function draftRfqBody(input: {
  supplier: any;
  opportunity: any;
  inquiry: any;
  requirementVersion: any;
  disclosurePolicy: Record<string, unknown>;
  referenceNumber: string;
  responseDeadline?: string;
}): Promise<{ body: string; reasoning?: string; citations?: string[] }> {
  const { supplier, opportunity, inquiry, requirementVersion, referenceNumber } = input;
  const snapshot: Record<string, unknown> =
    (requirementVersion?.snapshot_json as Record<string, unknown>) || {};
  const lineItems: string[] = [];
  const items = snapshot.items;
  if (Array.isArray(items)) {
    items.forEach((it: any, idx: number) => {
      lineItems.push(
        `${idx + 1}. ${it.product || it.description || 'Item'} — Qty ${it.quantity ?? 'TBD'}${
          it.details ? ` (${it.details})` : ''
        }`
      );
    });
  } else {
    const keys = ['product_name', 'quantity', 'specifications', 'target_price', 'moq', 'destination'];
    for (const k of keys) {
      const v = snapshot[k] ?? (inquiry as any)?.[k];
      if (v) lineItems.push(`- ${k.replace(/_/g, ' ')}: ${v}`);
    }
  }

  const companyRef = opportunity?.reference_number || referenceNumber;

  if (process.env.NIM_API_KEY) {
    try {
      const res = await callNimJson<{ body: string; reasoning: string }>(
        [
          {
            role: 'system',
            content: `You are a HK sourcing manager drafting a professional, concise RFQ email to a supplier.
Return JSON: {"body": string, "reasoning": string}.
Rules: address the supplier contact by name if known; list requirements clearly; state the response deadline; keep it short and friendly; no fabricated details beyond provided data.`,
          },
          {
            role: 'user',
            content: `Supplier: ${supplier.legal_name}${supplier.location ? ` (${supplier.location})` : ''}
Contact: ${supplier.contact_name || 'N/A'}

Requirements:
${lineItems.map((l) => `  ${l}`).join('\n')}

Response deadline: ${input.responseDeadline || 'TBD'}
Internal ref: ${companyRef}
Please request: unit price (FOB/EXW), MOQ, lead time, payment terms, certifications, and packaging options.`,
          },
        ],
        { temperature: 0.2 }
      );
      return { body: res.body, reasoning: res.reasoning };
    } catch (err) {
      console.error('RFQ draft AI failed:', err);
    }
  }

  const body = [
    `Dear ${supplier.contact_name || supplier.legal_name},`,
    '',
    `We are a Hong Kong sourcing company and currently have a requirement for the following items. We would appreciate your quotation:`,
    '',
    ...lineItems,
    '',
    `Please provide your best unit price (FOB/EXW), MOQ, lead time, payment terms, relevant certifications, and packaging options.`,
    `Our target response deadline is ${input.responseDeadline || 'upon availability'}.`,
    '',
    `Reference: ${companyRef}`,
    '',
    `Thank you and best regards,`,
    `Sourcing Team`,
  ].join('\n');

  return { body };
}

// Create an RFQ batch + per-supplier RFQ rows + outbound email drafts
export async function createRfqBatch(input: RfqCreateInput): Promise<{ batchId: string; drafts: { id: string; supplierId: string }[] }> {
  const { data: opp } = await supabase.from('opportunities').select('*').eq('id', input.opportunityId).single();
  if (!opp) throw new Error('Opportunity not found');

  const { data: inquiry } = opp.inquiry_id
    ? await supabase.from('inquiries').select('*').eq('id', opp.inquiry_id).single()
    : { data: null };

  const { data: rv } = opp.inquiry_id
    ? await supabase
        .from('requirement_versions')
        .select('*')
        .eq('inquiry_id', opp.inquiry_id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()
    : { data: null };

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .in('id', input.supplierIds);

  if (!suppliers || suppliers.length === 0) throw new Error('No valid suppliers');

  const { count } = await supabase
    .from('supplier_rfq_batches')
    .select('id', { count: 'exact' })
    .eq('company_id', DEMO_COMPANY_ID);
  const referenceNumber = buildRfqReference((count ?? 0) + 1);

  const { data: batch, error: batchErr } = await supabase
    .from('supplier_rfq_batches')
    .insert({
      company_id: DEMO_COMPANY_ID,
      reference_number: referenceNumber,
      opportunity_id: input.opportunityId,
      requirement_version_id: rv?.id || null,
      status: 'draft',
      response_deadline: input.responseDeadline || null,
      disclosure_policy_json: input.disclosurePolicy || DEFAULT_DISCLOSURE,
    })
    .select('id')
    .single();

  if (batchErr || !batch) throw batchErr || new Error('Failed to create batch');

  const rfqRows = suppliers.map((s) => ({ batch_id: batch.id, supplier_id: s.id, status: 'draft' }));
  const { data: rfqs, error: rfqErr } = await supabase
    .from('supplier_rfqs')
    .insert(rfqRows)
    .select('id, supplier_id');

  if (rfqErr || !rfqs) throw rfqErr || new Error('Failed to create RFQs');

  const drafts: { id: string; supplierId: string }[] = [];
  for (let i = 0; i < suppliers.length; i++) {
    const supplier = suppliers[i];
    const rfq = rfqs.find((r: any) => r.supplier_id === supplier.id);
    const toAddress = supplier.contact_email;
    if (!toAddress) continue;

    const { body, reasoning, citations } = await draftRfqBody({
      supplier,
      opportunity: opp,
      inquiry,
      requirementVersion: rv,
      disclosurePolicy: input.disclosurePolicy || DEFAULT_DISCLOSURE,
      referenceNumber,
    });

    const { data: msg, error: msgErr } = await supabase
      .from('outbound_messages')
      .insert({
        company_id: DEMO_COMPANY_ID,
        inquiry_id: opp.inquiry_id || null,
        channel: 'email',
        to_address: toAddress,
        subject: `RFQ / Request for quotation — ${inquiry?.subject || 'Sourcing requirement'} (${referenceNumber})`,
        body,
        draft_status: 'pending_approval',
        ai_generated: Boolean(process.env.NIM_API_KEY),
        ai_reasoning: reasoning || 'Template RFQ',
        citations: citations || [],
      })
      .select('id')
      .single();

    if (msgErr || !msg) continue;
    drafts.push({ id: msg.id, supplierId: supplier.id });
  }

  return { batchId: batch.id, drafts };
}

// Approve + send every draft in a batch via Gmail
export async function approveAndSendBatch(batchId: string): Promise<{ sent: number; failed: { draftId: string; error: string }[] }> {
  const { data: batch } = await supabase.from('supplier_rfq_batches').select('*').eq('id', batchId).single();
  if (!batch) throw new Error('Batch not found');

  const { data: rfqs } = await supabase.from('supplier_rfqs').select('id, supplier_id').eq('batch_id', batchId);

  // Scope drafts to this batch's opportunity's inquiry (outbound_messages has
  // no supplier_rfq_id column; the inquiry_id link is the reliable join).
  const { data: opp } = batch.opportunity_id
    ? await supabase.from('opportunities').select('inquiry_id').eq('id', batch.opportunity_id).single()
    : { data: null };

  let draftQuery = supabase
    .from('outbound_messages')
    .select('id, to_address, subject, body, body_html')
    .eq('draft_status', 'pending_approval');

  if (opp?.inquiry_id) {
    draftQuery = draftQuery.eq('inquiry_id', opp.inquiry_id);
  }

  const { data: drafts } = await draftQuery.order('created_at', { ascending: true });

  const sent: number[] = [];
  const failed: { draftId: string; error: string }[] = [];

  for (const draft of drafts || []) {
    if (!draft.to_address) continue;
    const res = await sendEmail(draft.to_address, draft.subject || 'RFQ', draft.body, false);
    if (res.success) {
      await supabase.from('outbound_messages').update({ draft_status: 'sent', sent_at: new Date().toISOString() }).eq('id', draft.id);
      sent.push(1);
    } else {
      await supabase.from('outbound_messages').update({ draft_status: 'failed', error_message: res.error }).eq('id', draft.id);
      failed.push({ draftId: draft.id, error: res.error || 'Unknown' });
    }
  }

  if (sent.length > 0) {
    if (rfqs && rfqs.length > 0) {
      await supabase
        .from('supplier_rfqs')
        .update({ status: 'sent' })
        .in('id', rfqs.map((r) => r.id));
    }
    await supabase
      .from('supplier_rfq_batches')
      .update({ status: 'sent', approved_at: new Date().toISOString() })
      .eq('id', batchId);
  }

  return { sent: sent.length, failed };
}