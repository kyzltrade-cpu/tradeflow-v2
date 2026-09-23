// Steps 3-6: Clarification Loop
// 3: Detect missing/conflicting fields from an inquiry
// 4: AI drafts a clarification (or template fallback) in the customer's language
// 5: Draft sits in outbound queue for human approval, then send
// 6: Customer reply is appended to the inquiry; status advances to requirements_confirmed

import { createClient } from '@supabase/supabase-js';
import { callNimJson } from '../ai/nim';
import type { Inquiry, InquiryField, RequirementVersion } from '../db-types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const DEMO_COMPANY_ID = 'de16b018-a635-4b45-a5ee-101dea1d66a1';

export interface MissingField {
  field_key: string;
  field_label: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  reason: string;
  suggested_question: string;
}

const IMPORTANCE_RULES: Record<string, { importance: MissingField['importance']; reason: string }> = {
  product_name: { importance: 'critical', reason: 'Cannot identify the product to source' },
  material: { importance: 'critical', reason: 'Material determines cost and supplier selection' },
  quantity: { importance: 'critical', reason: 'Quantity determines MOQ eligibility and volume pricing' },
  specifications: { importance: 'critical', reason: 'Cannot source without specifications' },
  target_price: { importance: 'nice_to_have', reason: 'Helps narrow supplier selection' },
  currency: { importance: 'important', reason: 'Currency affects pricing and quote' },
  incoterm: { importance: 'important', reason: 'Incoterm determines shipping responsibility' },
  delivery_date: { importance: 'important', reason: 'Lead time affects supplier selection' },
  destination: { importance: 'important', reason: 'Destination affects freight and duties' },
  certifications: { importance: 'important', reason: 'Certifications affect market eligibility' },
  packaging: { importance: 'important', reason: 'Packaging affects cost and shipping' },
  payment_terms: { importance: 'nice_to_have', reason: 'Payment terms affect deal terms' },
};

const QUESTION_TEMPLATES: Record<string, string> = {
  product_name: 'Could you confirm the exact product you need? (e.g., brand, model, series)',
  material: 'What material do you require? (e.g., 304 stainless steel, ABS plastic, cotton)',
  quantity: 'How many units do you need? This affects pricing significantly.',
  specifications: 'Could you provide the full specifications or a data sheet?',
  target_price: 'Do you have a target price per unit?',
  currency: 'Which currency should we quote in? (USD, HKD, CNY, EUR...)',
  incoterm: 'Which trade term do you prefer? (FOB, CIF, EXW, DDP...)',
  delivery_date: 'By when do you need delivery?',
  destination: 'Where will the goods be shipped to?',
  certifications: 'Are any certifications required? (CE, FDA, RoHS, LFGB...)',
  packaging: 'Any packaging requirements? (retail box, poly bag, pallet...)',
  payment_terms: 'What payment terms do you prefer? (TT, LC, deposit ratio...)',
};

// ─── Step 3: Detect missing + conflicting fields ────────────────────────────

export function detectMissingFields(fields: InquiryField[]): MissingField[] {
  const byKey = new Map<string, InquiryField>();
  fields.forEach((f) => {
    if (!byKey.has(f.field_key)) byKey.set(f.field_key, f);
  });

  const missing: MissingField[] = [];
  for (const [fieldKey, rules] of Object.entries(IMPORTANCE_RULES)) {
    const field = byKey.get(fieldKey);
    const hasValue = field?.normalized_value || field?.raw_value;
    if (!field || !hasValue || (field.confidence ?? 0) < 0.3) {
      missing.push({
        field_key: fieldKey,
        field_label: field?.field_label || fieldKey,
        importance: rules.importance,
        reason: rules.reason,
        suggested_question:
          QUESTION_TEMPLATES[fieldKey] || `Could you confirm the ${fieldKey.replace(/_/g, ' ')}?`,
      });
    }
  }

  const order = { critical: 0, important: 1, nice_to_have: 2 };
  return missing.sort((a, b) => order[a.importance] - order[b.importance]);
}

export function detectConflictingFields(fields: InquiryField[]): InquiryField[] {
  const byKey = new Map<string, InquiryField[]>();
  fields.forEach((f) => {
    const key = f.field_key;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(f);
  });

  const conflicting: InquiryField[] = [];
  byKey.forEach((group) => {
    const values = new Set(group.map((f) => f.normalized_value || f.raw_value).filter(Boolean));
    if (values.size > 1) {
      group.forEach((f) => conflicting.push(f));
    }
  });
  return conflicting;
}

export interface AnalysisResult {
  inquiry_id: string;
  total_fields: number;
  missing: MissingField[];
  conflicting: InquiryField[];
  needs_clarification: boolean;
}

export function analyzeInquiryFields(fields: InquiryField[]): AnalysisResult {
  const missing = detectMissingFields(fields);
  const conflicting = detectConflictingFields(fields);
  return {
    inquiry_id: fields[0]?.inquiry_id || '',
    total_fields: fields.length,
    missing,
    conflicting,
    needs_clarification: conflicting.length > 0 || missing.some((m) => m.importance === 'critical'),
  };
}

// ─── Step 4: Draft clarification ────────────────────────────────────────────

export interface ClarificationDraft {
  subject: string;
  body: string;
  language: string;
  missing_fields: MissingField[];
  critical_count: number;
}

async function draftWithAi(inquiry: Inquiry, missing: MissingField[], language: string): Promise<ClarificationDraft> {
  const result = await callNimJson<{ subject?: string; body?: string; language?: string }>(
    [
      {
        role: 'system',
        content: `You draft professional clarification emails for a Hong Kong trading company answering trade RFQs.
Rules:
1. Professional, warm, concise. Traders are busy.
2. Ask ONLY about the missing fields listed. Never invent specs or products.
3. Match the customer's language. Write in ${language || 'English'} if the customer wrote in that language; otherwise use the language the customer used.
4. Never mention AI or internal systems. Sign as a human representative.
5. Lay out the questions as a numbered list for easy reply.
Return JSON: {"subject": string, "body": string}`,
      },
      {
        role: 'user',
        content: `Customer inquiry:
Subject: ${inquiry.subject || ''}
From: ${inquiry.sender_name || ''} <${inquiry.sender_email || ''}>
Message:
${(inquiry.original_message || '').slice(0, 4000)}

Missing fields to ask about:
${missing.map((m, i) => `${i + 1}. ${m.field_label} (${m.importance}): ${m.suggested_question}`).join('\n')}

Draft the clarification email.`,
      },
    ],
    { temperature: 0.3 }
  );

  return {
    subject: result.subject || `Re: ${inquiry.subject}`,
    body: result.body || '',
    language: result.language || 'en',
    missing_fields: missing,
    critical_count: missing.filter((m) => m.importance === 'critical').length,
  };
}

function draftWithTemplate(inquiry: Inquiry, missing: MissingField[]): ClarificationDraft {
  const critical = missing.filter((m) => m.importance === 'critical');
  const lines = [...critical, ...missing.filter((m) => m.importance !== 'critical')]
    .slice(0, 8)
    .map((m, i) => `${i + 1}. ${m.suggested_question}`)
    .join('\n');

  return {
    subject: `Re: ${inquiry.subject || 'Your inquiry'}`,
    body: `Hi ${inquiry.sender_name || 'there'},

Thanks for your inquiry. Before we prepare a quotation, could you confirm a few details?

${lines}

Once we have these, we can send you our best price and lead time.

Best regards,
Hong Kong Trading Representative`,
    language: 'en',
    missing_fields: missing,
    critical_count: critical.length,
  };
}

export async function draftClarification(
  inquiry: Inquiry,
  missing: MissingField[],
  language = 'en'
): Promise<ClarificationDraft> {
  if (process.env.NIM_API_KEY) {
    try {
      return await draftWithAi(inquiry, missing, language);
    } catch (err) {
      console.error('AI clarification failed, falling back to template:', err);
    }
  }
  return draftWithTemplate(inquiry, missing);
}

// ─── Step 4b: Persist draft to outbound queue ───────────────────────────────

export async function saveClarificationDraft(
  inquiryId: string,
  toAddress: string,
  draft: ClarificationDraft,
  companyId = DEMO_COMPANY_ID
): Promise<string | null> {
  const { data, error } = await supabase
    .from('outbound_messages')
    .insert({
      company_id: companyId,
      inquiry_id: inquiryId,
      channel: 'email',
      to_address: toAddress,
      subject: draft.subject,
      body: draft.body,
      draft_status: 'pending_approval',
      ai_generated: true,
      ai_reasoning: `Clarification needed for ${draft.missing_fields.length} fields (${draft.critical_count} critical)`,
      citations: draft.missing_fields.map((m) => ({
        field: m.field_key,
        importance: m.importance,
        reason: m.reason,
        question: m.suggested_question,
      })),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save clarification draft:', error);
    return null;
  }
  return data.id;
}

export async function setInquiryStatus(inquiryId: string, status: string) {
  await supabase.from('inquiries').update({ status }).eq('id', inquiryId);
}

// ─── Step 6: Register customer reply ────────────────────────────────────────

export async function registerCustomerReply(
  inquiryId: string,
  replyText: string,
  versionBump = true
): Promise<{
  replyId: string;
  version?: RequirementVersion;
}> {
  const { data: inquiry } = await supabase
    .from('inquiries')
    .select('*')
    .eq('id', inquiryId)
    .single();

  if (!inquiry) throw new Error('Inquiry not found');

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      company_id: inquiry.company_id,
      conversation_id: null,
      channel: 'email',
      direction: 'inbound',
      sender_name: inquiry.sender_name,
      sender_email: inquiry.sender_email,
      subject: `Re: ${inquiry.subject || ''}`,
      body_text: replyText,
      processing_status: 'completed',
    })
    .select('id')
    .single();

  if (error) throw new Error('Failed to record reply');

  let version: RequirementVersion | undefined;
  if (versionBump) {
    const { data: latest } = await supabase
      .from('requirement_versions')
      .select('version_number')
      .eq('inquiry_id', inquiryId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latest?.version_number || 0) + 1;
    const { data: created, error: verr } = await supabase
      .from('requirement_versions')
      .insert({
        inquiry_id: inquiryId,
        version_number: nextVersion,
        status: 'draft',
        snapshot_json: { reply_text: replyText, replied_at: new Date().toISOString() },
      })
      .select('*')
      .single();

    if (verr) throw new Error('Failed to create requirement version');
    version = created;
  }

  return { replyId: msg.id, version };
}