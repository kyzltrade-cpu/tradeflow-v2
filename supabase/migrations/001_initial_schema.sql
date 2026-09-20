-- TradeFlow v2 Production Schema
-- Aligned with existing tradeflow-ai Supabase schema (company_id, not tenant_id)

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp_number TEXT,
  industry TEXT,
  status TEXT DEFAULT 'active',
  default_currency TEXT DEFAULT 'USD',
  default_language TEXT DEFAULT 'en',
  default_incoterm TEXT DEFAULT 'FOB',
  default_payment_terms TEXT DEFAULT '30% deposit, 70% before shipment',
  minimum_margin_pct NUMERIC DEFAULT 15,
  quote_validity_days INTEGER DEFAULT 30,
  approval_threshold NUMERIC DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT DEFAULT 'OPERATOR' CHECK (role IN ('OWNER','ADMIN','MANAGER','OPERATOR','VIEWER')),
  locale TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  industry TEXT,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  location TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  certifications TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  unit TEXT DEFAULT 'pcs',
  description TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  source_channel TEXT DEFAULT 'email',
  subject TEXT,
  status TEXT DEFAULT 'open',
  assigned_user_id UUID REFERENCES users(id),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'email',
  sender_name TEXT,
  sender_email TEXT,
  recipient_address TEXT,
  subject TEXT,
  body_text TEXT,
  body_html_sanitized TEXT,
  direction TEXT DEFAULT 'inbound',
  classification TEXT,
  classification_confidence NUMERIC,
  processing_status TEXT DEFAULT 'pending',
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_channel TEXT DEFAULT 'email',
  provider_event_id TEXT,
  sender_name TEXT,
  sender_email TEXT,
  subject TEXT,
  original_message TEXT,
  customer_id UUID REFERENCES customers(id),
  opportunity_id UUID,
  reference_number TEXT,
  processing_status TEXT DEFAULT 'new',
  assigned_owner UUID REFERENCES users(id),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  estimated_value NUMERIC,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','needs_clarification','clarification_sent','requirements_confirmed','supplier_outreach_pending','supplier_outreach_approved','rfq_sent','responses_in','comparison_ready','quote_draft','quote_pending_approval','quote_sent','won','lost','expired','on_hold')),
  category TEXT,
  urgency TEXT DEFAULT 'normal',
  next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  UNIQUE(company_id, reference_number)
);

-- Inquiry Fields (extracted from emails)
CREATE TABLE IF NOT EXISTS inquiry_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_label TEXT,
  raw_value TEXT,
  normalized_value TEXT,
  unit TEXT,
  source_type TEXT DEFAULT 'extracted',
  source_message_id UUID REFERENCES messages(id),
  confidence NUMERIC DEFAULT 0.8,
  status TEXT DEFAULT 'extracted' CHECK (status IN ('extracted','confirmed','missing','inferred','conflicting')),
  is_required BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requirement Versions
CREATE TABLE IF NOT EXISTS requirement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  opportunity_id UUID,
  version_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','locked')),
  snapshot_json JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reference_number TEXT NOT NULL,
  inquiry_id UUID REFERENCES inquiries(id),
  customer_id UUID REFERENCES customers(id),
  stage TEXT DEFAULT 'new' CHECK (stage IN ('new','qualified','sourcing','rfq_sent','responses_received','comparison_ready','quote_draft','pending_approval','sent','negotiation','won','lost','expired')),
  status TEXT DEFAULT 'active',
  estimated_value NUMERIC,
  currency TEXT DEFAULT 'USD',
  target_margin_percentage NUMERIC,
  owner_id UUID REFERENCES users(id),
  next_action TEXT,
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, reference_number)
);

-- Supplier RFQ Batches
CREATE TABLE IF NOT EXISTS supplier_rfq_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reference_number TEXT NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id),
  requirement_version_id UUID REFERENCES requirement_versions(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','sent','partially_received','received','closed')),
  response_deadline TIMESTAMPTZ,
  disclosure_policy_json JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier RFQs (individual)
CREATE TABLE IF NOT EXISTS supplier_rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES supplier_rfq_batches(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','followed_up','response_received','cancelled')),
  last_follow_up_at TIMESTAMPTZ,
  response_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Responses
CREATE TABLE IF NOT EXISTS supplier_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_rfq_id UUID NOT NULL REFERENCES supplier_rfqs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','received','incomplete','selected','rejected')),
  comparability_status TEXT DEFAULT 'unknown',
  raw_response_text TEXT,
  normalized_data_json JSONB DEFAULT '{}'::jsonb,
  extraction_confidence NUMERIC,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Response Fields
CREATE TABLE IF NOT EXISTS supplier_response_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_response_id UUID NOT NULL REFERENCES supplier_responses(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  raw_value TEXT,
  normalized_value TEXT,
  currency TEXT,
  unit TEXT,
  confidence NUMERIC,
  status TEXT DEFAULT 'extracted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Comparisons
CREATE TABLE IF NOT EXISTS supplier_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  requirement_version_id UUID REFERENCES requirement_versions(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','ready_for_review','approved','supplier_selected')),
  recommendation_json JSONB DEFAULT '{}'::jsonb,
  selected_supplier_id UUID REFERENCES suppliers(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost Calculations
CREATE TABLE IF NOT EXISTS cost_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  comparison_id UUID REFERENCES supplier_comparisons(id),
  formula_version TEXT DEFAULT '1.0',
  currency TEXT DEFAULT 'USD',
  inputs_json JSONB DEFAULT '{}'::jsonb,
  outputs_json JSONB DEFAULT '{}'::jsonb,
  warnings_json JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reference_number TEXT,
  quote_number TEXT,
  opportunity_id UUID REFERENCES opportunities(id),
  customer_id UUID REFERENCES customers(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','sending','sent','viewed','negotiation','accepted','rejected','expired','cancelled')),
  currency TEXT DEFAULT 'USD',
  incoterm TEXT,
  payment_terms TEXT,
  validity_days INTEGER DEFAULT 30,
  total_amount NUMERIC,
  total_cost NUMERIC,
  total_margin NUMERIC,
  margin_pct NUMERIC,
  selected_supplier_quote_id UUID,
  customer_price NUMERIC,
  valid_until TIMESTAMPTZ,
  customer_view_json JSONB DEFAULT '{}'::jsonb,
  internal_view_json JSONB DEFAULT '{}'::jsonb,
  pdf_storage_key TEXT,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, quote_number)
);

-- Quote Cost Components
CREATE TABLE IF NOT EXISTS quote_cost_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  label TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  source TEXT DEFAULT 'user_entered',
  source_entity_type TEXT,
  source_entity_id UUID,
  source_detail TEXT,
  status TEXT DEFAULT 'extracted',
  assumption_note TEXT,
  confirmed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Quotes
CREATE TABLE IF NOT EXISTS supplier_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_rfq_id UUID REFERENCES supplier_rfqs(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  opportunity_id UUID REFERENCES opportunities(id),
  unit_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  moq INTEGER,
  quantity_breaks JSONB,
  tooling_cost NUMERIC DEFAULT 0,
  sample_cost NUMERIC DEFAULT 0,
  packaging_cost NUMERIC DEFAULT 0,
  production_lead_time_days INTEGER,
  payment_terms TEXT,
  incoterm TEXT,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','shortlisted','selected','rejected')),
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up Sequences
CREATE TABLE IF NOT EXISTS follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT DEFAULT 'quote_sent',
  status TEXT DEFAULT 'active',
  steps_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up Instances
CREATE TABLE IF NOT EXISTS follow_up_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES follow_up_sequences(id),
  opportunity_id UUID REFERENCES opportunities(id),
  quote_id UUID REFERENCES quotes(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  current_step INTEGER DEFAULT 0,
  next_due_at TIMESTAMPTZ,
  paused_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_name TEXT,
  details_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Runs
CREATE TABLE IF NOT EXISTS ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL,
  model_provider TEXT,
  model_name TEXT,
  prompt_version TEXT,
  input_entity_type TEXT,
  input_entity_id UUID,
  input_hash TEXT,
  output_json JSONB,
  confidence_json JSONB,
  tokens_or_usage_json JSONB,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outbound Messages
CREATE TABLE IF NOT EXISTS outbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'email',
  provider TEXT,
  recipient TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachment_storage_keys JSONB DEFAULT '[]'::jsonb,
  approval_status TEXT DEFAULT 'pending',
  send_status TEXT DEFAULT 'draft',
  provider_message_id TEXT,
  failure_reason TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Exchange Rates Cache
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  source TEXT DEFAULT 'openexchangerates',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(base_currency, target_currency, fetched_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_company ON inquiries(company_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_company ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_supplier_responses_rfq ON supplier_responses(supplier_rfq_id);
CREATE INDEX IF NOT EXISTS idx_quote_cost_components_quote ON quote_cost_components(quote_id);
CREATE INDEX IF NOT EXISTS idx_supplier_quotes_company ON supplier_quotes(company_id);

-- Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_rfq_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_response_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_cost_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (company isolation)
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company users" ON users
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company customers" ON customers
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company suppliers" ON suppliers
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company products" ON products
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company conversations" ON conversations
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company messages" ON messages
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company inquiries" ON inquiries
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company inquiry_fields" ON inquiry_fields
  FOR SELECT USING (inquiry_id IN (SELECT id FROM inquiries WHERE company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid())));

CREATE POLICY "Users can view own company requirement_versions" ON requirement_versions
  FOR SELECT USING (inquiry_id IN (SELECT id FROM inquiries WHERE company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid())));

CREATE POLICY "Users can view own company opportunities" ON opportunities
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company supplier_rfq_batches" ON supplier_rfq_batches
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company supplier_rfqs" ON supplier_rfqs
  FOR SELECT USING (batch_id IN (SELECT id FROM supplier_rfq_batches WHERE company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid())));

CREATE POLICY "Users can view own company supplier_responses" ON supplier_responses
  FOR SELECT USING (supplier_rfq_id IN (SELECT id FROM supplier_rfqs WHERE batch_id IN (SELECT id FROM supplier_rfq_batches WHERE company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()))));

CREATE POLICY "Users can view own company supplier_response_fields" ON supplier_response_fields
  FOR SELECT USING (supplier_response_id IN (SELECT id FROM supplier_responses WHERE supplier_rfq_id IN (SELECT id FROM supplier_rfqs WHERE batch_id IN (SELECT id FROM supplier_rfq_batches WHERE company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid())))));

CREATE POLICY "Users can view own company supplier_comparisons" ON supplier_comparisons
  FOR SELECT USING (opportunity_id IN (SELECT id FROM opportunities WHERE company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid())));

CREATE POLICY "Users can view own company cost_calculations" ON cost_calculations
  FOR SELECT USING (opportunity_id IN (SELECT id FROM opportunities WHERE company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid())));

CREATE POLICY "Users can view own company quotes" ON quotes
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company quote_cost_components" ON quote_cost_components
  FOR SELECT USING (quote_id IN (SELECT id FROM quotes WHERE company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid())));

CREATE POLICY "Users can view own company supplier_quotes" ON supplier_quotes
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company follow_up_sequences" ON follow_up_sequences
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company follow_up_instances" ON follow_up_instances
  FOR SELECT USING (quote_id IN (SELECT id FROM quotes WHERE company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid())));

CREATE POLICY "Users can view own company audit_events" ON audit_events
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company ai_runs" ON ai_runs
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own company outbound_messages" ON outbound_messages
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Anyone can view exchange rates" ON exchange_rates FOR SELECT USING (TRUE);
