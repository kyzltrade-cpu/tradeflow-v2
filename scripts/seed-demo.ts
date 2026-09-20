import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../.env.local');
const env = readFileSync(envPath, 'utf-8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .reduce((acc, line) => {
    const [k, ...v] = line.split('=');
    acc[k.trim()] = v.join('=').trim();
    return acc;
  }, {} as Record<string, string>);

const URL = env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY!;

const COMPANY_ID = 'de16b018-a635-4b45-a5ee-101dea1d66a1';

function rest(table: string) {
  return `${URL}/rest/v1/${table}`;
}

async function upsert(table: string, rows: Record<string, unknown>[], conflictCols?: string) {
  const url = conflictCols
    ? `${rest(table)}?on_conflict=${conflictCols}`
    : rest(table);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ ${table} insert failed (${res.status}): ${text}`);
    return [];
  }
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function rpc(fn: string, body: Record<string, unknown>) {
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ RPC ${fn} failed (${res.status}): ${text}`);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function authCreateUser(email: string, password: string) {
  const res = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const text = await res.text();
  if (!res.ok) {
    // Check if user already exists
    if (text.includes('already') || text.includes('unique')) {
      console.log(`⚠️  Auth user ${email} already exists, fetching existing...`);
      const listRes = await fetch(`${URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      });
      const listText = await listRes.text();
      try {
        const users = JSON.parse(listText);
        if (users?.users?.length) return users.users[0];
      } catch {}
    }
    console.error(`❌ Auth user creation failed (${res.status}): ${text}`);
    return null;
  }
  return JSON.parse(text);
}

async function main() {
  console.log('🌱 Seeding TradeFlow v2 demo data...\n');

  // ─── Suppliers ───────────────────────────────────────────────────────────────
  console.log('1/6 Suppliers...');
  const suppliers = await upsert('suppliers', [
    {
      company_id: COMPANY_ID,
      legal_name: 'Shenzhen Precision Manufacturing Co',
      trading_name: 'SPM Manufacturing',
      location: 'Shenzhen, China',
      contact_name: 'Wei Zhang',
      contact_email: 'wei@spm.cn',
      is_approved: true,
      certifications: ['ISO 9001', 'CE'],
      notes: 'Primary supplier for electronics and LED products',
    },
    {
      company_id: COMPANY_ID,
      legal_name: 'Guangzhou Hardware Industries',
      trading_name: 'GHI Corp',
      location: 'Guangzhou, China',
      contact_name: 'Li Chen',
      contact_email: 'li@ghi.cn',
      is_approved: true,
      certifications: ['ISO 9001'],
      notes: 'Reliable supplier for metal components and hardware',
    },
    {
      company_id: COMPANY_ID,
      legal_name: 'Mumbai Exports Pvt Ltd',
      trading_name: null,
      location: 'Mumbai, India',
      contact_name: 'Raj Patel',
      contact_email: 'raj@mumbaiexports.in',
      is_approved: false,
      certifications: ['ISO 9001', 'IATF 16949'],
      notes: 'Potential new supplier - automotive parts, pending approval',
    },
  ]);
  console.log(`   ✓ ${suppliers.length} suppliers created`);
  const spmId = suppliers[0]?.id;
  const ghiId = suppliers[1]?.id;

  // ─── Customers ───────────────────────────────────────────────────────────────
  console.log('2/6 Customers...');
  const customers = await upsert('customers', [
    {
      company_id: COMPANY_ID,
      legal_name: 'Acme Corporation Ltd',
      trading_name: 'Acme Corp',
      contact_name: 'John Smith',
      email: 'john@acmecorp.com',
      country: 'US',
      industry: 'Retail',
      currency: 'USD',
    },
    {
      company_id: COMPANY_ID,
      legal_name: 'Euro Trading GmbH',
      trading_name: null,
      contact_name: 'Hans Mueller',
      email: 'hans@eurotrading.de',
      country: 'DE',
      industry: 'Wholesale',
      currency: 'EUR',
    },
  ]);
  console.log(`   ✓ ${customers.length} customers created`);
  const acmeId = customers[0]?.id;
  const euroId = customers[1]?.id;

  // ─── Products ────────────────────────────────────────────────────────────────
  console.log('3/6 Products...');
  const products = await upsert('products', [
    {
      company_id: COMPANY_ID,
      name: 'LED Panel Light 600x600',
      description: '600x600mm LED panel for office ceiling, 40W, 4000K daylight white, CRI>90',
      category: 'Lighting',
      moq: '100 pcs',
      price_range: 'USD 10.00–15.00',
      price_currency: 'USD',
      specs: { sku: 'LED-PL-600', unit: 'pcs', wattage: '40W', color_temp: '4000K', cri: '>90', size: '600x600mm' },
      certifications: ['CE', 'RoHS', 'UL'],
    },
    {
      company_id: COMPANY_ID,
      name: 'Industrial Door Handle Set',
      description: 'Stainless steel 304 grade door handle set, satin finish, commercial grade',
      category: 'Hardware',
      moq: '200 sets',
      price_range: 'USD 6.00–10.00',
      price_currency: 'USD',
      specs: { sku: 'DH-IND-01', unit: 'set', material: 'SS 304', finish: 'satin', grade: 'commercial' },
      certifications: ['CE'],
    },
  ]);
  console.log(`   ✓ ${products.length} products created`);

  // ─── Inquiries ───────────────────────────────────────────────────────────────
  console.log('4/6 Inquiries...');
  const inquiries = await upsert('inquiries', [
    {
      company_id: COMPANY_ID,
      source_channel: 'email',
      sender_name: 'John Smith',
      sender_email: 'john@acmecorp.com',
      subject: 'RFQ: LED Panel Lights - 500 units',
      original_message:
        'Hi, we are looking for 500 units of LED panel lights 600x600mm. Need FOB Shenzhen pricing. Please provide your best price and lead time. We need these delivered by end of Q2.',
      customer_id: acmeId,
      processing_status: 'completed',
      assigned_owner: null,
      priority: 'high',
      estimated_value: 15000,
      status: 'new',
      reference_number: 'INQ-2024-001',
      category: 'Lighting',
      urgency: 'high',
      next_action: 'Collect requirements from customer',
    },
    {
      company_id: COMPANY_ID,
      source_channel: 'email',
      sender_name: 'John Smith',
      sender_email: 'john@acmecorp.com',
      subject: 'Door Handle Bulk Order',
      original_message:
        'We need 500 sets of industrial door handles for our new commercial building project. Please send pricing for SS304 grade, satin finish.',
      customer_id: acmeId,
      processing_status: 'completed',
      assigned_owner: null,
      priority: 'normal',
      estimated_value: 8000,
      status: 'needs_clarification',
      reference_number: 'INQ-2024-002',
      category: 'Hardware',
      urgency: 'normal',
      next_action: 'Clarify exact specifications with customer',
    },
    {
      company_id: COMPANY_ID,
      source_channel: 'whatsapp',
      sender_name: 'Hans Mueller',
      sender_email: 'hans@eurotrading.de',
      subject: 'Custom LED Panel - 200 units',
      original_message:
        'We are interested in 200 custom LED panels with our company branding. Can you provide samples first? Need FOB Guangzhou pricing.',
      customer_id: euroId,
      processing_status: 'completed',
      assigned_owner: null,
      priority: 'high',
      estimated_value: 5000,
      status: 'requirements_confirmed',
      reference_number: 'INQ-2024-003',
      category: 'Lighting',
      urgency: 'high',
      next_action: 'Send RFQ to suppliers',
    },
  ]);
  console.log(`   ✓ ${inquiries.length} inquiries created`);

  // ─── Supplier Quotes ─────────────────────────────────────────────────────────
  console.log('5/6 Supplier Quotes...');
  const supplierQuotes = await upsert('supplier_quotes', [
    {
      company_id: COMPANY_ID,
      supplier_id: spmId,
      unit_price: 12.5,
      currency: 'USD',
      moq: 100,
      production_lead_time_days: 25,
      payment_terms: '30% deposit, 70% before shipment',
      incoterm: 'FOB',
      tooling_cost: 0,
      sample_cost: 50,
      packaging_cost: 0.5,
      notes: 'Standard LED panel, 40W, 4000K. Price includes basic packaging.',
      status: 'submitted',
      is_selected: false,
    },
    {
      company_id: COMPANY_ID,
      supplier_id: ghiId,
      unit_price: 8.0,
      currency: 'USD',
      moq: 200,
      production_lead_time_days: 20,
      payment_terms: '30% deposit, 70% before shipment',
      incoterm: 'FOB',
      tooling_cost: 0,
      sample_cost: 30,
      packaging_cost: 0.3,
      notes: 'SS304 door handle set, satin finish. Bulk pricing for 200+ units.',
      status: 'submitted',
      is_selected: false,
    },
  ]);
  console.log(`   ✓ ${supplierQuotes.length} supplier quotes created`);
  const spmSqId = supplierQuotes[0]?.id;
  const ghiSqId = supplierQuotes[1]?.id;

  // ─── Quotes ──────────────────────────────────────────────────────────────────
  console.log('6/6 Quotes...');
  const quotes = await upsert('quotes', [
    {
      company_id: COMPANY_ID,
      reference_number: 'INQ-2024-001',
      quote_number: 'QT-2024-001',
      customer_id: acmeId,
      status: 'draft',
      currency: 'USD',
      incoterm: 'FOB',
      payment_terms: '30% deposit, 70% before shipment',
      validity_days: 30,
      total_amount: 15000,
      total_cost: 12500,
      total_margin: 2500,
      margin_pct: 16.7,
      selected_supplier_quote_id: spmSqId,
      customer_price: 30.0,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      customer_view_json: {
        product: 'LED Panel Light 600x600',
        quantity: 500,
        unit_price: 30.0,
        total: 15000,
        delivery: '25 working days after order confirmation',
      },
      internal_view_json: {
        supplier: 'SPM Manufacturing',
        supplier_unit_cost: 12.5,
        margin: '16.7%',
        notes: 'Good margin, reliable supplier',
      },
    },
    {
      company_id: COMPANY_ID,
      reference_number: 'INQ-2024-002',
      quote_number: 'QT-2024-002',
      customer_id: acmeId,
      status: 'sent',
      currency: 'USD',
      incoterm: 'FOB',
      payment_terms: '30% deposit, 70% before shipment',
      validity_days: 30,
      total_amount: 8000,
      total_cost: 6400,
      total_margin: 1600,
      margin_pct: 20.0,
      selected_supplier_quote_id: ghiSqId,
      customer_price: 16.0,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      sent_at: new Date().toISOString(),
      customer_view_json: {
        product: 'Industrial Door Handle Set',
        quantity: 500,
        unit_price: 16.0,
        total: 8000,
        delivery: '20 working days after order confirmation',
      },
      internal_view_json: {
        supplier: 'GHI Corp',
        supplier_unit_cost: 8.0,
        margin: '20.0%',
        notes: 'Strong margin, awaiting customer response',
      },
    },
  ]);
  console.log(`   ✓ ${quotes.length} quotes created`);

  // ─── Auth User ───────────────────────────────────────────────────────────────
  console.log('\n🔐 Creating demo auth user...');
  const authUser = await authCreateUser('demo@hktrading.com', 'Demo1234!');
  if (authUser?.id) {
    console.log(`   ✓ Auth user created: ${authUser.id}`);

    // Create or update user record linked to HK Trading Co
    const userRows = await upsert('users', [
      {
        email: 'demo@hktrading.com',
        company_id: COMPANY_ID,
        role: 'OWNER',
      },
    ], 'email');
    console.log(`   ✓ User record linked to HK Trading Co`);
  } else {
    console.log('   ⚠️  Could not create auth user, skipping user link');
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('✅ TradeFlow v2 demo data seeded successfully!');
  console.log('═'.repeat(60));
  console.log('\n📊 Data inserted:');
  console.log(`   • ${suppliers.length} suppliers (SPM, GHI, Mumbai Exports)`);
  console.log(`   • ${customers.length} customers (Acme Corp, Euro Trading)`);
  console.log(`   • ${products.length} products (LED Panel, Door Handle)`);
  console.log(`   • ${inquiries.length} inquiries (INQ-2024-001 through 003)`);
  console.log(`   • ${supplierQuotes.length} supplier quotes (SPM, GHI)`);
  console.log(`   • ${quotes.length} quotes (QT-2024-001, QT-2024-002)`);
  console.log(`   • 1 auth user + user record`);
  console.log('\n🔑 Login credentials:');
  console.log('   Email:    demo@hktrading.com');
  console.log('   Password: Demo1234!');
  console.log(`   Company:  HK Trading Co. (${COMPANY_ID})`);
}

main().catch((err) => {
  console.error('💥 Seed failed:', err);
  process.exit(1);
});
