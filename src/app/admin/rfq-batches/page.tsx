'use client';

import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; zh: string; bg: string; fg: string; border: string }> = {
  draft: { label: 'Draft', zh: '草稿', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  pending_approval: { label: 'Pending Approval', zh: '待审批', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
  approved: { label: 'Approved', zh: '已审批', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  sending: { label: 'Sending', zh: '发送中', bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD' },
  sent: { label: 'Sent', zh: '已发送', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  partial: { label: 'Partial Responses', zh: '部分回覆', bg: '#FEF3C7', fg: '#D97706', border: '#FDE68A' },
  complete: { label: 'Complete', zh: '已完成', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  expired: { label: 'Expired', zh: '已过期', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
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

function ResponseBar({ responded, total }: { responded: number; total: number }) {
  const pct = total > 0 ? (responded / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5EDF5' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? '#038153' : '#D97706' }} />
      </div>
      <span className="text-[11px] font-medium" style={{ color: '#50617A' }}>{responded}/{total}</span>
    </div>
  );
}

export default function RfqBatchesPage() {
  const { t } = useLang();
  const { rfqBatch, suppliers, opportunity } = useDemo();

  const rfqs = rfqBatch.rfqs || [];
  const respondedCount = rfqs.filter((r: { status: string }) => r.status === 'responded').length;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.5px]">{t('RFQ Batches', '供应商询价批次')}</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('Track supplier RFQs, responses, and disclosure settings', '追踪供应商询价、回覆和披露设置')}
          </p>
        </div>
      </div>

      {/* Batch card */}
      <div className="rounded-[4px] border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        {/* Batch header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link href={`/admin/rfq-batches/${rfqBatch.id}`} className="text-[15px] font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                {rfqBatch.referenceNumber}
              </Link>
              <StatusBadge status={rfqBatch.status} />
            </div>
            <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {formatDate(rfqBatch.createdAt)}
            </div>
          </div>

          {/* Batch info grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[12px]">
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-muted)' }}>Opportunity</div>
              <div className="mt-0.5">{opportunity?.title || 'Vacuum Bottle RFQ'}</div>
            </div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-muted)' }}>Deadline</div>
              <div className="mt-0.5">{formatDate(rfqBatch.responseDeadline)}</div>
            </div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-muted)' }}>Suppliers</div>
              <div className="mt-0.5">{rfqs.length} contacted</div>
            </div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-muted)' }}>Responses</div>
              <div className="mt-0.5"><ResponseBar responded={respondedCount} total={rfqs.length} /></div>
            </div>
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-muted)' }}>Disclosure</div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {rfqBatch.disclosurePolicy?.map((p: string) => (
                  <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    {p.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Supplier list */}
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
            <div className="col-span-3">Supplier</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Response Time</div>
            <div className="col-span-2">Confidence</div>
            <div className="col-span-3">Actions</div>
          </div>
          {rfqs.map((rfq: { id: string; supplierId: string; status: string; responseReceivedAt?: string; createdAt: string }) => {
            const supplier = suppliers.find((s: { id: string }) => s.id === rfq.supplierId);
            const responseTime = rfq.responseReceivedAt
              ? Math.round((new Date(rfq.responseReceivedAt).getTime() - new Date(rfq.createdAt).getTime()) / (1000 * 60 * 60))
              : null;

            return (
              <div key={rfq.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-[13px] hover:bg-gray-50/50">
                <div className="col-span-3">
                  <div className="font-medium">{supplier?.companyName || 'Unknown Supplier'}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{supplier?.contactName || ''}</div>
                </div>
                <div className="col-span-2">
                  <StatusBadge status={rfq.status} />
                </div>
                <div className="col-span-2 text-[12px]" style={{ color: responseTime !== null ? (responseTime <= 24 ? '#038153' : '#D97706') : 'var(--text-muted)' }}>
                  {responseTime !== null ? `${responseTime}h` : '—'}
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5EDF5' }}>
                      <div className="h-full rounded-full" style={{ width: '94%', background: '#038153' }} />
                    </div>
                    <span className="text-[11px] font-mono" style={{ color: '#50617A' }}>94%</span>
                  </div>
                </div>
                <div className="col-span-3">
                  <Link href={`/admin/rfq-batches/${rfqBatch.id}`} className="text-[12px] font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                    View Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
