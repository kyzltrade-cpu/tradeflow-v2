export interface Company {
  id: string;
  name: string;
  whatsapp_number?: string;
  industry?: string;
  status: string;
  default_currency: string;
  default_language: string;
  default_incoterm: string;
  default_payment_terms: string;
  minimum_margin_pct: number;
  quote_validity_days: number;
  approval_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  company_id: string;
  role: string;
  name?: string;
  auth_user_id?: string;
  locale?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  legal_name: string;
  trading_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  industry?: string;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  legal_name: string;
  trading_name?: string;
  location?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  is_approved: boolean;
  certifications?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  sku?: string;
  category?: string;
  unit: string;
  description?: string;
  specifications?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  company_id: string;
  customer_id?: string;
  source_channel: string;
  subject?: string;
  status: string;
  assigned_user_id?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  company_id: string;
  conversation_id: string;
  channel: string;
  sender_name?: string;
  sender_email?: string;
  recipient_address?: string;
  subject?: string;
  body_text?: string;
  body_html_sanitized?: string;
  direction: string;
  classification?: string;
  classification_confidence?: number;
  processing_status: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  company_id: string;
  source_channel: string;
  provider_event_id?: string;
  sender_name?: string;
  sender_email?: string;
  subject?: string;
  original_message?: string;
  customer_id?: string;
  opportunity_id?: string;
  reference_number?: string;
  processing_status: string;
  assigned_owner?: string;
  priority: string;
  estimated_value?: number;
  status: string;
  category?: string;
  urgency: string;
  next_action?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface InquiryField {
  id: string;
  inquiry_id: string;
  field_key: string;
  field_label?: string;
  raw_value?: string;
  normalized_value?: string;
  unit?: string;
  source_type: string;
  source_message_id?: string;
  confidence: number;
  status: string;
  is_required: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RequirementVersion {
  id: string;
  inquiry_id: string;
  opportunity_id?: string;
  version_number: number;
  status: string;
  snapshot_json?: Record<string, unknown>;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface Opportunity {
  id: string;
  company_id: string;
  reference_number: string;
  inquiry_id?: string;
  customer_id?: string;
  stage: string;
  status: string;
  estimated_value?: number;
  currency: string;
  target_margin_percentage?: number;
  owner_id?: string;
  next_action?: string;
  lost_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierRfqBatch {
  id: string;
  company_id: string;
  reference_number: string;
  opportunity_id?: string;
  requirement_version_id?: string;
  status: string;
  response_deadline?: string;
  disclosure_policy_json?: Record<string, unknown>;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierRfq {
  id: string;
  batch_id: string;
  supplier_id: string;
  status: string;
  last_follow_up_at?: string;
  response_received_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierResponse {
  id: string;
  supplier_rfq_id: string;
  status: string;
  comparability_status: string;
  raw_response_text?: string;
  normalized_data_json?: Record<string, unknown>;
  extraction_confidence?: number;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierResponseField {
  id: string;
  supplier_response_id: string;
  field_key: string;
  raw_value?: string;
  normalized_value?: string;
  currency?: string;
  unit?: string;
  confidence?: number;
  status: string;
  created_at: string;
}

export interface SupplierComparison {
  id: string;
  opportunity_id: string;
  requirement_version_id?: string;
  status: string;
  recommendation_json?: Record<string, unknown>;
  selected_supplier_id?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CostCalculation {
  id: string;
  opportunity_id: string;
  comparison_id?: string;
  formula_version: string;
  currency: string;
  inputs_json?: Record<string, unknown>;
  outputs_json?: Record<string, unknown>;
  warnings_json?: string[];
  created_by?: string;
  created_at: string;
}

export interface Quote {
  id: string;
  company_id: string;
  reference_number?: string;
  quote_number?: string;
  opportunity_id?: string;
  customer_id?: string;
  status: string;
  currency: string;
  incoterm?: string;
  payment_terms?: string;
  validity_days: number;
  total_amount?: number;
  total_cost?: number;
  total_margin?: number;
  margin_pct?: number;
  selected_supplier_quote_id?: string;
  customer_price?: number;
  valid_until?: string;
  customer_view_json?: Record<string, unknown>;
  internal_view_json?: Record<string, unknown>;
  pdf_storage_key?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteCostComponent {
  id: string;
  quote_id: string;
  company_id: string;
  component_name: string;
  label?: string;
  amount: number;
  currency: string;
  source: string;
  source_entity_type?: string;
  source_entity_id?: string;
  source_detail?: string;
  status: string;
  assumption_note?: string;
  confirmed: boolean;
  notes?: string;
  sort_order: number;
  created_at: string;
}

export interface SupplierQuote {
  id: string;
  company_id: string;
  supplier_rfq_id?: string;
  supplier_id: string;
  opportunity_id?: string;
  unit_price: number;
  currency: string;
  moq?: number;
  quantity_breaks?: unknown;
  tooling_cost?: number;
  sample_cost?: number;
  packaging_cost?: number;
  production_lead_time_days?: number;
  payment_terms?: string;
  incoterm?: string;
  notes?: string;
  status: string;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowUpSequence {
  id: string;
  company_id: string;
  name: string;
  trigger_type: string;
  status: string;
  steps_json?: unknown[];
  created_at: string;
  updated_at: string;
}

export interface FollowUpInstance {
  id: string;
  sequence_id: string;
  opportunity_id?: string;
  quote_id?: string;
  status: string;
  current_step: number;
  next_due_at?: string;
  paused_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id?: string;
  actor_name?: string;
  details_json?: Record<string, unknown>;
  created_at: string;
}
