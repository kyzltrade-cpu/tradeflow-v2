'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/lang';
import { formatDate } from '@/lib/utils';

interface RfqRow {
  id: string;
  supplier_id: string;
  status: string;
  created_at: string;
  response_received_at?: string;
  supplier: { id: string; legal_name: string; contact_name?: string } | null;
  responses: any[];
}

interface Batch {
  id: string;
  reference_number: string;
  opportunity_id?: string;
  status: string;
  response_deadline?: string;
  created_at: string;
  approved_at?: string;
  rfqs: RfqRow[];
  responded: number;
}

const STATUS_MAP: Record<string, { label: string; zh: string; bg: string; fg: string }> = {
  draft: { label: 'Draft', zh: '草稿', bg: '#F3F4F6', fg: '#6B7280' },
  approved: { label: 'Approved', zh: '已审批', bg: '#ECFDF5', fg: '#038153' },
  sent: { label: 'Sent', zh: '已发送', bg: '#EFF6FF', fg: '#2563EB' },
  partially_received: { label: 'Partial', zh: '部分回覆', bg: '#FEF3C7', fg: '#D97706' },
  received: { label: 'All Received', zh: '全部回覆', bg: '#ECFDF5', fg: '#038153' },
  closed: { label: 'Closed', zh: '已关闭', bg: '#F3F4F6', fg: '#6B7280' },
};

const RFQ_STATUS_MAP: Record<string, { label: string; zh: string; bg: string; fg: string }> = {
  draft: { label: 'Draft', zh: '草稿', bg: '#F3F4F6', fg: '#6B7280' },
  sent: { label: 'Sent', zh: '已发送', bg: '#EFF6FF', fg: '#2563EB' },
  followed_up: { label: 'Followed Up', zh: '已跟进', bg: '#FEF3C7', fg: '#D97706' },
  response_received: { label: 'Responded', zh: '已回覆', bg: '#ECFDF5', fg: '#038153' },
  cancelled: { label: 'Cancelled', zh: '已取消', bg: '#FEF2F2', fg: '#CC3340' },
};

function Badge({ status, map }: { status: string; map: Record<string, any> }) {
  const { t } = useLang();
  const s = map[status] ?? { label: status, zh: status, bg: '#F3F4F6', fg: '#6B7280' };
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: s.bg, color: s.fg }}>
      {t(s.label, s.zh)}
    </span>
  );
}

export default function RfqBatchesPage() {
  const { t } = useLang();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rfq-batches', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load RFQ batches');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendBatch = async (id: string) => {
    setSending(id);
    setError(null);
    try {
      const res = await fetch(`/api/rfq-batches/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          {t('RFQ Batches', '供应商询价批次')}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {t('Track supplier RFQs, responses, and disclosure settings.', '追踪供应商询价、回覆和披露设置。')}
        </p>
      </div>

      {error && (
        <div className="rounded-[4px] border px-4 py-3 text-[13px]" style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#CC3340' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{t('Loading...', '加载中...')}</p>
      ) : batches.length === 0 ? (
        <div className="rounded-[4px] border p-12 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
            {t('No RFQ batches yet', '暂无询价批次')}
          </h3>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {t('Create a batch from an opportunity to start sourcing.', '从商机创建批次开始寻源。')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div key={batch.id} className="rounded-[4px] border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/admin/rfq-batches/${batch.id}`} className="text-[15px] font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                      {batch.reference_number}
                    </Link>
                    <Badge status={batch.status} map={STATUS_MAP} />
                    {batch.status === 'draft' && (
                      <button
                        onClick={() => sendBatch(batch.id)}
                        disabled={sending === batch.id}
                        className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                        style={{ background: 'var(--accent)' }}
                      >
                        {sending === batch.id ? t('Sending...', '发送中...') : t('Approve & Send', '批准并发送')}
                      </button>
                    )}
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(batch.created_at)}
                    {batch.response_deadline && ` · ${t('deadline', '截止')} ${formatDate(batch.response_deadline)}`}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-[12px]">
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>{t('Suppliers', '供应商')} </span>
                    <span style={{ color: 'var(--text)' }}>{batch.rfqs.length}</span>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>{t('Responded', '已回覆')} </span>
                    <span style={{ color: 'var(--text)' }}>{batch.responded}/{batch.rfqs.length}</span>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>{t('Created by', '创建人')} </span>
                    <span style={{ color: 'var(--text)' }}>{batch.approved_at ? t('approved', '已批准') : t('draft', '草稿')}</span>
                  </div>
                </div>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {batch.rfqs.map((rfq) => (
                  <div key={rfq.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-[13px]">
                    <div className="col-span-5">
                      <div className="font-medium" style={{ color: 'var(--text)' }}>
                        {rfq.supplier?.legal_name || 'Unknown Supplier'}
                      </div>
                      {rfq.supplier?.contact_name && (
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{rfq.supplier.contact_name}</div>
                      )}
                    </div>
                    <div className="col-span-3"><Badge status={rfq.status} map={RFQ_STATUS_MAP} /></div>
                    <div className="col-span-4 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {rfq.response_received_at
                        ? `${t('Responded', '已回覆')} ${formatDate(rfq.response_received_at)}`
                        : formatDate(rfq.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}