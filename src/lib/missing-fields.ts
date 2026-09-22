// Module 2: Missing Field Detection + Clarification Draft
// Identifies gaps in extracted data and drafts follow-up emails

import { createClient } from '@supabase/supabase-js';
import type { ExtractedField } from './rfq-extraction';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ───────────────────────────────────────────────────

export interface MissingField {
  fieldName: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  reason: string; // Why this field matters for quoting
  suggestedQuestion: string;
}

export interface ClarificationDraft {
  missingFields: MissingField[];
  emailBody: string;
  emailSubject: string;
  language: string;
  fieldCount: number;
  criticalCount: number;
}

// ─── Field Importance Rules ──────────────────────────────────

const FIELD_IMPORTANCE: Record<string, { importance: MissingField['importance']; reason: string }> = {
  product_type: { importance: 'critical', reason: 'Cannot identify the product to source' },
  material: { importance: 'critical', reason: 'Material determines cost and supplier selection' },
  capacity: { importance: 'critical', reason: 'Capacity affects unit price and tooling cost' },
  quantity: { importance: 'critical', reason: 'Quantity determines MOQ eligibility and volume pricing' },
  specifications: { importance: 'critical', reason: 'Cannot source without specifications' },
  logo_method: { importance: 'important', reason: 'Logo method affects per-unit cost' },
  packaging: { importance: 'important', reason: 'Packaging affects cost and shipping' },
  color: { importance: 'important', reason: 'Color may affect MOQ and lead time' },
  certifications: { importance: 'important', reason: 'Certifications affect market eligibility' },
  lead_time: { importance: 'nice_to_have', reason: 'Can estimate default if not specified' },
  destination: { importance: 'important', reason: 'Destination affects freight and duties' },
  budget_range: { importance: 'nice_to_have', reason: 'Helps narrow supplier selection' },
  dimensions: { importance: 'critical', reason: 'Dimensions affect packaging and freight' },
  printing: { importance: 'important', reason: 'Printing affects cost' },
  brand: { importance: 'nice_to_have', reason: 'May affect sourcing strategy' }
};

// ─── Detect Missing Fields ───────────────────────────────────

export function detectMissingFields(
  extractedFields: ExtractedField[],
  category: string = 'default'
): MissingField[] {
  const fieldMap = new Map<string, ExtractedField>();
  extractedFields.forEach(f => fieldMap.set(f.fieldName, f));

  const missing: MissingField[] = [];

  for (const [fieldName, rules] of Object.entries(FIELD_IMPORTANCE)) {
    const field = fieldMap.get(fieldName);
    if (!field || field.value === '' || field.confidence < 0.3) {
      missing.push({
        fieldName,
        importance: rules.importance,
        reason: rules.reason,
        suggestedQuestion: generateQuestion(fieldName, category)
      });
    }
  }

  // Sort: critical first, then important, then nice_to_have
  const order = { critical: 0, important: 1, nice_to_have: 2 };
  missing.sort((a, b) => order[a.importance] - order[b.importance]);

  return missing;
}

// ─── Generate Questions ──────────────────────────────────────

function generateQuestion(fieldName: string, category: string): string {
  const questions: Record<string, string> = {
    product_type: 'Could you confirm the exact product type you need? (e.g., stainless steel water bottle, tumbler, mug)',
    material: 'What material do you require? (e.g., 304 stainless steel, Tritan plastic, borosilicate glass)',
    capacity: 'What capacity/size do you need? (e.g., 500ml, 750ml, 1L)',
    quantity: 'How many units do you need? This affects pricing significantly.',
    logo_method: 'How would you like your logo applied? (e.g., screen printing, laser engraving, UV printing, embossing)',
    packaging: 'What packaging do you need? (e.g., individual poly bag, gift box, color box)',
    color: 'What color(s) are you looking for?',
    certifications: 'Do you need any certifications? (e.g., FDA, LFGB, BPA-free, CE)',
    lead_time: 'When do you need these delivered?',
    destination: 'Where will these be shipped to? (This affects freight and duty calculations)',
    budget_range: 'Do you have a target budget per unit?',
    specifications: 'Could you provide the detailed specifications?',
    dimensions: 'What dimensions do you need?',
    printing: 'What printing method do you prefer?',
    brand: 'Is this for a specific brand?'
  };

  return questions[fieldName] || `Could you provide details about ${fieldName.replace(/_/g, ' ')}?`;
}

// ─── Draft Clarification Email ───────────────────────────────

export async function draftClarificationEmail(
  customerName: string,
  companyName: string,
  productType: string,
  extractedFields: ExtractedField[],
  missingFields: MissingField[],
  originalSubject: string,
  language: string = 'en'
): Promise<ClarificationDraft> {
  const criticalMissing = missingFields.filter(f => f.importance === 'critical');
  const importantMissing = missingFields.filter(f => f.importance === 'important');

  // Build the question list — only ask critical and important
  const questionsToAsk = [...criticalMissing, ...importantMissing];

  const systemPrompt = `You are a professional trading company representative drafting a clarification email to a customer.

RULES:
1. Be professional but warm — you want their business
2. Reference their original inquiry naturally
3. Only ask about the specific missing fields listed
4. Keep it concise — traders are busy
5. Use the customer's language (if Chinese, reply in Chinese)
6. Do NOT make up specifications or assume answers
7. Do NOT mention internal systems or AI
8. Sign off as a human representative of the company

${language === 'zh' ? 'IMPORTANT: Draft this email in Chinese (Simplified or Traditional based on the customer\'s original email).' : ''}`;

  const userPrompt = `Draft a clarification email for this customer inquiry.

CUSTOMER: ${customerName}
COMPANY: ${companyName}
PRODUCT: ${productType}
ORIGINAL SUBJECT: Re: ${originalSubject}

WHAT WE KNOW:
${extractedFields.filter(f => f.value).map(f => `- ${f.fieldName}: ${f.value} (${Math.round(f.confidence * 100)}% confidence)`).join('\n')}

WHAT WE NEED:
${questionsToAsk.map(q => `- ${q.fieldName} (${q.importance}): ${q.suggestedQuestion}`).join('\n')}

Draft the email. Return JSON with: subject, body`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { subject: `Re: ${originalSubject}`, body: '' };
  }

  return {
    missingFields,
    emailBody: parsed.body || '',
    emailSubject: parsed.subject || `Re: ${originalSubject}`,
    language,
    fieldCount: missingFields.length,
    criticalCount: criticalMissing.length
  };
}

// ─── Save Draft to Outbound Queue ────────────────────────────

export async function saveClarificationDraft(
  draft: ClarificationDraft,
  inquiryId: string,
  conversationId: string | null,
  toAddress: string,
  companyId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('outbound_messages')
    .insert({
      company_id: companyId,
      inquiry_id: inquiryId,
      conversation_id: conversationId,
      channel: 'email',
      to_address: toAddress,
      subject: draft.emailSubject,
      body: draft.emailBody,
      draft_status: 'pending_approval',
      ai_generated: true,
      ai_reasoning: `Clarification needed for ${draft.fieldCount} fields (${draft.criticalCount} critical)`,
      citations: draft.missingFields.map(f => ({
        field: f.fieldName,
        importance: f.importance,
        reason: f.reason,
        question: f.suggestedQuestion
      }))
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save clarification draft:', error);
    return null;
  }

  return data.id;
}

// ─── Check if Inquiry Needs Clarification ────────────────────

export function needsClarification(
  extractedFields: ExtractedField[],
  threshold: number = 2
): { needed: boolean; criticalMissing: number; importantMissing: number } {
  const missing = detectMissingFields(extractedFields);
  const criticalMissing = missing.filter(f => f.importance === 'critical').length;
  const importantMissing = missing.filter(f => f.importance === 'important').length;

  return {
    needed: criticalMissing >= threshold || criticalMissing > 0,
    criticalMissing,
    importantMissing
  };
}
