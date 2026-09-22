// Module 1: RFQ Extraction with Citation Tracking
// Every extracted field gets a source, confidence, and status

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ───────────────────────────────────────────────────

export interface ExtractedField {
  fieldName: string;
  value: string;
  confidence: number; // 0-1
  status: 'extracted' | 'confirmed' | 'inferred' | 'assumption' | 'conflicting' | 'rejected';
  sourceType: CitationSource['source_type'];
  sourceDetail: string;
  evidence?: string; // What in the text supports this
}

export interface CitationSource {
  entity_type: 'inquiry_field' | 'supplier_response_field' | 'cost_component' | 'quote_line' | 'rfq_field' | 'requirement';
  entity_id: string;
  field_name: string;
  value: string;
  source_type: 'customer_email' | 'customer_file' | 'supplier_quote' | 'supplier_email' | 'market_data' | 'internal_estimate' | 'exchange_rate_api' | 'company_policy' | 'assumption' | 'knowledge_base' | 'user_confirmed';
  source_detail: string;
  confidence: number;
  status: string;
}

export interface ExtractionResult {
  fields: ExtractedField[];
  inquiryType: 'rfq' | 'po' | 'inquiry' | 'complaint' | 'technical_question' | 'general';
  language: string;
  rawText: string;
  attachmentContents?: string[];
  missingFields: string[];
  aiReasoning: string;
}

// ─── Field Templates by Category ─────────────────────────────

const FIELD_TEMPLATES: Record<string, { required: string[]; optional: string[] }> = {
  drinkware: {
    required: ['product_type', 'material', 'capacity', 'quantity', 'logo_method', 'packaging'],
    optional: ['color', 'certifications', 'lead_time', 'destination', 'budget_range']
  },
  electronics: {
    required: ['product_type', 'specifications', 'quantity', 'certifications', 'packaging'],
    optional: ['color', 'brand', 'lead_time', 'destination', 'budget_range']
  },
  packaging: {
    required: ['product_type', 'material', 'dimensions', 'quantity', 'printing', 'packaging'],
    optional: ['color', 'certifications', 'lead_time', 'destination']
  },
  default: {
    required: ['product_type', 'quantity'],
    optional: ['material', 'specifications', 'color', 'certifications', 'lead_time', 'destination', 'packaging', 'budget_range']
  }
};

// ─── Core Extraction ─────────────────────────────────────────

export async function extractFromInquiry(
  emailText: string,
  attachmentContents: string[],
  category: string = 'default',
  companyId: string
): Promise<ExtractedField[]> {
  const template = FIELD_TEMPLATES[category] || FIELD_TEMPLATES.default;

  const systemPrompt = `You are an expert trading company assistant that extracts structured data from customer inquiry emails.

EXTRACTION RULES:
1. Extract ONLY information explicitly stated or clearly implied in the text
2. For each field, provide:
   - value: the extracted value (string)
   - confidence: 0.0 to 1.0 (how certain you are)
   - evidence: the exact phrase from the text that supports this value
   - status: "extracted" if directly stated, "inferred" if implied, "assumption" if you're guessing

3. For fields not found in the text, return them with:
   - value: ""
   - confidence: 0
   - evidence: null
   - status: "missing"

4. NEVER make up specifications. If the email says "stainless steel water bottle" but doesn't specify capacity, that field is MISSING.

5. If the text is in Chinese (Mandarin or Cantonese), extract the Chinese terms and also provide English translations.

6. Common HK trade terms:
   - "FOB" = Free On Board
   - "CIF" = Cost, Insurance, Freight
   - "MOQ" = Minimum Order Quantity
   - "EXW" = Ex Works

RESPOND IN VALID JSON ONLY. No markdown, no explanations outside the JSON.`;

  const userPrompt = `Extract structured data from this customer inquiry:

EMAIL TEXT:
${emailText}

${attachmentContents.length > 0 ? `\nATTACHMENT CONTENTS:\n${attachmentContents.join('\n---\n')}` : ''}

REQUIRED FIELDS: ${template.required.join(', ')}
OPTIONAL FIELDS: ${template.optional.join(', ')}

Return a JSON array of field objects with: fieldName, value, confidence, evidence, status`;

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '[]';

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = [];
  }

  const fields: ExtractedField[] = Array.isArray(parsed) ? parsed :
    parsed.fields ? parsed.fields : [];

  // Map to our type with citation sources
  return fields.map((f: any) => ({
    fieldName: f.fieldName || f.field_name,
    value: f.value || '',
    confidence: typeof f.confidence === 'number' ? f.confidence : 0,
    status: f.status || 'extracted',
    sourceType: determineSourceType(f.evidence, emailText),
    sourceDetail: f.evidence || 'Extracted from inquiry email',
    evidence: f.evidence || undefined
  }));
}

function determineSourceType(evidence: string | undefined, emailText: string): CitationSource['source_type'] {
  if (!evidence) return 'assumption';
  const lower = evidence.toLowerCase();
  if (lower.includes('signature') || lower.includes('regards') || lower.includes('best,')) return 'customer_email';
  if (lower.includes('attached') || lower.includes('pdf') || lower.includes('spreadsheet')) return 'customer_file';
  if (lower.includes('price') || lower.includes('cost') || lower.includes('usd') || lower.includes('hkd')) return 'customer_email';
  return 'customer_email';
}

// ─── Save Citations to DB ────────────────────────────────────

export async function saveCitations(
  fields: ExtractedField[],
  entityType: CitationSource['entity_type'],
  entityId: string,
  companyId: string
): Promise<void> {
  const citations = fields
    .filter(f => f.value !== '')
    .map(f => ({
      company_id: companyId,
      entity_type: entityType,
      entity_id: entityId,
      field_name: f.fieldName,
      value: f.value,
      source_type: f.sourceType,
      source_detail: f.sourceDetail,
      confidence: f.confidence,
      status: f.status
    }));

  if (citations.length > 0) {
    await supabase.from('citation_sources').insert(citations);
  }
}

// ─── Save Extracted Fields to DB ─────────────────────────────

export async function saveExtractedFields(
  fields: ExtractedField[],
  inquiryId: string,
  companyId: string
): Promise<void> {
  const dbFields = fields.map((f, i) => ({
    inquiry_id: inquiryId,
    field_name: f.fieldName,
    value: f.value,
    confidence: f.confidence,
    status: f.status,
    source_type: f.sourceType,
    source_detail: f.sourceDetail,
    sort_order: i
  }));

  await supabase.from('inquiry_fields').insert(dbFields);

  // Also save citations
  await saveCitations(fields, 'inquiry_field', inquiryId, companyId);
}

// ─── Get Citations for Entity ────────────────────────────────

export async function getCitations(
  entityType: CitationSource['entity_type'],
  entityId: string
): Promise<CitationSource[]> {
  const { data } = await supabase
    .from('citation_sources')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('field_name');

  return (data || []) as CitationSource[];
}

// ─── Format Citations for Display ────────────────────────────

export function formatCitation(citation: CitationSource): string {
  const sourceLabels: Record<string, string> = {
    customer_email: 'Customer email',
    customer_file: 'Customer file attachment',
    supplier_quote: 'Supplier quote',
    supplier_email: 'Supplier email',
    market_data: 'Market data',
    internal_estimate: 'Internal estimate',
    exchange_rate_api: 'Exchange rate API',
    company_policy: 'Company policy',
    assumption: 'AI assumption',
    knowledge_base: 'Company knowledge base',
    user_confirmed: 'Confirmed by user'
  };

  const statusEmoji: Record<string, string> = {
    extracted: '📝',
    confirmed: '✅',
    inferred: '💡',
    assumption: '⚠️',
    conflicting: '🔴',
    rejected: '❌'
  };

  const source = sourceLabels[citation.source_type] || citation.source_type;
  const emoji = statusEmoji[citation.status] || '';
  const confidence = Math.round(citation.confidence * 100);

  return `${emoji} ${citation.field_name}: "${citation.value}" (${confidence}% confidence) — Source: ${source}${citation.source_detail ? ` — ${citation.source_detail}` : ''}`;
}
