// ─── Enums & Status Types ────────────────────────────────────────────────────

export type InquiryStatus = 'new' | 'needs_clarification' | 'clarification_sent' | 'customer_replied' | 'requirements_confirmed' | 'qualified' | 'declined' | 'duplicate' | 'on_hold';

export type OpportunityStage = 'new' | 'qualified' | 'sourcing' | 'rfq_sent' | 'responses_received' | 'comparison_ready' | 'quote_draft' | 'pending_approval' | 'sent' | 'negotiation' | 'won' | 'lost' | 'expired';

export type QuoteStatus = 'draft' | 'pending_approval' | 'approved' | 'sending' | 'sent' | 'viewed' | 'negotiation' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export type SupplierRfqStatus = 'draft' | 'approved' | 'sending' | 'sent' | 'delivery_failed' | 'responded' | 'response_incomplete' | 'expired' | 'closed';

export type SampleDecision = 'not_required' | 'recommended' | 'required' | 'unknown';

export type MessageType = 'new_rfq' | 'customer_clarification' | 'customer_negotiation' | 'supplier_rfq_response' | 'supplier_clarification' | 'supplier_document' | 'follow_up_reply' | 'order_handoff' | 'other';

export type FieldSourceType = 'customer_message' | 'customer_attachment' | 'customer_reply' | 'supplier_reply' | 'user_entered' | 'system_default' | 'ai_inference' | 'external_source';

export type FieldStatus = 'missing' | 'extracted' | 'confirmed' | 'assumption' | 'conflict' | 'rejected';

export type VerificationLevel = 'public_lead' | 'supplier_responded' | 'documents_received' | 'internal_history' | 'reference_checked' | 'third_party_checked' | 'site_visit_completed' | 'approved_for_this_order';

export type ComparabilityStatus = 'comparable' | 'partially_comparable' | 'not_comparable';

export type FollowUpStatus = 'pending' | 'sent' | 'completed' | 'paused' | 'cancelled';

export type MessageDirection = 'inbound' | 'outbound';

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  legalName: string;
  defaultCurrency: string;
  defaultTimezone: string;
  countryOrRegion: string;
  defaultMarginPercent: number;
  minimumMarginPercent: number;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';
  locale: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  tenantId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
  source: string;
  createdAt: string;
}

export interface Message {
  id: string;
  tenantId: string;
  conversationId: string;
  channel: 'email' | 'whatsapp' | 'wechat' | 'manual';
  direction: MessageDirection;
  senderName: string;
  senderEmail: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
  isDemo: boolean;
  classification?: MessageType;
  classificationConfidence?: number;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface Conversation {
  id: string;
  tenantId: string;
  customerId: string;
  channel: string;
  subject: string;
  status: 'active' | 'archived';
  lastMessageAt: string;
}

// ─── Inquiry & Requirements ──────────────────────────────────────────────────

export interface InquiryField {
  fieldKey: string;
  fieldLabel: string;
  rawValue: string;
  normalizedValue: string;
  unit: string;
  sourceType: FieldSourceType;
  sourceMessageId?: string;
  confidence: number;
  status: FieldStatus;
  isRequired: boolean;
}

export interface RequirementVersion {
  id: string;
  inquiryId: string;
  opportunityId: string;
  versionNumber: number;
  status: 'draft' | 'confirmed' | 'superseded';
  snapshot: Record<string, string>;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  tenantId: string;
  referenceNumber: string;
  conversationId: string;
  customerId: string;
  status: InquiryStatus;
  processing_status: string;
  categoryId: string;
  ownerId: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  estimatedValue: number;
  currency: string;
  qualificationStatus?: 'qualified' | 'needs_more_information' | 'declined' | 'duplicate' | 'on_hold';
  nextAction: string;
  createdAt: string;
  closedAt?: string;
}

// ─── Opportunities ───────────────────────────────────────────────────────────

export interface Opportunity {
  id: string;
  tenantId: string;
  referenceNumber: string;
  inquiryId: string;
  customerId: string;
  stage: OpportunityStage;
  estimatedValue: number;
  currency: string;
  targetMarginPercent: number;
  ownerId: string;
  nextAction: string;
  lostReason?: string;
  sampleDecision: SampleDecision;
  createdAt: string;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface CategoryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  unit?: string;
  examples?: string[];
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  fields: CategoryField[];
  active: boolean;
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export interface SupplierEvidence {
  id: string;
  sourceType: string;
  sourceUrl?: string;
  sourceTitle: string;
  sourceDate: string;
  claimText: string;
  verificationStatus: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  legalName: string;
  supplierType: 'existing' | 'new';
  country: string;
  city: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  specialties: string[];
  verificationLevel: VerificationLevel;
  verificationStatus: 'pending' | 'verified' | 'unverified';
  lastVerifiedAt?: string;
  internalRating: number;
  notes: string;
  evidence: SupplierEvidence[];
  certifications: { name: string; status: 'claimed' | 'documents_available' | 'reviewed' | 'verified' | 'not_confirmed' }[];
  moq: number;
  leadTimeDays: number;
  createdAt: string;
}

// ─── Supplier RFQs ───────────────────────────────────────────────────────────

export interface SupplierRfq {
  id: string;
  batchId: string;
  supplierId: string;
  status: SupplierRfqStatus;
  outboundMessageId?: string;
  lastFollowUpAt?: string;
  responseReceivedAt?: string;
  createdAt: string;
}

export interface SupplierRfqBatch {
  id: string;
  tenantId: string;
  referenceNumber: string;
  opportunityId: string;
  requirementVersionId: string;
  status: 'draft' | 'approved' | 'sending' | 'sent' | 'closed';
  responseDeadline: string;
  disclosurePolicy: string[];
  rfqs: SupplierRfq[];
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

// ─── Supplier Responses ──────────────────────────────────────────────────────

export interface SupplierResponseField {
  fieldKey: string;
  rawValue: string;
  normalizedValue: string;
  currency?: string;
  unit?: string;
  confidence: number;
  status: FieldStatus;
}

export interface SupplierResponse {
  id: string;
  supplierRfqId: string;
  supplierId: string;
  status: 'received' | 'normalized' | 'reviewed' | 'incomplete';
  comparabilityStatus: ComparabilityStatus;
  rawResponseText: string;
  normalizedData: Record<string, string>;
  extractionConfidence: number;
  fields: SupplierResponseField[];
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

// ─── Comparison ──────────────────────────────────────────────────────────────

export interface ComparisonFlag {
  type: string;
  description: string;
  severity: 'warning' | 'error' | 'info';
}

export interface SupplierComparison {
  id: string;
  opportunityId: string;
  requirementVersionId: string;
  status: 'draft' | 'ready_for_review' | 'approved';
  recommendation: {
    recommendedSupplierId: string;
    alternativeSupplierId?: string;
    reasons: string[];
    risks: string[];
    missingInformation: string[];
  };
  flags: ComparisonFlag[];
  selectedSupplierId?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

// ─── Cost Calculation ────────────────────────────────────────────────────────

export type CostSource = 'supplier_quote' | 'user_entered' | 'external_estimate' | 'system_default' | 'unverified';

export interface CostLine {
  key: string;
  label: string;
  amount: number;
  source: CostSource;
  sourceDetail: string;
  confirmed: boolean;
}

export interface CostCalculation {
  id: string;
  opportunityId: string;
  comparisonId: string;
  formulaVersion: string;
  currency: string;
  inputs: CostLine[];
  outputs: {
    supplierCost: number;
    subtotalBeforeContingency: number;
    contingencyCost: number;
    totalCost: number;
    grossProfit: number;
    customerPrice: number;
    grossMarginPercent: number;
    costPerUnit: number;
    pricePerUnit: number;
  };
  warnings: string[];
  createdBy: string;
  createdAt: string;
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

export interface QuoteAuditEntry {
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export interface Quote {
  id: string;
  tenantId: string;
  referenceNumber: string;
  opportunityId: string;
  comparisonId: string;
  costCalculationId: string;
  status: QuoteStatus;
  customerPrice: number;
  currency: string;
  validUntil: string;
  internalView: {
    supplierId: string;
    supplierCost: number;
    marginPercent: number;
    costBreakdown: CostLine[];
    assumptions: string[];
    warnings: string[];
  };
  customerView: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    deliveryEstimate: string;
    incoterm: string;
    paymentTerms: string;
    validityDate: string;
    notes: string;
    exclusions: string[];
  };
  auditTrail: QuoteAuditEntry[];
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  createdAt: string;
}

// ─── Follow-ups ──────────────────────────────────────────────────────────────

export interface FollowUpStep {
  day: number;
  label: string;
  action: string;
  status: FollowUpStatus;
  sentAt?: string;
}

export interface FollowUp {
  id: string;
  tenantId: string;
  opportunityId: string;
  quoteId: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentStep: number;
  nextDueAt: string;
  pausedReason?: string;
  steps: FollowUpStep[];
  createdAt: string;
}

// ─── Audit Events ────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorType: 'user' | 'ai' | 'system';
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadataJson?: string;
  createdAt: string;
}
