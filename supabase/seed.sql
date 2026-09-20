-- TradeFlow v2 Demo Seed Data
-- Run with: supabase db seed

-- Demo Company
INSERT INTO companies (id, name, industry, status, default_currency, default_language, default_incoterm, default_payment_terms, minimum_margin_pct, quote_validity_days)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Pacific Trade Solutions',
  'Import/Export Trading',
  'active',
  'USD',
  'en',
  'FOB',
  '30% deposit, 70% before shipment',
  15,
  30
) ON CONFLICT (id) DO NOTHING;

-- Demo User (will be linked via auth on actual signup)
INSERT INTO users (id, email, company_id, name, role, is_active)
VALUES (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'demo@pacifictrade.com',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Demo User',
  'OWNER',
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- Demo Customers
INSERT INTO customers (id, company_id, legal_name, trading_name, contact_name, email, country, industry, currency)
VALUES
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Acme Corporation Ltd', 'Acme Corp', 'John Smith', 'john@acmecorp.com', 'US', 'Retail', 'USD'),
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Euro Trading GmbH', NULL, 'Hans Mueller', 'hans@eurotrading.de', 'DE', 'Wholesale', 'EUR')
ON CONFLICT (id) DO NOTHING;

-- Demo Suppliers
INSERT INTO suppliers (id, company_id, legal_name, trading_name, location, contact_name, contact_email, is_approved, certifications, notes)
VALUES
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Shenzhen Precision Manufacturing Co', 'SPM Manufacturing', 'Shenzhen, China', 'Wei Zhang', 'wei@spm.cn', TRUE, ARRAY['ISO 9001', 'CE'], 'Primary supplier for electronics'),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Guangzhou Hardware Industries', 'GHI Corp', 'Guangzhou, China', 'Li Chen', 'li@ghi.cn', TRUE, ARRAY['ISO 9001'], 'Good for metal components'),
  ('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Mumbai Exports Pvt Ltd', NULL, 'Mumbai, India', 'Raj Patel', 'raj@mumbaiexports.in', FALSE, ARRAY['ISO 9001', 'IATF 16949'], 'Potential new supplier - automotive parts')
ON CONFLICT (id) DO NOTHING;

-- Demo Products
INSERT INTO products (id, company_id, name, sku, category, unit, description)
VALUES
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'LED Panel Light 600x600', 'LED-PL-600', 'Lighting', 'pcs', '600x600mm LED panel for office ceiling, 40W, 4000K'),
  ('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Industrial Door Handle Set', 'DH-IND-01', 'Hardware', 'set', 'Stainless steel door handle set, grade 304')
ON CONFLICT (id) DO NOTHING;

-- Demo Inquiry with extracted fields
INSERT INTO inquiries (id, company_id, source_channel, sender_name, sender_email, subject, original_message, customer_id, processing_status, assigned_owner, priority, estimated_value, status, reference_number)
VALUES (
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b00',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'email',
  'John Smith',
  'john@acmecorp.com',
  'RFQ: LED Panel Lights - 500 units',
  'Hi, we are looking for 500 units of LED panel lights 600x600mm. Need FOB Shenzhen pricing. Please provide your best price and lead time. We need these delivered by end of Q2.',
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'new',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'high',
  15000.00,
  'new',
  'INQ-2024-001'
) ON CONFLICT (id) DO NOTHING;

-- Demo Supplier Quote
INSERT INTO supplier_quotes (id, company_id, supplier_id, unit_price, currency, moq, tooling_cost, sample_cost, packaging_cost, production_lead_time_days, payment_terms, incoterm, status)
VALUES (
  '11eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
  12.50,
  'USD',
  100,
  500.00,
  200.00,
  1.20,
  25,
  '30% deposit, 70% before shipment',
  'FOB',
  'submitted'
) ON CONFLICT (id) DO NOTHING;
