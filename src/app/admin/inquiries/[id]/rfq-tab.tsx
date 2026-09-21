'use client';

import { useState } from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { SupplierRfqBatch, Supplier, Opportunity } from '@/lib/types';

interface SupplierSummary {
  id: string;
  batchId: string;
  supplierId: string;
  status: string;
  supplier?: Supplier;
  response?: unknown;
  responseReceivedAt?: string;
  lastFollowUpAt?: string;
}

/* ── Approval state badge ─────────────────────────────────────────────────── */

function ApprovalBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    draft: { label: 'Draft', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
    pending_approval: { label: 'Pending Approval', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    approved: { label: 'Approved', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    sending: { label: 'Sending', bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD' },
    sent: { label: 'Sent', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    responded: { label: 'Responded', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    response_incomplete: { label: 'Incomplete', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    expired: { label: 'Expired', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    closed: { label: 'Closed', bg: '#F3F4F6', fg: '#9CA3AF', border: '#D1D5DB' },
    delivery_failed: { label: 'Failed', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
  };
  const b = map[status] ?? map.draft;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {b.label}
    </span>
  );
}

/* ── Supplier matching score ──────────────────────────────────────────────── */

function matchScore(supplier: Supplier, opportunity?: Opportunity): number {
  let score = 0;
  if (supplier.verificationStatus === 'verified') score += 30;
  else if (supplier.verificationLevel === 'documents_received') score += 15;
  if (supplier.internalRating >= 4) score += 25;
  else if (supplier.internalRating >= 3) score += 15;
  if (supplier.specialties.some(s => s.toLowerCase().includes('bottle') || s.toLowerCase().includes('vacuum'))) score += 20;
  if (supplier.moq <= 10000) score += 15;
  if (supplier.leadTimeDays <= 25) score += 10;
  return Math.min(score, 100);
}

/* ── Disclosure policy options ────────────────────────────────────────────── */

const DISCLOSURE_OPTIONS = [
  { key: 'customer_name_hidden', label: 'Hide customer name', checked: true },
  { key: 'quantity_visible', label: 'Show quantity', checked: true },
  { key: 'destination_visible', label: 'Show destination', checked: true },
  { key: 'delivery_date_visible', label: 'Show delivery date', checked: true },
  { key: 'budget_hidden', label: 'Hide budget', checked: true },
];

/* ── RFQ Message Template ─────────────────────────────────────────────────── */

const RFQ_TEMPLATE = `Dear {supplier_name},

We are sourcing {product_type} for a customer requirement and would like to request your best pricing.

Product: {product_type}
Material: {material}
Quantity: {quantity}
Destination: {destination}
Delivery: {delivery_date}
Incoterm: {incoterm}

Please provide:
- Unit price (FOB/CIF)
- MOQ
- Lead time
- Payment terms
- Available certifications
- Packaging options

Please respond by {deadline}.

Best regards,
TradeFlow Sourcing Team`;

export function RFQTab({
  rfqBatch,
  supplierSummaries,
  suppliers,
  opportunity,
}: {
  rfqBatch: SupplierRfqBatch | null;
  supplierSummaries: SupplierSummary[];
  suppliers: Supplier[];
  opportunity?: Opportunity;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [rfqTemplate, setRfqTemplate] = useState(RFQ_TEMPLATE);
  const [deadline, setDeadline] = useState('2026-09-25');
  const [disclosurePolicy, setDisclosurePolicy] = useState(DISCLOSURE_OPTIONS);

  // Sort suppliers by match score
  const rankedSuppliers = [...suppliers]
    .map((s) => ({ ...s, score: matchScore(s, opportunity) }))
    .sort((a, b) => b.score - a.score);

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleDisclosure = (key: string) => {
    setDisclosurePolicy((prev) =>
      prev.map((d) => (d.key === key ? { ...d, checked: !d.checked } : d))
    );
  };

  return (
    <div className="space-y-6">
      {/* Existing RFQ Batch */}
      {rfqBatch && (
        <div className="rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                RFQ Batch: {rfqBatch.referenceNumber}
              </h3>
              <ApprovalBadge status={rfqBatch.status} />
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Deadline: {formatDate(rfqBatch.responseDeadline)}
            </div>
          </div>
          <div className="p-4">
            {/* Disclosure Policy */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Disclosure Policy
              </div>
              <div className="flex flex-wrap gap-2">
                {rfqBatch.disclosurePolicy.map((policy) => (
                  <span
                    key={policy}
                    className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}
                  >
                    {policy.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Supplier RFQs */}
            <div className="space-y-3">
              {supplierSummaries.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 rounded-[4px] border p-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                        {s.supplier?.name ?? 'Unknown'}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {s.supplier?.country}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {s.supplier?.contactName} · {s.supplier?.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {s.responseReceivedAt && (
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Responded {formatDate(s.responseReceivedAt)}
                      </span>
                    )}
                    {s.lastFollowUpAt && (
                      <span className="text-[11px]" style={{ color: 'var(--warning)' }}>
                        Followed up {formatDate(s.lastFollowUpAt)}
                      </span>
                    )}
                    <ApprovalBadge status={s.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create New RFQ Batch */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full rounded-[4px] border-2 border-dashed p-6 text-[13px] font-semibold transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-light)]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          + Create RFQ Batch
        </button>
      )}

      {showCreateForm && (
        <div className="rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
              Create RFQ Batch
            </h3>
          </div>
          <div className="p-4 space-y-6">
            {/* Step 1: Select Suppliers */}
            <div>
              <div className="text-[12px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Step 1: Select Suppliers
              </div>
              <div className="space-y-2">
                {rankedSuppliers.map((supplier) => (
                  <label
                    key={supplier.id}
                    className="flex items-center gap-3 rounded-[4px] border p-3 cursor-pointer transition-colors"
                    style={{
                      borderColor: selectedSuppliers.includes(supplier.id) ? 'var(--accent)' : 'var(--border)',
                      background: selectedSuppliers.includes(supplier.id) ? 'var(--accent-light)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSuppliers.includes(supplier.id)}
                      onChange={() => toggleSupplier(supplier.id)}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                          {supplier.name}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {supplier.country} · {supplier.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <span>Rating: {supplier.internalRating}/5</span>
                        <span>MOQ: {supplier.moq.toLocaleString()}</span>
                        <span>Lead: {supplier.leadTimeDays}d</span>
                        <span className={`font-medium ${supplier.verificationStatus === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {supplier.verificationStatus}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
                        Match: {supplier.score}%
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 2: RFQ Message Template */}
            <div>
              <div className="text-[12px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Step 2: RFQ Message Template
              </div>
              <textarea
                value={rfqTemplate}
                onChange={(e) => setRfqTemplate(e.target.value)}
                className="w-full rounded-[4px] border px-3 py-2 text-[13px] font-mono resize-y"
                style={{ borderColor: 'var(--border)', minHeight: 200 }}
              />
            </div>

            {/* Step 3: Disclosure Settings */}
            <div>
              <div className="text-[12px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Step 3: Disclosure Settings
              </div>
              <div className="space-y-2">
                {disclosurePolicy.map((option) => (
                  <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={option.checked}
                      onChange={() => toggleDisclosure(option.key)}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span className="text-[13px]" style={{ color: 'var(--text)' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 4: Response Deadline */}
            <div>
              <div className="text-[12px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Step 4: Response Deadline
              </div>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-[4px] border px-3 py-2 text-[13px]"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--accent)' }}
                disabled={selectedSuppliers.length === 0}
              >
                Send RFQ ({selectedSuppliers.length} suppliers)
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all"
                style={{ background: '#F3F4F6', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
