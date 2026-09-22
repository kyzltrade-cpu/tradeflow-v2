'use client';

import { use } from 'react';
import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  draft: { label: 'Draft', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  pending_approval: { label: 'Pending Approval', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
  approved: { label: 'Approved', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  sent: { label: 'Sent', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  responded: { label: 'Responded', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  response_incomplete: { label: 'Incomplete', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
  expired: { label: 'Expired', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.draft;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

const DISCLOSURE_LABELS: Record<string, string> = {
  customer_name_hidden: '🔒 Customer name hidden',
  quantity_visible: '📦 Quantity visible',
  destination_visible: '🌍 Destination visible',
  delivery_date_visible: '📅 Delivery date visible',
  budget_hidden: '💰 Budget hidden',
};

const RFQ_TEMPLATE = `Dear {supplier_name},

We are sourcing {product_type} for a customer requirement and would like to request your best pricing.

Product: {product_type}
Material: {material}
Quantity: {quantity}
Destination: {destination}
Delivery: {delivery_date}
Incoterm: {incoterm}

Please provide:
1. Unit price (with volume breaks if available)
2. Lead time
3. MOQ
4. Payment terms
5. Certifications held
6. Sample availability

We look forward to your response.

Best regards,
{company_name}`;

export default function RfqBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLang();
  const { rfqBatch, suppliers, opportunity } = useDemo();

  const rfqs = rfqBatch.rfqs || [];
  const respondedCount = rfqs.filter((r: { status: string }) => r.status === 'responded').length;
  const incompleteCount = rfqs.filter((r: { status: string }) => r.status === 'response_incomplete').length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
        <Link href="/admin/rfq-batches" className="hover:underline">RFQ Batches</Link>
        <span>/</span>
        <span className="font-medium" style={{ color: 'var(--text)' }}>{rfqBatch.referenceNumber}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.5px]">{rfqBatch.referenceNumber}</h1>
            <StatusBadge status={rfqBatch.status} />
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {opportunity?.referenceNumber || 'TF-BATCH-0042'} — {respondedCount}/{rfqs.length} suppliers responded
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            Edit Template
          </button>
          <button className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
            Send to All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Main content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Response timeline */}
          <div className="rounded-[4px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              Supplier Responses
            </h2>
            <div className="space-y-3">
              {rfqs.map((rfq: { id: string; supplierId: string; status: string; responseReceivedAt?: string; createdAt: string }) => {
                const supplier = suppliers.find((s: { id: string }) => s.id === rfq.supplierId);
                const responseTime = rfq.responseReceivedAt
                  ? Math.round((new Date(rfq.responseReceivedAt).getTime() - new Date(rfq.createdAt).getTime()) / (1000 * 60 * 60))
                  : null;

                return (
                  <div key={rfq.id} className="flex items-center gap-4 p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: '#0A6E5C' }}>
                      {supplier?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold">{supplier?.name || 'Unknown'}</span>
                        <StatusBadge status={rfq.status} />
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {rfq.status === 'responded' && responseTime !== null
                          ? `Responded in ${responseTime}h`
                          : rfq.status === 'response_incomplete'
                          ? 'Response missing key fields'
                          : 'Awaiting response'}
                      </div>
                    </div>
                    {rfq.status === 'responded' && (
                      <Link href={`/admin/opportunities/${opportunity?.id || 'opp1'}/comparison`} className="text-[12px] font-medium hover:underline shrink-0" style={{ color: 'var(--accent)' }}>
                        View Response →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Message template */}
          <div className="rounded-[4px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              RFQ Message Template
            </h2>
            <div className="p-4 rounded-lg text-[12px] font-mono leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
              {RFQ_TEMPLATE}
            </div>
            <div className="mt-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Variables: {'{supplier_name}'}, {'{product_type}'}, {'{material}'}, {'{quantity}'}, {'{destination}'}, {'{delivery_date}'}, {'{incoterm}'}, {'{company_name}'}
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Batch info */}
          <div className="rounded-[4px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Batch Details</h3>
            <div className="space-y-3 text-[12px]">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Created</span>
                <span className="font-medium">{formatDate(rfqBatch.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Deadline</span>
                <span className="font-medium">{formatDate(rfqBatch.responseDeadline)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Approved by</span>
                <span className="font-medium">{rfqBatch.approvedBy || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Created by</span>
                <span className="font-medium">{rfqBatch.createdBy || '—'}</span>
              </div>
            </div>
          </div>

          {/* Disclosure policy */}
          <div className="rounded-[4px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Disclosure Policy</h3>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
              What suppliers can see about the customer inquiry:
            </p>
            <div className="space-y-2">
              {Object.entries(DISCLOSURE_LABELS).map(([key, label]) => {
                const isActive = rfqBatch.disclosurePolicy?.includes(key);
                return (
                  <div key={key} className="flex items-center gap-2 text-[12px]">
                    <div className="w-4 h-4 rounded border flex items-center justify-center" style={{ background: isActive ? '#0A6E5C' : 'var(--surface)', borderColor: isActive ? '#0A6E5C' : 'var(--border)' }}>
                      {isActive && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <span style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Response summary */}
          <div className="rounded-[4px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Response Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-lg" style={{ background: '#ECFDF5' }}>
                <div className="text-[18px] font-bold" style={{ color: '#038153' }}>{respondedCount}</div>
                <div className="text-[10px] font-medium" style={{ color: '#038153' }}>Complete</div>
              </div>
              <div className="p-2 rounded-lg" style={{ background: '#FFFBEB' }}>
                <div className="text-[18px] font-bold" style={{ color: '#D97706' }}>{incompleteCount}</div>
                <div className="text-[10px] font-medium" style={{ color: '#D97706' }}>Incomplete</div>
              </div>
              <div className="p-2 rounded-lg" style={{ background: '#F3F4F6' }}>
                <div className="text-[18px] font-bold" style={{ color: '#6B7280' }}>{rfqs.length - respondedCount - incompleteCount}</div>
                <div className="text-[10px] font-medium" style={{ color: '#6B7280' }}>Pending</div>
              </div>
            </div>
            {respondedCount >= 2 && (
              <Link href={`/admin/opportunities/${opportunity?.id || 'opp1'}/comparison`} className="mt-3 block w-full text-center py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
                View Comparison →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
