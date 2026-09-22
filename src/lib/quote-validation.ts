// Module 4: Pre-Send Quote Validation with Citations
// Every price must cite its source before a quote can be sent

import { createClient } from '@supabase/supabase-js';
import type { CitationSource } from './rfq-extraction';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ───────────────────────────────────────────────────

export interface ValidationIssue {
  field: string;
  severity: 'blocking' | 'warning' | 'info';
  message: string;
  citation?: CitationSource;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  blockingCount: number;
  warningCount: number;
  quoteReady: boolean;
  summary: string;
}

export interface QuoteForValidation {
  id: string;
  company_id: string;
  inquiry_id: string;
  customer_id: string;
  status: string;
  currency: string;
  incoterm: string;
  valid_until: string;
  terms: string[];
  lines: QuoteLine[];
  costComponents: CostComponent[];
  totalAmount: number;
  marginPercentage: number;
}

export interface QuoteLine {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  currency: string;
  total: number;
  source_citation: CitationSource | null;
}

export interface CostComponent {
  id: string;
  name: string;
  amount: number;
  currency: string;
  source_type: CitationSource['source_type'];
  source_detail: string;
  confidence: number;
  is_estimate: boolean;
}

// ─── Validation Rules ────────────────────────────────────────

const BLOCKING_RULES = [
  {
    id: 'missing_unit_price',
    check: (q: QuoteForValidation) => q.lines.some(l => !l.unit_price || l.unit_price <= 0),
    message: 'One or more line items have no unit price',
    field: 'unit_price'
  },
  {
    id: 'missing_quantity',
    check: (q: QuoteForValidation) => q.lines.some(l => !l.quantity || l.quantity <= 0),
    message: 'One or more line items have no quantity',
    field: 'quantity'
  },
  {
    id: 'no_cost_breakdown',
    check: (q: QuoteForValidation) => q.costComponents.length === 0,
    message: 'No cost breakdown — cannot validate margin',
    field: 'cost_components'
  },
  {
    id: 'negative_margin',
    check: (q: QuoteForValidation) => q.marginPercentage < 0,
    message: 'Negative margin — this quote would lose money',
    field: 'margin'
  },
  {
    id: 'margin_below_minimum',
    check: (q: QuoteForValidation, minMargin: number) => q.marginPercentage > 0 && q.marginPercentage < minMargin,
    message: 'Margin is below minimum threshold',
    field: 'margin'
  },
  {
    id: 'expired_validity',
    check: (q: QuoteForValidation) => new Date(q.valid_until) < new Date(),
    message: 'Quote validity date has passed',
    field: 'valid_until'
  },
  {
    id: 'no_terms',
    check: (q: QuoteForValidation) => !q.terms || q.terms.length === 0,
    message: 'No terms and conditions specified',
    field: 'terms'
  },
  {
    id: 'unconfirmed_assumptions',
    check: (q: QuoteForValidation) =>
      q.lines.some(l => l.source_citation?.status === 'assumption') ||
      q.costComponents.some(c => c.is_estimate && c.confidence < 0.5),
    message: 'Quote contains unconfirmed assumptions or low-confidence estimates',
    field: 'citations'
  }
];

const WARNING_RULES = [
  {
    id: 'high_estimate_ratio',
    check: (q: QuoteForValidation) => {
      const estimateCount = q.costComponents.filter(c => c.is_estimate).length;
      return estimateCount > q.costComponents.length * 0.5;
    },
    message: 'More than 50% of cost components are estimates — verify with actual quotes',
    field: 'cost_components'
  },
  {
    id: 'low_confidence_citations',
    check: (q: QuoteForValidation) =>
      q.lines.some(l => l.source_citation && l.source_citation.confidence < 0.6),
    message: 'Some line items have low-confidence source data (< 60%)',
    field: 'citations'
  },
  {
    id: 'single_supplier',
    check: (q: QuoteForValidation) => {
      const sources = new Set(q.costComponents.map(c => c.source_detail));
      return sources.size === 1 && q.lines.length > 0;
    },
    message: 'All costs from single source — consider getting multiple supplier quotes',
    field: 'suppliers'
  },
  {
    id: 'no_exchange_rate_citation',
    check: (q: QuoteForValidation) =>
      q.costComponents.some(c => c.source_type === 'assumption' && c.name.toLowerCase().includes('exchange')),
    message: 'Exchange rate is an assumption — verify current rate',
    field: 'exchange_rate'
  }
];

// ─── Main Validation ─────────────────────────────────────────

export async function validateQuote(
  quote: QuoteForValidation,
  companyId: string,
  minMargin: number = 5
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  // Load citations for the quote
  const citations = await getQuoteCitations(quote.id);

  // Run blocking rules
  for (const rule of BLOCKING_RULES) {
    if (rule.check(quote, minMargin)) {
      let message = rule.message;
      // Add dynamic details for specific rules
      if (rule.id === 'negative_margin') {
        message = `Negative margin (${quote.marginPercentage.toFixed(1)}%) — this quote would lose money`;
      } else if (rule.id === 'margin_below_minimum') {
        message = `Margin (${quote.marginPercentage.toFixed(1)}%) is below minimum (${minMargin}%)`;
      }

      issues.push({
        field: rule.field,
        severity: 'blocking',
        message,
        suggestion: getSuggestion(rule.id)
      });
    }
  }

  // Run warning rules
  for (const rule of WARNING_RULES) {
    if (rule.check(quote)) {
      issues.push({
        field: rule.field,
        severity: 'warning',
        message: rule.message,
        suggestion: getSuggestion(rule.id)
      });
    }
  }

  // Check citation completeness
  const citationIssues = validateCitations(quote, citations);
  issues.push(...citationIssues);

  const blockingCount = issues.filter(i => i.severity === 'blocking').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return {
    valid: blockingCount === 0,
    issues,
    blockingCount,
    warningCount,
    quoteReady: blockingCount === 0,
    summary: blockingCount === 0
      ? `Quote is ready to send. ${warningCount} warning(s) to review.`
      : `Quote has ${blockingCount} blocking issue(s) that must be resolved before sending.`
  };
}

// ─── Citation Validation ─────────────────────────────────────

function validateCitations(
  quote: QuoteForValidation,
  citations: CitationSource[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Every line item must have a citation
  for (const line of quote.lines) {
    if (!line.source_citation) {
      issues.push({
        field: `line.${line.id}.source_citation`,
        severity: 'blocking',
        message: `Line item "${line.product_name}" has no source citation — price origin is unknown`,
        suggestion: 'Attach the supplier quote or market data source for this price'
      });
    } else if (line.source_citation.status === 'assumption') {
      issues.push({
        field: `line.${line.id}.source_citation`,
        severity: 'warning',
        message: `Line item "${line.product_name}" price is an AI assumption, not from a real quote`,
        suggestion: 'Get an actual supplier quote or confirm this price manually'
      });
    }
  }

  // Every cost component must have a citation
  for (const comp of quote.costComponents) {
    if (!comp.source_detail || comp.source_detail === '') {
      issues.push({
        field: `cost.${comp.id}.source_detail`,
        severity: 'blocking',
        message: `Cost component "${comp.name}" has no source citation`,
        suggestion: 'Specify where this cost estimate came from'
      });
    }
  }

  return issues;
}

// ─── Get Citations for Quote ─────────────────────────────────

async function getQuoteCitations(quoteId: string): Promise<CitationSource[]> {
  const { data } = await supabase
    .from('citation_sources')
    .select('*')
    .eq('entity_type', 'quote_line')
    .eq('entity_id', quoteId);

  return (data || []) as CitationSource[];
}

// ─── Suggestions ─────────────────────────────────────────────

function getSuggestion(ruleId: string): string {
  const suggestions: Record<string, string> = {
    missing_unit_price: 'Add a unit price from a supplier quote or estimate',
    missing_quantity: 'Confirm the order quantity with the customer',
    no_cost_breakdown: 'Add cost components (product cost, freight, packaging, etc.)',
    negative_margin: 'Increase selling price or reduce costs to achieve positive margin',
    margin_below_minimum: 'Review cost components or negotiate better supplier pricing',
    expired_validity: 'Update the validity date to a future date',
    no_terms: 'Add standard payment terms, delivery terms, and warranty conditions',
    unconfirmed_assumptions: 'Review and confirm AI-generated estimates with real data',
    high_estimate_ratio: 'Get actual supplier quotes to replace estimates',
    low_confidence_citations: 'Verify source data for low-confidence fields',
    single_supplier: 'Request quotes from additional suppliers for comparison',
    no_exchange_rate_citation: 'Use current exchange rate from a reliable source'
  };

  return suggestions[ruleId] || 'Review and correct this field';
}

// ─── Save Validation Result ──────────────────────────────────

export async function saveValidationResult(
  quoteId: string,
  result: ValidationResult
): Promise<void> {
  await supabase
    .from('quotes')
    .update({
      validation_result: result,
      validation_passed: result.valid,
      validated_at: new Date().toISOString()
    })
    .eq('id', quoteId);
}

// ─── Format Validation for Display ───────────────────────────

export function formatValidationSummary(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✅ Quote is ready to send');
  } else {
    lines.push(`❌ Quote has ${result.blockingCount} issue(s) that must be resolved`);
  }

  if (result.warningCount > 0) {
    lines.push(`⚠️  ${result.warningCount} warning(s) to review`);
  }

  lines.push('');

  for (const issue of result.issues) {
    const icon = issue.severity === 'blocking' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️';
    lines.push(`${icon} [${issue.field}] ${issue.message}`);
    if (issue.suggestion) {
      lines.push(`   💡 ${issue.suggestion}`);
    }
  }

  return lines.join('\n');
}
