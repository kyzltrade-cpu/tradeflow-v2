'use client';

import { useState, useEffect } from 'react';
import { useLang } from '@/lib/lang';
import { useDemo } from '@/lib/demo-store';

// ─── Types ───────────────────────────────────────────────────

interface OutboundMessage {
  id: string;
  channel: 'email' | 'whatsapp' | 'wechat';
  to_address: string;
  subject: string;
  body: string;
  draft_status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'failed' | 'cancelled';
  ai_generated: boolean;
  ai_reasoning: string;
  citations: any[];
  created_at: string;
  inquiry_id?: string;
  quote_id?: string;
  approved_at?: string;
  sent_at?: string;
}

// ─── Mock Data ───────────────────────────────────────────────

const MOCK_MESSAGES: OutboundMessage[] = [
  {
    id: '1',
    channel: 'email',
    to_address: 'james@goldenimports.com',
    subject: 'Re: Stainless Steel Bottle Inquiry',
    body: `Hi James,

Thank you for your inquiry about stainless steel water bottles.

I'd like to confirm a few details before we prepare your quotation:

1. Capacity: You mentioned 500ml — is this the only size needed, or would you like pricing for 350ml and 750ml as well?

2. Logo method: Screen printing or laser engraving? (Laser engraving has a higher setup cost but is more durable)

3. Packaging: Individual poly bag, or gift box packaging?

Once I have these details, I can provide a competitive quote within 24 hours.

Best regards,
Pacific Trading Co.`,
    draft_status: 'pending_approval',
    ai_generated: true,
    ai_reasoning: 'Clarification needed: missing capacity details, logo method, and packaging preferences',
    citations: [
      { field: 'capacity', importance: 'critical', reason: 'Determines tooling and unit price' },
      { field: 'logo_method', importance: 'important', reason: 'Affects per-unit cost' },
      { field: 'packaging', importance: 'important', reason: 'Affects cost and shipping' }
    ],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    inquiry_id: 'inq-001'
  },
  {
    id: '2',
    channel: 'email',
    to_address: 'sarah@globaldrinks.com',
    subject: 'Your Quote: Custom Tumblers (QT-2026-0042)',
    body: `Hi Sarah,

Please find your quotation below:

Product: Custom 304 Stainless Steel Tumbler (500ml)
Quantity: 5,000 units
Unit Price: USD 3.85 (FOB Shenzhen)
Total: USD 19,250.00

Delivery: 25-30 days after artwork approval
Payment: 30% deposit, 70% before shipment
Validity: 30 days

This quotation includes:
- One-color logo printing (screen print)
- Individual poly bag packaging
- BPA-free certification

Please let me know if you have any questions.

Best regards,
Pacific Trading Co.`,
    draft_status: 'pending_approval',
    ai_generated: true,
    ai_reasoning: 'Quote ready for customer — all fields confirmed, margin validated at 18.5%',
    citations: [
      { field: 'unit_price', source: 'supplier_quote', confidence: 0.95, detail: 'Shenzhen Steel Works quote #SSW-2026-112' },
      { field: 'margin', source: 'company_policy', confidence: 1.0, detail: 'Standard 18% margin applied per company policy' },
      { field: 'exchange_rate', source: 'exchange_rate_api', confidence: 0.99, detail: 'USD/HKD 7.82 (cached)' }
    ],
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    inquiry_id: 'inq-002',
    quote_id: 'qt-042'
  },
  {
    id: '3',
    channel: 'whatsapp',
    to_address: '+852 9123 4567',
    subject: '',
    body: `Hi Mr. Chen, following up on your RFQ for LED promotional items. We have 3 supplier options ready for your review. Would you like me to send the comparison?`,
    draft_status: 'pending_approval',
    ai_generated: true,
    ai_reasoning: 'Follow-up day 7 — customer hasn\'t responded to quote. Value-add approach.',
    citations: [],
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    inquiry_id: 'inq-003'
  }
];

// ─── Page ────────────────────────────────────────────────────

export default function OutboundQueuePage() {
  const { t } = useLang();
  const { tenant } = useDemo();

  const [messages, setMessages] = useState<OutboundMessage[]>(MOCK_MESSAGES);
  const [selected, setSelected] = useState<OutboundMessage | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'sent'>('pending');
  const [sending, setSending] = useState(false);

  const filtered = messages.filter(m =>
    filter === 'all' ? true :
    filter === 'pending' ? m.draft_status === 'pending_approval' :
    filter === 'approved' ? m.draft_status === 'approved' :
    m.draft_status === 'sent'
  );

  const pendingCount = messages.filter(m => m.draft_status === 'pending_approval').length;

  // Select first pending message
  useEffect(() => {
    if (!selected && filtered.length > 0) {
      setSelected(filtered[0]);
      setEditingBody(filtered[0].body);
    }
  }, [filtered, selected]);

  // Approve handler
  const handleApprove = (msg: OutboundMessage) => {
    setMessages(prev => prev.map(m =>
      m.id === msg.id ? { ...m, draft_status: 'approved' as const, approved_at: new Date().toISOString() } : m
    ));
    if (selected?.id === msg.id) {
      setSelected({ ...msg, draft_status: 'approved' });
    }
  };

  // Send handler
  const handleSend = async (msg: OutboundMessage) => {
    setSending(true);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1500));
    setMessages(prev => prev.map(m =>
      m.id === msg.id ? { ...m, draft_status: 'sent' as const, sent_at: new Date().toISOString() } : m
    ));
    setSending(false);
    setSelected(null);
  };

  // Cancel handler
  const handleCancel = (msg: OutboundMessage) => {
    setMessages(prev => prev.map(m =>
      m.id === msg.id ? { ...m, draft_status: 'cancelled' as const } : m
    ));
    setSelected(null);
  };

  // Save edits
  const handleSaveEdits = () => {
    if (selected) {
      setMessages(prev => prev.map(m =>
        m.id === selected.id ? { ...m, body: editingBody } : m
      ));
      setSelected({ ...selected, body: editingBody });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
            {t('Draft Queue', '草稿队列')}
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {t(
              'AI-drafted messages waiting for your approval. Review, edit, then send.',
              'AI起草的待审批消息。审核、编辑，然后发送。'
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span
              className="rounded-full px-3 py-1 text-[12px] font-medium"
              style={{ background: '#FEF3C7', color: '#D97706' }}
            >
              {pendingCount} {t('pending', '待处理')}
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-[4px] p-1" style={{ background: 'var(--surface-alt)' }}>
        {(['pending', 'approved', 'sent', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelected(null); }}
            className="flex-1 rounded-[3px] px-4 py-2 text-[13px] font-medium transition-all"
            style={{
              background: filter === f ? 'var(--surface)' : 'transparent',
              color: filter === f ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: filter === f ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            {f === 'pending' && `⏳ ${t('Pending', '待审批')}`}
            {f === 'approved' && `✅ ${t('Approved', '已批准')}`}
            {f === 'sent' && `📤 ${t('Sent', '已发送')}`}
            {f === 'all' && `📋 ${t('All', '全部')}`}
          </button>
        ))}
      </div>

      {/* Main layout: list + detail */}
      <div className="flex gap-4" style={{ minHeight: '600px' }}>
        {/* Left: Message list */}
        <div className="w-80 flex-shrink-0 space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-[4px] border py-12 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {t('No messages', '暂无消息')}
              </p>
            </div>
          ) : (
            filtered.map(msg => (
              <button
                key={msg.id}
                onClick={() => { setSelected(msg); setEditingBody(msg.body); }}
                className="w-full rounded-[4px] border p-3 text-left transition-all hover:shadow-sm"
                style={{
                  background: selected?.id === msg.id ? 'var(--accent-light)' : 'var(--surface)',
                  borderColor: selected?.id === msg.id ? 'var(--accent)' : 'var(--border)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChannelBadge channel={msg.channel} />
                    <span className="text-[12px] font-medium truncate max-w-[180px]" style={{ color: 'var(--text)' }}>
                      {msg.to_address}
                    </span>
                  </div>
                  <StatusBadge status={msg.draft_status} />
                </div>
                {msg.subject && (
                  <p className="mt-1 text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {msg.subject}
                  </p>
                )}
                <p className="mt-1 text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {msg.body.substring(0, 80)}...
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {msg.ai_generated && (
                    <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
                      AI Draft
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {formatRelativeTime(msg.created_at)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right: Detail panel */}
        {selected ? (
          <div className="flex-1 rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={selected.channel} />
                  <span className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                    {selected.subject || `To: ${selected.to_address}`}
                  </span>
                </div>
                <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {t('To', '收件人')}: {selected.to_address}
                </p>
              </div>
              <div className="flex gap-2">
                {selected.draft_status === 'pending_approval' && (
                  <>
                    <button
                      onClick={() => handleCancel(selected)}
                      className="rounded-[4px] border px-3 py-1.5 text-[12px]"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    >
                      {t('Cancel', '取消')}
                    </button>
                    <button
                      onClick={() => handleApprove(selected)}
                      className="rounded-[4px] px-3 py-1.5 text-[12px] font-medium text-white"
                      style={{ background: '#10B981' }}
                    >
                      {t('✓ Approve', '✓ 批准')}
                    </button>
                  </>
                )}
                {selected.draft_status === 'approved' && (
                  <button
                    onClick={() => handleSend(selected)}
                    disabled={sending}
                    className="rounded-[4px] px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}
                  >
                    {sending ? t('Sending...', '发送中...') : t('📤 Send Now', '📤 立即发送')}
                  </button>
                )}
              </div>
            </div>

            {/* AI Reasoning */}
            {selected.ai_reasoning && (
              <div className="mx-4 mt-4 rounded-[4px] border-l-4 p-3" style={{ background: '#EFF6FF', borderColor: '#3B82F6' }}>
                <p className="text-[12px] font-medium" style={{ color: '#1E40AF' }}>
                  🤖 {t('AI Reasoning', 'AI推理')}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: '#1E3A5F' }}>
                  {selected.ai_reasoning}
                </p>
              </div>
            )}

            {/* Citations */}
            {selected.citations.length > 0 && (
              <div className="mx-4 mt-3">
                <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t('Citations & Sources', '引用来源')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.citations.map((c: any, i: number) => (
                    <span
                      key={i}
                      className="rounded-[3px] px-2 py-1 text-[11px]"
                      style={{
                        background: c.source ? '#D1FAE5' : c.importance === 'critical' ? '#FEE2E2' : '#FEF3C7',
                        color: c.source ? '#065F46' : c.importance === 'critical' ? '#991B1B' : '#92400E'
                      }}
                    >
                      {c.field && `${c.field}: `}
                      {c.source && `${c.source} (${c.confidence ? Math.round(c.confidence * 100) + '%' : 'N/A'})`}
                      {c.detail && ` — ${c.detail}`}
                      {c.reason && ` — ${c.reason}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Editable message body */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                  {t('Message Content', '消息内容')}
                </label>
                {selected.draft_status === 'pending_approval' && (
                  <button
                    onClick={handleSaveEdits}
                    className="rounded-[3px] px-2 py-1 text-[11px]"
                    style={{ color: 'var(--accent)' }}
                  >
                    {t('Save Edits', '保存编辑')}
                  </button>
                )}
              </div>
              <textarea
                value={editingBody}
                onChange={e => setEditingBody(e.target.value)}
                readOnly={selected.draft_status !== 'pending_approval'}
                rows={16}
                className="w-full rounded-[4px] border px-3 py-2 text-[13px] leading-relaxed"
                style={{
                  borderColor: 'var(--border)',
                  background: selected.draft_status === 'pending_approval' ? 'var(--surface)' : 'var(--surface-alt)',
                  color: 'var(--text)',
                  resize: 'none'
                }}
              />
            </div>

            {/* Footer info */}
            <div className="border-t px-4 py-3 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span>{t('Created', '创建')}: {new Date(selected.created_at).toLocaleString()}</span>
                {selected.approved_at && <span>{t('Approved', '批准')}: {new Date(selected.approved_at).toLocaleString()}</span>}
                {selected.sent_at && <span>{t('Sent', '发送')}: {new Date(selected.sent_at).toLocaleString()}</span>}
              </div>
              {selected.inquiry_id && (
                <span className="text-[11px]" style={{ color: 'var(--accent)' }}>
                  {t('Linked to inquiry', '关联询价')}: {selected.inquiry_id}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 rounded-[4px] border flex items-center justify-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {t('Select a message to review', '选择要审核的消息')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function ChannelBadge({ channel }: { channel: string }) {
  const colors: Record<string, string> = {
    email: '#2563EB',
    whatsapp: '#25D366',
    wechat: '#07C160'
  };
  const labels: Record<string, string> = {
    email: '📧',
    whatsapp: '💬',
    wechat: '💚'
  };
  return (
    <span className="text-[14px]" title={channel}>
      {labels[channel] || '📨'}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    pending_approval: { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
    approved: { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
    sent: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Sent' },
    draft: { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
    failed: { bg: '#FEE2E2', color: '#991B1B', label: 'Failed' },
    cancelled: { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelled' }
  };
  const c = config[status] || config.draft;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
