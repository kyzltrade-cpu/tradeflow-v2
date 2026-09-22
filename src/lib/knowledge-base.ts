// Module 3: Knowledge Base + FAQ Rules Injection
// The "Company Brain" — ingests company knowledge, injects into AI calls

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ───────────────────────────────────────────────────

export interface KnowledgeDocument {
  id: string;
  company_id: string;
  title: string;
  content: string;
  source_type: 'file_upload' | 'url_scrape' | 'manual_entry' | 'email_thread';
  source_url?: string;
  file_name?: string;
  file_type?: string;
  category: string;
  tags: string[];
  created_at: string;
}

export interface FaqRule {
  id: string;
  company_id: string;
  keywords: string[];
  response_template: string;
  category: string;
  priority: number;
  is_active: boolean;
  language: string;
}

export interface BrainContext {
  knowledgeDocs: KnowledgeDocument[];
  faqRules: FaqRule[];
  productCatalog: any[];
  supplierDirectory: any[];
  companyPolicies: any;
  totalTokens: number;
}

// ─── Knowledge Base Ingestion ────────────────────────────────

export async function ingestDocument(
  companyId: string,
  title: string,
  content: string,
  sourceType: KnowledgeDocument['source_type'],
  category: string,
  options: {
    sourceUrl?: string;
    fileName?: string;
    fileType?: string;
    tags?: string[];
  } = {}
): Promise<string | null> {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .insert({
      company_id: companyId,
      title,
      content,
      source_type: sourceType,
      source_url: options.sourceUrl,
      file_name: options.fileName,
      file_type: options.fileType,
      category,
      tags: options.tags || []
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to ingest document:', error);
    return null;
  }

  return data.id;
}

// ─── Parse Uploaded Files ────────────────────────────────────

export async function parseFileUpload(
  file: File,
  companyId: string
): Promise<{ title: string; content: string; category: string } | null> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const text = await file.text();

  switch (ext) {
    case 'txt':
    case 'md':
      return {
        title: file.name,
        content: text,
        category: 'general'
      };

    case 'csv':
      return {
        title: file.name,
        content: text,
        category: 'product_spec'
      };

    case 'json':
      try {
        const parsed = JSON.parse(text);
        return {
          title: file.name,
          content: JSON.stringify(parsed, null, 2),
          category: 'general'
        };
      } catch {
        return { title: file.name, content: text, category: 'general' };
      }

    case 'pdf':
      // PDF parsing requires pdfjs-dist — for now return raw text extraction
      return {
        title: file.name,
        content: `[PDF file: ${file.name}] Content extraction pending.`,
        category: 'general'
      };

    case 'xlsx':
    case 'xls':
      // Excel parsing requires xlsx library — return placeholder
      return {
        title: file.name,
        content: `[Excel file: ${file.name}] Content extraction pending.`,
        category: 'product_spec'
      };

    case 'docx':
      // DOCX parsing requires mammoth — return placeholder
      return {
        title: file.name,
        content: `[Word file: ${file.name}] Content extraction pending.`,
        category: 'general'
      };

    default:
      return {
        title: file.name,
        content: text,
        category: 'general'
      };
  }
}

// ─── FAQ Rule Management ─────────────────────────────────────

export async function createFaqRule(
  companyId: string,
  keywords: string[],
  responseTemplate: string,
  category: string = 'general',
  priority: number = 0,
  language: string = 'en'
): Promise<string | null> {
  const { data, error } = await supabase
    .from('faq_rules')
    .insert({
      company_id: companyId,
      keywords,
      response_template: responseTemplate,
      category,
      priority,
      language
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create FAQ rule:', error);
    return null;
  }

  return data.id;
}

export async function matchFaqRules(
  companyId: string,
  messageText: string
): Promise<FaqRule[]> {
  const { data } = await supabase
    .from('faq_rules')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (!data) return [];

  const lowerText = messageText.toLowerCase();

  return data.filter((rule: FaqRule) =>
    rule.keywords.some(kw => lowerText.includes(kw.toLowerCase()))
  );
}

// ─── Build System Prompt with Brain Context ──────────────────

export async function buildBrainPrompt(
  companyId: string,
  maxTokens: number = 8000
): Promise<string> {
  // Load all brain components in parallel
  const [knowledgeDocs, faqRules, products, suppliers, company] = await Promise.all([
    supabase
      .from('knowledge_documents')
      .select('title, content, category')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('faq_rules')
      .select('keywords, response_template, category')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(30),
    supabase
      .from('products')
      .select('name, sku, category, description, moq, lead_time, certifications')
      .eq('company_id', companyId)
      .limit(50),
    supabase
      .from('suppliers')
      .select('legal_name, specialties, certifications, location, lead_time, payment_terms')
      .eq('company_id', companyId)
      .eq('is_approved', true)
      .limit(20),
    supabase
      .from('companies')
      .select('name, default_currency, default_incoterm, default_margin_percentage')
      .eq('id', companyId)
      .single()
  ]);

  const sections: string[] = [];

  // Company info
  if (company.data) {
    sections.push(`## Company Information
Name: ${company.data.name}
Default currency: ${company.data.default_currency}
Default incoterm: ${company.data.default_incoterm}
Default margin: ${company.data.default_margin_percentage}%`);
  }

  // Knowledge base
  if (knowledgeDocs.data && knowledgeDocs.data.length > 0) {
    const kbContent = knowledgeDocs.data
      .map(doc => `### ${doc.title} [${doc.category}]\n${doc.content.substring(0, 1000)}`)
      .join('\n\n');
    sections.push(`## Knowledge Base\n${kbContent}`);
  }

  // FAQ rules
  if (faqRules.data && faqRules.data.length > 0) {
    const faqContent = faqRules.data
      .map((rule: any) => `**Keywords:** ${rule.keywords.join(', ')}\n**Response:** ${rule.response_template}`)
      .join('\n\n');
    sections.push(`## FAQ Rules (use these responses when keywords match)\n${faqContent}`);
  }

  // Product catalog
  if (products.data && products.data.length > 0) {
    const productContent = products.data
      .map(p => `- ${p.name} (${p.sku || 'no SKU'}): ${p.description || 'No description'} | MOQ: ${p.moq || 'N/A'} | Lead: ${p.lead_time || 'N/A'} | Certs: ${p.certifications?.join(', ') || 'None'}`)
      .join('\n');
    sections.push(`## Product Catalog\n${productContent}`);
  }

  // Supplier directory
  if (suppliers.data && suppliers.data.length > 0) {
    const supplierContent = suppliers.data
      .map(s => `- ${s.legal_name}: ${s.specialties?.join(', ') || 'General'} | Location: ${s.location || 'N/A'} | Certs: ${s.certifications?.join(', ') || 'None'} | Lead: ${s.lead_time || 'N/A'} | Payment: ${s.payment_terms || 'N/A'}`)
      .join('\n');
    sections.push(`## Approved Suppliers\n${supplierContent}`);
  }

  // Truncate intelligently if over token limit
  const fullPrompt = sections.join('\n\n');
  if (estimateTokens(fullPrompt) > maxTokens) {
    return truncateIntelligently(sections, maxTokens);
  }

  return fullPrompt;
}

// ─── Token Estimation ────────────────────────────────────────

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English, ~2 for CJK
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const otherChars = text.length - cjkChars;
  return Math.ceil(otherChars / 4) + Math.ceil(cjkChars / 2);
}

// ─── Intelligent Truncation ──────────────────────────────────

function truncateIntelligently(sections: string[], maxTokens: number): string {
  // Priority: Company > FAQ > Knowledge > Products > Suppliers
  const priorityOrder = [0, 1, 2, 3, 4]; // indices
  let totalTokens = 0;
  const included: string[] = [];

  for (const idx of priorityOrder) {
    if (idx < sections.length) {
      const section = sections[idx];
      const sectionTokens = estimateTokens(section);

      if (totalTokens + sectionTokens <= maxTokens) {
        included.push(section);
        totalTokens += sectionTokens;
      } else {
        // Try to fit a truncated version
        const remaining = maxTokens - totalTokens;
        if (remaining > 100) {
          const truncated = truncateSection(section, remaining);
          included.push(truncated);
        }
        break;
      }
    }
  }

  return included.join('\n\n');
}

function truncateSection(section: string, maxTokens: number): string {
  const chars = maxTokens * 4; // Approximate
  if (section.length <= chars) return section;
  return section.substring(0, chars - 50) + '\n\n[... truncated for context window ...]';
}
