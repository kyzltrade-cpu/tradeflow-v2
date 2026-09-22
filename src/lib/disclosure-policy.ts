// Module 5: Disclosure Policy / Redaction on RFQs
// Protects trader relationships when sending RFQs to multiple suppliers

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ───────────────────────────────────────────────────

export interface DisclosurePolicy {
  customer_name_hidden: boolean;
  customer_email_hidden: boolean;
  quantity_visible: boolean;
  destination_visible: boolean;
  budget_visible: boolean;
  other_suppliers_hidden: boolean;
  timeline_visible: boolean;
  custom_redactions: RedactionRule[];
}

export interface RedactionRule {
  pattern: string; // regex or literal string
  replacement: string;
  description: string;
}

export interface RedactedContent {
  original: string;
  redacted: string;
  redactionsApplied: RedactionRule[];
}

// ─── Default Policies ────────────────────────────────────────

export const DEFAULT_POLICIES: Record<string, DisclosurePolicy> = {
  standard: {
    customer_name_hidden: true,
    customer_email_hidden: true,
    quantity_visible: true,
    destination_visible: true,
    budget_visible: false,
    other_suppliers_hidden: true,
    timeline_visible: true,
    custom_redactions: []
  },
  conservative: {
    customer_name_hidden: true,
    customer_email_hidden: true,
    quantity_visible: false,
    destination_visible: false,
    budget_visible: false,
    other_suppliers_hidden: true,
    timeline_visible: false,
    custom_redactions: []
  },
  open: {
    customer_name_hidden: false,
    customer_email_hidden: false,
    quantity_visible: true,
    destination_visible: true,
    budget_visible: true,
    other_suppliers_hidden: true,
    timeline_visible: true,
    custom_redactions: []
  }
};

// ─── Apply Redaction ─────────────────────────────────────────

export function applyRedaction(
  content: string,
  policy: DisclosurePolicy,
  context: {
    customerName?: string;
    customerEmail?: string;
    quantity?: string;
    destination?: string;
    budget?: string;
    otherSuppliers?: string[];
    timeline?: string;
  }
): RedactedContent {
  let redacted = content;
  const applied: RedactionRule[] = [];

  // Customer name
  if (policy.customer_name_hidden && context.customerName) {
    const rule: RedactionRule = {
      pattern: context.customerName,
      replacement: '[Customer]',
      description: 'Customer name redacted'
    };
    redacted = redacted.replaceAll(rule.pattern, rule.replacement);
    applied.push(rule);
  }

  // Customer email
  if (policy.customer_email_hidden && context.customerEmail) {
    const rule: RedactionRule = {
      pattern: context.customerEmail,
      replacement: '[Email Redacted]',
      description: 'Customer email redacted'
    };
    redacted = redacted.replaceAll(rule.pattern, rule.replacement);
    applied.push(rule);
  }

  // Quantity
  if (!policy.quantity_visible && context.quantity) {
    const rule: RedactionRule = {
      pattern: context.quantity,
      replacement: '[Quantity Available Upon Request]',
      description: 'Quantity redacted'
    };
    redacted = redacted.replaceAll(rule.pattern, rule.replacement);
    applied.push(rule);
  }

  // Destination
  if (!policy.destination_visible && context.destination) {
    const rule: RedactionRule = {
      pattern: context.destination,
      replacement: '[Destination Redacted]',
      description: 'Destination redacted'
    };
    redacted = redacted.replaceAll(rule.pattern, rule.replacement);
    applied.push(rule);
  }

  // Budget
  if (!policy.budget_visible && context.budget) {
    const rule: RedactionRule = {
      pattern: context.budget,
      replacement: '[Budget Redacted]',
      description: 'Budget redacted'
    };
    redacted = redacted.replaceAll(rule.pattern, rule.replacement);
    applied.push(rule);
  }

  // Other suppliers
  if (policy.other_suppliers_hidden && context.otherSuppliers) {
    for (const supplier of context.otherSuppliers) {
      const rule: RedactionRule = {
        pattern: supplier,
        replacement: '[Other Supplier]',
        description: 'Other supplier name redacted'
      };
      redacted = redacted.replaceAll(rule.pattern, rule.replacement);
      applied.push(rule);
    }
  }

  // Timeline
  if (!policy.timeline_visible && context.timeline) {
    const rule: RedactionRule = {
      pattern: context.timeline,
      replacement: '[Timeline Redacted]',
      description: 'Timeline redacted'
    };
    redacted = redacted.replaceAll(rule.pattern, rule.replacement);
    applied.push(rule);
  }

  // Custom redactions
  for (const custom of policy.custom_redactions) {
    try {
      const regex = new RegExp(custom.pattern, 'gi');
      if (regex.test(redacted)) {
        redacted = redacted.replace(regex, custom.replacement);
        applied.push(custom);
      }
    } catch {
      // If regex fails, try literal match
      redacted = redacted.replaceAll(custom.pattern, custom.replacement);
      applied.push(custom);
    }
  }

  return {
    original: content,
    redacted,
    redactionsApplied: applied
  };
}

// ─── Save Policy to RFQ Batch ────────────────────────────────

export async function setRfqBatchPolicy(
  batchId: string,
  policy: DisclosurePolicy
): Promise<void> {
  const redactedFields: string[] = [];
  if (policy.customer_name_hidden) redactedFields.push('customer_name');
  if (policy.customer_email_hidden) redactedFields.push('customer_email');
  if (!policy.quantity_visible) redactedFields.push('quantity');
  if (!policy.destination_visible) redactedFields.push('destination');
  if (!policy.budget_visible) redactedFields.push('budget');
  if (policy.other_suppliers_hidden) redactedFields.push('other_suppliers');
  if (!policy.timeline_visible) redactedFields.push('timeline');

  await supabase
    .from('supplier_rfq_batches')
    .update({
      disclosure_policy: policy,
      redacted_fields: redactedFields
    })
    .eq('id', batchId);
}

// ─── Get Policy for Batch ────────────────────────────────────

export async function getRfqBatchPolicy(batchId: string): Promise<DisclosurePolicy> {
  const { data } = await supabase
    .from('supplier_rfq_batches')
    .select('disclosure_policy')
    .eq('id', batchId)
    .single();

  if (data?.disclosure_policy) {
    return data.disclosure_policy as DisclosurePolicy;
  }

  return DEFAULT_POLICIES.standard;
}

// ─── Preview Redaction ───────────────────────────────────────

export function previewRedaction(
  content: string,
  policyName: string,
  context: {
    customerName?: string;
    customerEmail?: string;
    quantity?: string;
    destination?: string;
    budget?: string;
    otherSuppliers?: string[];
    timeline?: string;
  }
): { before: string; after: string; changes: number } {
  const policy = DEFAULT_POLICIES[policyName] || DEFAULT_POLICIES.standard;
  const result = applyRedaction(content, policy, context);

  return {
    before: result.original,
    after: result.redacted,
    changes: result.redactionsApplied.length
  };
}
