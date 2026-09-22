# TradeFlow Pivot — Function Layer Spec

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  Inbox │ Workspace │ Suppliers │ Quotes │ Cost Calc     │
├─────────────────────────────────────────────────────────┤
│                   API ROUTES (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│ /api/ai/*        │ /api/quotes/*    │ /api/cron/*       │
│ /api/inquiries/* │ /api/suppliers/* │ /api/webhooks/*   │
├─────────────────────────────────────────────────────────┤
│                  FUNCTION LAYER (lib/)                    │
├─────────────────────────────────────────────────────────┤
│ ai.ts              │ cost-engine.ts      │ email.ts      │
│ rfq-extraction.ts  │ quote-generator.ts  │ follow-up.ts  │
│ supplier-match.ts  │ audit.ts            │ approval.ts   │
├─────────────────────────────────────────────────────────┤
│              SUPABASE (PostgreSQL + RLS)                 │
├─────────────────────────────────────────────────────────┤
│  Resend (email)  │  NIM/OpenAI (AI)  │  Vercel (host)  │
└─────────────────────────────────────────────────────────┘
```

**Channel strategy:** Email = autonomous coordination. WhatsApp = manual paste only. WeChat = excluded.

---

## 1. Module Inventory

### Port from tradeflow-ai (production-ready, adapt to v2)

| Module | File | What to do |
|--------|------|------------|
| Cost engine | `lib/cost-engine.ts` | Port as-is. Already clean. |
| RFQ extraction | `lib/rfq-extraction.ts` | Port. Switch from NIM to OpenAI gpt-4o-mini. |
| Email sender | `lib/email.ts` | Port. Already Resend-based. |
| Follow-up engine | `lib/follow-up-engine.ts` | Port. Switch NIM → OpenAI. |
| Quote generator | `lib/quote-generator.ts` | Port logic. Replace raw PDF with @react-pdf/renderer or puppeteer. |
| Approval workflow | `lib/approval.ts` | Port from `/api/admin/quotes/[id]/approve/route.ts`. |
| Audit trail | `lib/audit.ts` | Port. Simple event logging. |

### Build new for v2

| Module | Purpose |
|--------|---------|
| `lib/supplier-match.ts` | Match inquiry requirements to supplier capabilities |
| `lib/clarification-drafter.ts` | Draft clarification questions from missing fields |
| `lib/comparison-engine.ts` | Normalize supplier responses, flag differences |
| `lib/inbound-email.ts` | Parse inbound email webhook into inquiry |

### Not needed (per spec)

| Module | Reason |
|--------|--------|
| `lib/ai.ts` (chat handler) | No WhatsApp API integration |
| `lib/supplier-discovery.ts` | No web scraping, use existing directory |
| WhatsApp webhook | Manual paste only |
| WeChat anything | Excluded |

---

## 2. Database Schema

### Tables to keep (already exist in tradeflow-ai)

```sql
-- Core entities
companies              -- tenant isolation
users                  -- linked to auth
customers              -- buyer records
contacts               -- people at customer/supplier companies
suppliers              -- supplier directory
products               -- product catalog

-- Inquiry flow
inquiries              -- raw inbound messages
inquiry_attachments    -- files attached to inquiries
extracted_fields       -- AI-extracted fields with source tracking
inquiry_versions       -- versioned requirement snapshots

-- Supplier RFQ
supplier_rfqs          -- RFQ batches to suppliers
supplier_quotes        -- supplier responses

-- Quoting
quotes                 -- customer quotes
quote_line_items       -- line items
quote_cost_components  -- cost breakdown
quote_versions         -- version history
quote_approvals        -- approval records

-- Follow-up
follow_up_sequences    -- sequence definitions
follow_up_items        -- individual follow-up actions

-- Operations
audit_events           -- full audit trail
workflow_jobs          -- async job tracking
```

### Tables to add

```sql
-- Clarification questions
CREATE TABLE clarification_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id),
  field_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, sent, answered
  sent_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  answer_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requirement versions (track changes as customer provides more info)
CREATE TABLE requirement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id),
  version_number INTEGER NOT NULL,
  fields JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, confirmed, superseded
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier response extraction
CREATE TABLE supplier_response_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_quote_id UUID NOT NULL REFERENCES supplier_quotes(id),
  field_key TEXT NOT NULL,
  raw_value TEXT,
  normalized_value TEXT,
  unit TEXT,
  confidence NUMERIC(3,2),
  status TEXT NOT NULL DEFAULT 'extracted', -- confirmed, extracted, inferred, missing
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Columns to add

```sql
-- inquiries: add clarification_status
ALTER TABLE inquiries ADD COLUMN clarification_status TEXT DEFAULT 'pending';
-- pending, draft, approved, sent, answered, none_needed

-- suppliers: add source tracking
ALTER TABLE suppliers ADD COLUMN source_type TEXT DEFAULT 'manual';
-- manual, imported, discovered

ALTER TABLE suppliers ADD COLUMN source_url TEXT;
ALTER TABLE suppliers ADD COLUMN source_evidence TEXT;

-- supplier_quotes: add extraction status
ALTER TABLE supplier_quotes ADD COLUMN extraction_status TEXT DEFAULT 'pending';
-- pending, processing, completed, failed

ALTER TABLE supplier_quotes ADD COLUMN raw_message TEXT;
ALTER TABLE supplier_quotes ADD COLUMN extracted_data JSONB;
```

---

## 3. API Routes

### AI Routes

| Route | Method | Purpose | Source |
|-------|--------|---------|--------|
| `/api/ai/extract` | POST | Extract fields from single inquiry | Port from v2, fix table refs |
| `/api/ai/extract-batch` | POST | Batch extract all pending inquiries | Port from v2 |
| `/api/ai/clarifications` | POST | Draft clarification questions | New |
| `/api/ai/extract-supplier` | POST | Extract fields from supplier response | New |
| `/api/ai/compare` | POST | Generate comparison analysis | New |
| `/api/ai/draft-quote` | POST | Draft customer quote text | New |

### Inquiry Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/inquiries` | GET | List inquiries for company |
| `/api/inquiries` | POST | Create inquiry (manual entry or webhook) |
| `/api/inquiries/[id]` | GET | Get inquiry with all related data |
| `/api/inquiries/[id]/clarifications` | GET/POST | List or create clarification questions |
| `/api/inquiries/[id]/clarifications/approve` | POST | Approve clarification batch |
| `/api/inquiries/[id]/requirements` | POST | Confirm requirement version |
| `/api/inquiries/[id]/suppliers` | POST | Match and select suppliers |

### Supplier RFQ Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/supplier-rfqs` | POST | Create RFQ batch |
| `/api/supplier-rfqs/[id]/send` | POST | Send RFQ via email (autonomous) |
| `/api/supplier-rfqs/[id]` | GET | Get RFQ batch with responses |
| `/api/supplier-rfqs/[id]/follow-up` | POST | Send follow-up to non-responders |
| `/api/supplier-quotes` | POST | Record supplier response (from email webhook) |
| `/api/supplier-quotes/[id]/extract` | POST | Extract fields from supplier response |
| `/api/supplier-quotes/[id]/normalize` | POST | Normalize for comparison |

### Quote Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/quotes` | POST | Create draft quote |
| `/api/quotes/[id]` | GET | Get quote with cost breakdown |
| `/api/quotes/[id]/approve` | POST | Request/approve/reject quote |
| `/api/quotes/[id]/send` | POST | Send approved quote to customer |
| `/api/quotes/[id]/pdf` | GET | Generate PDF |
| `/api/quotes/[id]/version` | POST | Create new version |

### Supplier Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/suppliers` | GET | List suppliers for company |
| `/api/suppliers` | POST | Add new supplier |
| `/api/suppliers/[id]` | GET | Get supplier with history |
| `/api/suppliers/[id]` | PUT | Update supplier |
| `/api/suppliers/match` | POST | Match suppliers to requirements |

### Follow-up Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/follow-ups` | POST | Create follow-up sequence |
| `/api/follow-ups/[id]/skip` | POST | Skip next follow-up |
| `/api/follow-ups/[id]/pause` | POST | Pause sequence |
| `/api/cron/follow-ups` | GET | Cron: process due follow-ups |

### Webhook Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhooks/email` | POST | Inbound email → create inquiry |
| `/api/webhooks/email` | GET | Verify webhook endpoint |

---

## 4. Function Layer Detail

### `lib/ai.ts` — AI Client (rewrite)

```typescript
// Unified AI client using OpenAI gpt-4o-mini
// Replaces tradeflow-ai's NIM-based ai.ts

interface AIExtractResult {
  fields: ExtractedField[];
  language: string;
  missing_fields: string[];
  inferred_fields: string[];
  inquiry_type: 'rfq' | 'po' | 'complaint' | 'follow_up' | 'other';
}

interface ExtractedField {
  field_key: string;
  field_label: string;
  raw_value: string;
  normalized_value: string;
  unit?: string;
  source_type: 'customer_message' | 'supplier_record' | 'historical_quote' | 'user_assumption' | 'unverified_inference';
  confidence: number;
  status: 'confirmed' | 'inferred' | 'missing';
  is_required: boolean;
}

// Functions:
extractFromInquiry(message: string, subject: string): Promise<AIExtractResult>
extractFromSupplierResponse(message: string, rfqContext: string): Promise<SupplierExtractResult>
draftClarifications(fields: ExtractedField[], productCategory: string): Promise<ClarificationDraft[]>
draftQuoteText(opportunity: Opportunity, costBuildup: CostBuildup): Promise<QuoteDraft>
compareSupplierResponses(responses: SupplierQuote[]): Promise<ComparisonResult>
classifyInquiry(message: string): Promise<InquiryType>
```

### `lib/cost-engine.ts` — Cost Calculator (port as-is)

Already production quality. Port directly. Key functions:

```typescript
calculateCostBuildup(inputs: CostInputs): CostBuildup
calculateMargin(buildup: CostBuildup, model: MarginModel): MarginResult
validateCostInputs(inputs: CostInputs, companyPolicy: CompanyPolicy): ValidationResult
convertCurrency(amount: number, from: string, to: string, rates: FXRates): number
```

### `lib/rfq-extraction.ts` — RFQ Extraction (port, swap NIM → OpenAI)

Port directly. Change the API call from NIM to OpenAI. Key functions:

```typescript
extractRFQFields(message: string, attachments?: Attachment[]): Promise<AIExtractResult>
classifyInquiryType(message: string): Promise<InquiryType>
identifyMissingFields(fields: ExtractedField[], category: string): MissingField[]
draftClarificationEmail(fields: ExtractedField[], missing: MissingField[]): string
```

### `lib/email.ts` — Email Sender (port as-is)

Already Resend-based. Port directly. Add:

```typescript
sendRFQToSupplier(supplier: Supplier, rfq: RFQBatch, inquiry: Inquiry): Promise<SendResult>
sendClarificationToCustomer(customer: Customer, questions: ClarificationQuestion[]): Promise<SendResult>
sendQuoteToCustomer(customer: Customer, quote: Quote, pdfAttachment: Buffer): Promise<SendResult>
sendFollowUp(recipient: Contact, message: string, subject: string): Promise<SendResult>
```

### `lib/supplier-match.ts` — Supplier Matching (new)

```typescript
// Match inquiry requirements to supplier capabilities
// No AI needed — deterministic matching

matchSuppliers(
  requirements: ExtractedField[],
  suppliers: Supplier[],
  options: { onlyApproved?: boolean; maxResults?: number }
): SupplierMatch[]

// Returns scored+sorted suppliers with match reasons
interface SupplierMatch {
  supplier: Supplier;
  score: number; // 0-100
  reasons: string[]; // "has ISO 9001", "location matches", "MOQ fits"
  warnings: string[]; // "no FDA cert", "lead time may be tight"
}
```

### `lib/comparison-engine.ts` — Supplier Comparison (new)

```typescript
// Normalize and compare supplier responses

compareSuppliers(quotes: SupplierQuote[]): ComparisonResult

interface ComparisonResult {
  suppliers: ComparisonSupplier[];
  warnings: ComparisonWarning[];
  recommendation: { supplierId: string; rationale: string };
}

interface ComparisonWarning {
  type: 'currency_mismatch' | 'incoterm_mismatch' | 'missing_cert' | 'high_price' | 'long_lead_time' | 'moq_exceeds';
  supplier_ids: string[];
  message: string;
  severity: 'info' | 'warning' | 'critical';
}
```

### `lib/clarification-drafter.ts` — Clarification Questions (new)

```typescript
// Draft clarification questions from missing/conflicting fields

draftQuestions(
  fields: ExtractedField[],
  productCategory: string,
  companyContext: string
): ClarificationQuestion[]

// Returns prioritized questions grouped by category
interface ClarificationQuestion {
  field_key: string;
  question: string;
  why: string; // "Required for accurate pricing" or "Missing for RFQ"
  priority: 'required' | 'recommended' | 'optional';
  category: 'specifications' | 'logistics' | 'commercial' | 'certifications';
}
```

### `lib/quote-generator.ts` — Quote Builder (port, replace PDF)

Port logic. Replace raw PDF with HTML-based PDF (already in v2) or @react-pdf/renderer.

```typescript
buildQuote(opportunity: Opportunity, costBuildup: CostBuildup, supplierSelection: SupplierSelection): Quote
generateQuoteNumber(): Promise<string> // QT-YYYY-NNNN
validateQuoteForSend(quote: Quote, policy: CompanyPolicy): ValidationResult
createQuoteVersion(quote: Quote): Promise<QuoteVersion>
```

### `lib/approval.ts` — Approval Workflow (port)

```typescript
requestApproval(quoteId: string, userId: string): Promise<ApprovalResult>
approveQuote(quoteId: string, userId: string, notes?: string): Promise<ApprovalResult>
rejectQuote(quoteId: string, userId: string, reason: string): Promise<ApprovalResult>

// State machine: DRAFT → IN_REVIEW → APPROVED/REJECTED
// Auto-approve if below company threshold
```

### `lib/follow-up.ts` — Follow-up Engine (port, swap NIM → OpenAI)

Port directly. Change NIM calls to OpenAI.

```typescript
createSequence(opportunityId: string): Promise<FollowUpSequence>
generateFollowUpMessage(context: FollowUpContext): Promise<string>
pauseSequence(sequenceId: string): Promise<void>
resumeSequence(sequenceId: string): Promise<void>
cancelSequence(sequenceId: string): Promise<void>
stopOnReply(sequenceId: string): Promise<void>
```

### `lib/audit.ts` — Audit Trail (port)

```typescript
logEvent(params: {
  company_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  details?: Record<string, unknown>;
}): Promise<void>
```

---

## 5. External Integrations

### Resend (Email)

- **Sending:** Already have `lib/email.ts` with Resend SDK
- **Inbound:** Use Resend Inbound Emails (webhook → `/api/webhooks/email`)
  - Each tenant gets a unique forwarding address: `inbound+{company_id}@resend.dev` (or custom domain)
  - Webhook parses: sender, subject, body, attachments
  - Creates inquiry record and triggers AI extraction
- **Setup:** Set `RESEND_API_KEY` in Vercel env

### OpenAI (AI)

- **Model:** gpt-4o-mini (cheapest, fast, good enough for extraction)
- **Usage:** All AI functions — extraction, classification, clarification drafting, comparison analysis, quote drafting
- **Setup:** Set `OPENAI_API_KEY` in Vercel env
- **Cost estimate:** ~$0.001 per inquiry extraction, ~$0.002 per supplier response extraction

### Supabase (Database)

- Already connected. Project: `ltbieoauffmkpkvkxerh`
- Need to run remaining migrations for new tables
- RLS policies per company_id

### Vercel (Hosting)

- Already deployed. Auto-deploys from GitHub push.

---

## 6. Environment Variables Needed

```
# Already set
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Need to set
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=whsec_...  # for inbound email verification
CRON_SECRET=...                   # for /api/cron/* endpoints
```

---

## 7. Migration Plan

### Phase 1: Core Infrastructure (do first)
1. Run new DB migrations (clarification_questions, requirement_versions, supplier_response_fields, new columns)
2. Port `lib/ai.ts` (OpenAI client)
3. Port `lib/cost-engine.ts`
4. Port `lib/email.ts`
5. Port `lib/audit.ts`

### Phase 2: Inquiry Flow
6. Port `lib/rfq-extraction.ts` (swap NIM → OpenAI)
7. Build `lib/clarification-drafter.ts`
8. Wire `/api/ai/extract` to correct tables
9. Wire `/api/webhooks/email` (Resend inbound)
10. Build inquiry workspace API routes

### Phase 3: Supplier Flow
11. Build `lib/supplier-match.ts`
12. Build supplier RFQ batch creation
13. Build supplier RFQ email sending
14. Build `lib/comparison-engine.ts`
15. Wire supplier response extraction

### Phase 4: Quote Flow
16. Port `lib/quote-generator.ts` (fix PDF)
17. Port `lib/approval.ts`
18. Build quote API routes
19. Wire cost calculator to quote builder

### Phase 5: Follow-up & Polish
20. Port `lib/follow-up.ts` (swap NIM → OpenAI)
21. Build cron endpoint
22. Build audit trail UI
23. End-to-end testing
