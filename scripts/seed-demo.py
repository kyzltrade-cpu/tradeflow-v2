#!/usr/bin/env python3
import json, subprocess
from datetime import datetime, timedelta, timezone

env = {}
with open("/Users/kylecheung/tradeflow-v2/.env.local") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k] = v.strip().strip('"').strip("'")

URL = env["NEXT_PUBLIC_SUPABASE_URL"]
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
CID = "de16b018-a635-4b45-a5ee-101dea1d66a1"
BASE = f"{URL}/rest/v1"

def post(table, data):
    r = subprocess.run([
        "curl", "-s", f"{BASE}/{table}",
        "-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}",
        "-H", "Content-Type: application/json", "-H", "Prefer: return=representation",
        "-d", json.dumps(data),
    ], capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError:
        return {"error": r.stdout[:300]}

def ok(label, resp):
    if isinstance(resp, list):
        print(f"  {len(resp)} {label} created")
    elif isinstance(resp, dict) and "message" in resp:
        print(f"  ERROR: {resp['message']}")
        if resp.get("details"):
            print(f"  Details: {resp['details'][:200]}")
    else:
        print(f"  ERROR: unexpected response")

print("Seeding TradeFlow v2 demo data...\n")

# 1. Suppliers
print("1/8 Suppliers...")
ok("suppliers", post("suppliers", [
    {"id":"a1000000-0000-4000-a000-000000000001","company_id":CID,"legal_name":"Shenzhen Precision Manufacturing Co","trading_name":"SPM Manufacturing","location":"Shenzhen, China","contact_name":"Wei Zhang","contact_email":"wei@spm.cn","contact_phone":None,"contact_wechat":None,"contact_whatsapp":None,"moq_notes":None,"typical_lead_time_days":None,"payment_terms":None,"product_capabilities":[],"is_approved":True,"certifications":["ISO 9001","CE"],"tags":[],"notes":"Primary supplier for electronics and LED products"},
    {"id":"a1000000-0000-4000-a000-000000000002","company_id":CID,"legal_name":"Guangzhou Hardware Industries","trading_name":"GHI Corp","location":"Guangzhou, China","contact_name":"Li Chen","contact_email":"li@ghi.cn","contact_phone":None,"contact_wechat":None,"contact_whatsapp":None,"moq_notes":None,"typical_lead_time_days":None,"payment_terms":None,"product_capabilities":[],"is_approved":True,"certifications":["ISO 9001"],"tags":[],"notes":"Reliable supplier for metal components and hardware"},
    {"id":"a1000000-0000-4000-a000-000000000003","company_id":CID,"legal_name":"Mumbai Exports Pvt Ltd","trading_name":None,"location":"Mumbai, India","contact_name":"Raj Patel","contact_email":"raj@mumbaiexports.in","contact_phone":None,"contact_wechat":None,"contact_whatsapp":None,"moq_notes":None,"typical_lead_time_days":None,"payment_terms":None,"product_capabilities":[],"is_approved":False,"certifications":["ISO 9001","IATF 16949"],"tags":[],"notes":"Potential new supplier - automotive parts, pending approval"},
]))

# 2. Customers
print("2/8 Customers...")
ok("customers", post("customers", [
    {"id":"b1000000-0000-4000-a000-000000000001","company_id":CID,"legal_name":"Acme Corporation Ltd","trading_name":"Acme Corp","email_domain":None,"country":"US","industry":"Retail","currency":"USD","preferred_language":"en","notes":"Major US retailer, bulk orders","tags":["vip"]},
    {"id":"b1000000-0000-4000-a000-000000000002","company_id":CID,"legal_name":"Euro Trading GmbH","trading_name":"Euro Trading","email_domain":None,"country":"DE","industry":"Wholesale","currency":"EUR","preferred_language":"de","notes":"European wholesale distributor","tags":[]},
]))

# 3. Products
print("3/8 Products...")
ok("products", post("products", [
    {"id":"c1000000-0000-4000-a000-000000000001","company_id":CID,"name":"LED Panel Light 600x600","description":"600x600mm LED panel for office ceiling, 40W, 4000K daylight white, CRI>90","category":"Lighting","moq":"100 pcs","price_range":"USD 10.00-15.00","price_currency":"USD","price_effective_date":None,"price_expiry_date":None,"last_supplier_confirmation":None,"specs":None,"materials":None,"dimensions":None,"tolerances":None,"packaging_req":None,"certifications":["CE","RoHS","UL"],"sample_policy":None,"default_lead_time_days":None,"approved_suppliers":[],"quote_assumptions":None,"product_docs":None,"requirement_template":None,"photos":None},
    {"id":"c1000000-0000-4000-a000-000000000002","company_id":CID,"name":"Industrial Door Handle Set","description":"Stainless steel 304 grade door handle set, satin finish, commercial grade","category":"Hardware","moq":"200 sets","price_range":"USD 6.00-10.00","price_currency":"USD","price_effective_date":None,"price_expiry_date":None,"last_supplier_confirmation":None,"specs":None,"materials":None,"dimensions":None,"tolerances":None,"packaging_req":None,"certifications":["CE"],"sample_policy":None,"default_lead_time_days":None,"approved_suppliers":[],"quote_assumptions":None,"product_docs":None,"requirement_template":None,"photos":None},
]))

# 4. Inquiries
print("4/8 Inquiries...")
ok("inquiries", post("inquiries", [
    {"id":"d1000000-0000-4000-a000-000000000001","company_id":CID,"source_channel":"email","provider_event_id":None,"sender_name":"John Smith","sender_email":"john@acmecorp.com","subject":"RFQ: LED Panel Lights - 500 units","original_message":"Hi, we are looking for 500 units of LED panel lights 600x600mm. Need FOB Shenzhen pricing.","customer_id":"b1000000-0000-4000-a000-000000000001","opportunity_id":None,"processing_status":"completed","assigned_owner":None,"priority":"high"},
    {"id":"d1000000-0000-4000-a000-000000000002","company_id":CID,"source_channel":"email","provider_event_id":None,"sender_name":"John Smith","sender_email":"john@acmecorp.com","subject":"Door Handle Bulk Order","original_message":"We need 500 sets of industrial door handles for our new commercial building project.","customer_id":"b1000000-0000-4000-a000-000000000001","opportunity_id":None,"processing_status":"completed","assigned_owner":None,"priority":"normal"},
    {"id":"d1000000-0000-4000-a000-000000000003","company_id":CID,"source_channel":"whatsapp","provider_event_id":None,"sender_name":"Hans Mueller","sender_email":"hans@eurotrading.de","subject":"Custom LED Panel - 200 units","original_message":"We are interested in 200 custom LED panels with our company branding.","customer_id":"b1000000-0000-4000-a000-000000000002","opportunity_id":None,"processing_status":"completed","assigned_owner":None,"priority":"high"},
]))

# 5. Opportunities (requires title)
print("5/8 Opportunities...")
ok("opportunities", post("opportunities", [
    {"id":"e1000000-0000-4000-a000-000000000001","company_id":CID,"title":"LED Panel Light - 500 units for Acme","inquiry_id":"d1000000-0000-4000-a000-000000000001","customer_id":"b1000000-0000-4000-a000-000000000001","stage":"sourcing","currency":"USD","priority":"high","next_action":"Collect supplier quotes"},
    {"id":"e1000000-0000-4000-a000-000000000002","company_id":CID,"title":"Door Handle Bulk Order - Acme","inquiry_id":"d1000000-0000-4000-a000-000000000002","customer_id":"b1000000-0000-4000-a000-000000000001","stage":"rfq_sent","currency":"USD","priority":"normal","next_action":"Await supplier responses"},
]))

# 6. Supplier RFQs
print("6/8 Supplier RFQs...")
ok("supplier_rfqs", post("supplier_rfqs", [
    {"id":"f2000000-0000-4000-a000-000000000001","company_id":CID,"supplier_id":"a1000000-0000-4000-a000-000000000001","opportunity_id":"e1000000-0000-4000-a000-000000000001","status":"response_received","rfq_number":"RFQ-001","subject":"LED Panel Light RFQ"},
    {"id":"f2000000-0000-4000-a000-000000000002","company_id":CID,"supplier_id":"a1000000-0000-4000-a000-000000000002","opportunity_id":"e1000000-0000-4000-a000-000000000002","status":"response_received","rfq_number":"RFQ-002","subject":"Door Handle RFQ"},
]))

# 7. Supplier Quotes
print("7/8 Supplier Quotes...")
ok("supplier_quotes", post("supplier_quotes", [
    {"id":"f3000000-0000-4000-a000-000000000001","company_id":CID,"supplier_rfq_id":"f2000000-0000-4000-a000-000000000001","supplier_id":"a1000000-0000-4000-a000-000000000001","opportunity_id":"e1000000-0000-4000-a000-000000000001","unit_price":12.50,"currency":"USD","moq":100,"production_lead_time_days":25,"payment_terms":"30% deposit, 70% before shipment","incoterm":"FOB","notes":"Standard LED panel","status":"submitted","is_selected":False,"tooling_cost":0,"sample_cost":50,"packaging_cost":0.5,"quantity_breaks":None},
    {"id":"f3000000-0000-4000-a000-000000000002","company_id":CID,"supplier_rfq_id":"f2000000-0000-4000-a000-000000000002","supplier_id":"a1000000-0000-4000-a000-000000000002","opportunity_id":"e1000000-0000-4000-a000-000000000002","unit_price":8.00,"currency":"USD","moq":200,"production_lead_time_days":20,"payment_terms":"30% deposit, 70% before shipment","incoterm":"FOB","notes":"SS304 door handle set","status":"submitted","is_selected":False,"tooling_cost":0,"sample_cost":30,"packaging_cost":0.3,"quantity_breaks":None},
]))

# 8. Quotes
print("8/8 Quotes...")
valid_until = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%dT00:00:00.000Z")
ok("quotes", post("quotes", [
    {"id":"f4000000-0000-4000-a000-000000000001","company_id":CID,"quote_number":"QT-2024-001","opportunity_id":"e1000000-0000-4000-a000-000000000001","customer_id":"b1000000-0000-4000-a000-000000000001","status":"draft","currency":"USD","incoterm":"FOB","payment_terms":"30% deposit, 70% before shipment","validity_days":30,"total_amount":15000,"total_cost":12500,"total_margin":2500,"margin_pct":16.7,"selected_supplier_quote_id":"f3000000-0000-4000-a000-000000000001","valid_until":valid_until},
    {"id":"f4000000-0000-4000-a000-000000000002","company_id":CID,"quote_number":"QT-2024-002","opportunity_id":"e1000000-0000-4000-a000-000000000002","customer_id":"b1000000-0000-4000-a000-000000000001","status":"sent","currency":"USD","incoterm":"FOB","payment_terms":"30% deposit, 70% before shipment","validity_days":30,"total_amount":8000,"total_cost":6400,"total_margin":1600,"margin_pct":20.0,"selected_supplier_quote_id":"f3000000-0000-4000-a000-000000000002","valid_until":valid_until},
]))

# Auth user
print("\nCreating demo auth user...")
r = subprocess.run([
    "curl", "-s", f"{URL}/auth/v1/admin/users",
    "-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}",
    "-H", "Content-Type: application/json",
    "-d", json.dumps({"email":"demo@hktrading.com","password":"Demo1234!","email_confirm":True}),
], capture_output=True, text=True)
try:
    auth = json.loads(r.stdout)
    auth_id = auth.get("id", "")
except Exception:
    auth_id = ""

if not auth_id:
    r2 = subprocess.run([
        "curl", "-s", f"{URL}/auth/v1/admin/users?email=demo%40hktrading.com",
        "-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}",
    ], capture_output=True, text=True)
    try:
        users = json.loads(r2.stdout).get("users", [])
        auth_id = users[0]["id"] if users else ""
    except Exception:
        pass
    if auth_id:
        print(f"  Auth user already exists: {auth_id}")
    else:
        print("  ERROR: Could not create auth user")
else:
    print(f"  Auth user created: {auth_id}")

if auth_id:
    post("users", [{"email":"demo@hktrading.com","company_id":CID,"role":"OWNER"}])
    print("  User record linked to HK Trading Co")

print("\n" + "="*60)
print("TradeFlow v2 demo data seeded successfully!")
print("="*60)
print(f"\nLogin: demo@hktrading.com / Demo1234!")
print(f"Company: HK Trading Co. ({CID})")
