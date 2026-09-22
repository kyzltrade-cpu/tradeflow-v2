-- Migration 002: Knowledge Base, Citations, Disclosure Policy, Follow-Up Logic
-- Adds tables for Company Brain + citation tracking + follow-up automation

-- ============================================================
-- 1. KNOWLEDGE DOCUMENTS (Company Brain ingestion)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('file_upload', 'url_scrape', 'manual_entry', 'email_thread')),
  source_url TEXT,
  file_name TEXT,
  file_type TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'general', 'product_spec', 'supplier_info', 'pricing',
    'certifications', 'terms_conditions', 'faq', 'process'
  )),
  tags TEXT[] DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_documents_company_isolation"
  ON knowledge_documents FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_company ON knowledge_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category ON knowledge_documents(company_id, category);

-- ============================================================
-- 2. FAQ RULES (keyword-triggered responses)
-- ============================================================
CREATE TABLE IF NOT EXISTS faq_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  keywords TEXT[] NOT NULL,
  response_template TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE faq_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faq_rules_company_isolation"
  ON faq_rules FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_faq_rules_company ON faq_rules(company_id, is_active);

-- ============================================================
-- 3. CITATION SOURCES (where every price/data point came from)
-- ============================================================
CREATE TABLE IF NOT EXISTS citation_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'inquiry_field', 'supplier_response_field', 'cost_component',
    'quote_line', 'rfq_field', 'requirement'
  )),
  entity_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  value TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'customer_email', 'customer_file', 'supplier_quote',
    'supplier_email', 'market_data', 'internal_estimate',
    'exchange_rate_api', 'company_policy', 'assumption',
    'knowledge_base', 'user_confirmed'
  )),
  source_detail TEXT,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT DEFAULT 'extracted' CHECK (status IN (
    'extracted', 'confirmed', 'inferred', 'assumption', 'conflicting', 'rejected'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE citation_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "citation_sources_company_isolation"
  ON citation_sources FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_citation_sources_entity ON citation_sources(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_citation_sources_company ON citation_sources(company_id);

-- ============================================================
-- 4. DISCLOSURE POLICIES (per RFQ batch)
-- ============================================================
-- Add disclosure_policy column to existing supplier_rfq_batches
ALTER TABLE supplier_rfq_batches
  ADD COLUMN IF NOT EXISTS disclosure_policy JSONB DEFAULT '["customer_name_hidden"]'::jsonb,
  ADD COLUMN IF NOT EXISTS redacted_fields TEXT[] DEFAULT '{}';

-- ============================================================
-- 5. FOLLOW-UP SEQUENCES (enhance existing table)
-- ============================================================
-- Add fields for stop-on-reply and AI message generation
ALTER TABLE follow_up_sequences
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stop_on_reply BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS stop_on_outcome BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS message_template TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

ALTER TABLE follow_up_instances
  ADD COLUMN IF NOT EXISTS ai_draft_message TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN (
    'pending', 'approved', 'sent', 'cancelled', 'skipped'
  )),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stop_reason TEXT;

-- ============================================================
-- 6. OUTBOUND MESSAGES (draft queue for approval)
-- ============================================================
CREATE TABLE IF NOT EXISTS outbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  inquiry_id UUID REFERENCES inquiries(id),
  quote_id UUID REFERENCES quotes(id),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'wechat')),
  to_address TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  body_html TEXT,
  draft_status TEXT DEFAULT 'draft' CHECK (draft_status IN (
    'draft', 'pending_approval', 'approved', 'sent', 'failed', 'cancelled'
  )),
  ai_generated BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  citations JSONB DEFAULT '[]'::jsonb,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outbound_messages_company_isolation"
  ON outbound_messages FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_outbound_messages_company ON outbound_messages(company_id, draft_status);
CREATE INDEX IF NOT EXISTS idx_outbound_messages_inquiry ON outbound_messages(inquiry_id);

-- ============================================================
-- 7. PRODUCT REQUIREMENT TEMPLATES (per category)
-- ============================================================
CREATE TABLE IF NOT EXISTS requirement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  required_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  optional_fields JSONB DEFAULT '[]'::jsonb,
  field_definitions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE requirement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requirement_templates_company_isolation"
  ON requirement_templates FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_requirement_templates_company ON requirement_templates(company_id, category);
