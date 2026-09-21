'use client';

import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Quote, CostCalculation, Customer, Opportunity } from '@/lib/types';

/* ── Approval state badge ─────────────────────────────────────────────────── */

function ApprovalBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    draft: { label: 'Draft', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
    pending_approval: { label: 'Pending Approval', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    approved: { label: 'Approved', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    sending: { label: 'Sending', bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD' },
    sent: { label: 'Sent', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    failed: { label: 'Failed', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
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

/* ── Source badge for cost components ─────────────────────────────────────── */

function SourceBadge({ source, confirmed }: { source: string; confirmed: boolean }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    supplier_quote: { label: 'Supplier quote', bg: '#ECFDF5', fg: '#038153' },
    user_entered: { label: 'User entered', bg: '#FFF7ED', fg: '#9A3412' },
    external_estimate: { label: 'External estimate', bg: '#EFF6FF', fg: '#1E40AF' },
    system_default: { label: 'System default', bg: '#F3F4F6', fg: '#6B7280' },
  };
  const b = map[source] ?? map.system_default;
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: b.bg, color: b.fg }}
    >
      {confirmed ? '✓' : '⚠️'} {b.label}
    </span>
  );
}

/* ── Margin indicator ─────────────────────────────────────────────────────── */

function MarginIndicator({ margin, minimum }: { margin: number; minimum: number }) {
  const isAbove = margin >= minimum;
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[14px] font-bold"
        style={{ color: isAbove ? 'var(--success)' : 'var(--error)' }}
      >
        {margin.toFixed(1)}%
      </span>
      <span
        className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
        style={{
          background: isAbove ? '#ECFDF5' : '#FEF2F2',
          color: isAbove ? '#038153' : '#CC3340',
          border: `1px solid ${isAbove ? '#A7F3D0' : '#FECACA'}`,
        }}
      >
        {isAbove ? '✅ Above minimum' : '❌ Below minimum'}
      </span>
    </div>
  );
}

export function QuoteTab({
  quote,
  costCalculation,
  customer,
  opportunity,
}: {
  quote: Quote | null;
  costCalculation: CostCalculation;
  customer?: Customer;
  opportunity?: Opportunity;
}) {
  const [viewMode, setViewMode] = useState<'internal' | 'customer'>('internal');

  if (!quote) {
    return (
      <div className="rounded-[4px] border p-12 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
          No quote yet
        </h3>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Create a quote after selecting a supplier from the comparison.
        </p>
      </div>
    );
  }

  const margin = quote.internalView.marginPercent;
  const minimumMargin = opportunity?.targetMarginPercent ?? 25;

  return (
    <div className="space-y-6">
      {/* View mode toggle */}
      <div className="flex items-center gap-0.5 rounded-[4px] border p-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button
          onClick={() => setViewMode('internal')}
          className="rounded-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors"
          style={{
            background: viewMode === 'internal' ? 'var(--accent)' : 'transparent',
            color: viewMode === 'internal' ? '#fff' : 'var(--text-muted)',
          }}
        >
          Internal Review
        </button>
        <button
          onClick={() => setViewMode('customer')}
          className="rounded-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors"
          style={{
            background: viewMode === 'customer' ? 'var(--accent)' : 'transparent',
            color: viewMode === 'customer' ? '#fff' : 'var(--text-muted)',
          }}
        >
          Customer Preview
        </button>
      </div>

      {/* Quote header */}
      <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>
              {quote.referenceNumber}
            </span>
            <ApprovalBadge status={quote.status} />
          </div>
          <div className="text-right">
            <div className="text-[18px] font-bold" style={{ color: 'var(--accent)' }}>
              {formatCurrency(quote.customerPrice, quote.currency)}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Valid until {formatDate(quote.validUntil)}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ INTERNAL VIEW ═══════════════════════════════════════════════ */}
      {viewMode === 'internal' && (
        <>
          {/* Cost Breakdown Table */}
          <div className="rounded-[4px] border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                Cost Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="px-4 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Component</th>
                    <th className="px-4 py-2 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Amount</th>
                    <th className="px-4 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.internalView.costBreakdown.map((line) => (
                    <tr key={line.key} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text)' }}>{line.label}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: 'var(--text)' }}>
                        {formatCurrency(line.amount, quote.currency)}
                      </td>
                      <td className="px-4 py-2.5">
                        <SourceBadge source={line.source} confirmed={line.confirmed} />
                      </td>
                    </tr>
                  ))}
                  {/* Subtotal */}
                  <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--text)' }}>Total Cost</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                      {formatCurrency(quote.internalView.supplierCost, quote.currency)}
                    </td>
                    <td></td>
                  </tr>
                  {/* Margin */}
                  <tr>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--text)' }}>Margin ({margin.toFixed(1)}%)</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums" style={{ color: 'var(--success)' }}>
                      {formatCurrency(quote.customerPrice - quote.internalView.supplierCost, quote.currency)}
                    </td>
                    <td></td>
                  </tr>
                  {/* Customer Price */}
                  <tr className="border-t-2" style={{ borderColor: 'var(--accent)' }}>
                    <td className="px-4 py-2.5 font-bold text-[14px]" style={{ color: 'var(--accent)' }}>Selling Price</td>
                    <td className="px-4 py-2.5 text-right font-bold text-[14px] tabular-nums" style={{ color: 'var(--accent)' }}>
                      {formatCurrency(quote.customerPrice, quote.currency)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Margin Check */}
          <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>Actual Margin</span>
              <MarginIndicator margin={margin} minimum={minimumMargin} />
            </div>
          </div>

          {/* Assumptions */}
          <div className="rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Assumptions</h3>
            </div>
            <div className="p-4 space-y-1">
              {quote.internalView.assumptions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  <span>•</span>
                  {a}
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {quote.internalView.warnings.length > 0 && (
            <div className="rounded-[4px] border" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
              <div className="border-b px-4 py-3" style={{ borderColor: '#FDE68A' }}>
                <h3 className="text-[13px] font-semibold" style={{ color: '#92400E' }}>Warnings</h3>
              </div>
              <div className="p-4 space-y-1">
                {quote.internalView.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px]" style={{ color: '#92400E' }}>
                    <span>⚠️</span>
                    {w}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ CUSTOMER VIEW ═══════════════════════════════════════════════ */}
      {viewMode === 'customer' && (
        <div className="rounded-[4px] border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
              Customer-Facing Quote
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Product */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Product</div>
              <div className="text-[14px] font-medium mt-1" style={{ color: 'var(--text)' }}>
                {quote.customerView.productName}
              </div>
            </div>

            {/* Quantity & Price */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Quantity</div>
                <div className="text-[14px] font-medium mt-1" style={{ color: 'var(--text)' }}>
                  {quote.customerView.quantity.toLocaleString()} units
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Unit Price</div>
                <div className="text-[14px] font-medium mt-1" style={{ color: 'var(--text)' }}>
                  {formatCurrency(quote.customerView.unitPrice, quote.currency)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Total</div>
                <div className="text-[18px] font-bold mt-1" style={{ color: 'var(--accent)' }}>
                  {formatCurrency(quote.customerView.totalPrice, quote.currency)}
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Delivery</div>
                <div className="text-[13px] font-medium mt-1" style={{ color: 'var(--text)' }}>
                  {quote.customerView.deliveryEstimate}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Incoterm</div>
                <div className="text-[13px] font-medium mt-1" style={{ color: 'var(--text)' }}>
                  {quote.customerView.incoterm}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Payment Terms</div>
                <div className="text-[13px] font-medium mt-1" style={{ color: 'var(--text)' }}>
                  {quote.customerView.paymentTerms}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Valid Until</div>
                <div className="text-[13px] font-medium mt-1" style={{ color: 'var(--text)' }}>
                  {quote.customerView.validityDate}
                </div>
              </div>
            </div>

            {/* Notes */}
            {quote.customerView.notes && (
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Notes</div>
                <div className="text-[13px] mt-1" style={{ color: 'var(--text)' }}>
                  {quote.customerView.notes}
                </div>
              </div>
            )}

            {/* Exclusions */}
            {quote.customerView.exclusions.length > 0 && (
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Exclusions</div>
                <ul className="mt-1 space-y-1">
                  {quote.customerView.exclusions.map((excl, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      <span>•</span>
                      {excl}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approval Gate */}
      <div className="rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Approval Gate</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Checklist */}
          <div className="space-y-2">
            {[
              { label: 'Supplier selected', checked: true },
              { label: 'Cost inputs verified', checked: quote.internalView.costBreakdown.every((l) => l.confirmed) },
              { label: 'Margin above minimum', checked: margin >= minimumMargin },
              { label: 'Terms set', checked: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded flex items-center justify-center text-[10px]"
                  style={{
                    background: item.checked ? '#ECFDF5' : '#FEE2E2',
                    color: item.checked ? '#038153' : '#CC3340',
                    border: `1px solid ${item.checked ? '#A7F3D0' : '#FECACA'}`,
                  }}
                >
                  {item.checked ? '✓' : '×'}
                </span>
                <span className="text-[12px]" style={{ color: 'var(--text)' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            {quote.status === 'draft' && (
              <button
                className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                Submit for Approval
              </button>
            )}
            {quote.status === 'pending_approval' && (
              <>
                <button
                  className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'var(--success)' }}
                >
                  Approve Quote
                </button>
                <button
                  className="rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all"
                  style={{ background: '#FEF2F2', color: 'var(--error)', border: '1px solid #FECACA' }}
                >
                  Reject
                </button>
              </>
            )}
            {quote.status === 'approved' && (
              <button
                className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                Send Quote
              </button>
            )}
            <button
              className="rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all"
              style={{ background: '#F3F4F6', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      {quote.auditTrail.length > 0 && (
        <div className="rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Audit Trail</h3>
          </div>
          <div className="p-4 space-y-3">
            {quote.auditTrail.map((entry, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--accent)' }} />
                <div>
                  <div className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                    {entry.action.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {entry.details} · {formatDate(entry.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
