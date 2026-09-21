'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/lang';
import { formatDate, formatDateTime } from '@/lib/utils';

/* ── Mock inbox messages ───────────────────────────────────────────────── */

interface InboxMessage {
  id: string;
  channel: 'email' | 'whatsapp' | 'wechat';
  from: string;
  fromEmail: string;
  to: string;
  toEmail: string;
  subject: string;
  date: string;
  body: string;
  unread: boolean;
  category: 'inquiry' | 'supplier' | 'other';
  attachments: { name: string; size: string }[];
  relatedInquiryId?: string;
  workflowState?: {
    stage: string;
    nextAction: string;
    status: string;
  };
}

const MOCK_MESSAGES: InboxMessage[] = [
  {
    id: 'inbox1',
    channel: 'email',
    from: 'Sarah Chen',
    fromEmail: 'sarah.chen@globalbottling.co.uk',
    to: 'James Mitchell',
    toEmail: 'james@tradeflow-sourcing.com',
    subject: 'RFQ: 10,000 x 500ml 304 Stainless Steel Vacuum Bottles',
    date: '2026-09-15T08:23:00Z',
    body: `Hi,

We're looking to source 10,000 units of 500ml 304 stainless steel vacuum bottles for our premium drinkware line.

Requirements:
- Quantity: 10,000 pcs
- Material: 304 stainless steel
- Delivery: End of November 2026
- Destination: London, UK
- Incoterm: CIF

Could you please send over your best pricing and lead times?

Best regards,
Sarah Chen
Head of Procurement
Global Bottling Ltd`,
    unread: false,
    category: 'inquiry',
    attachments: [],
    relatedInquiryId: 'inq1',
    workflowState: {
      stage: 'Requirements Confirmed',
      nextAction: 'Match suppliers and create RFQ batch',
      status: 'requirements_confirmed',
    },
  },
  {
    id: 'inbox2',
    channel: 'email',
    from: 'Wei Zhang',
    fromEmail: 'wei.zhang@szsteelworks.cn',
    to: 'Priya Sharma',
    toEmail: 'priya@tradeflow-sourcing.com',
    subject: 'Re: RFQ #TF-BATCH-0042: 500ml 304 Stainless Steel Vacuum Bottle',
    date: '2026-09-18T06:15:00Z',
    body: `Dear Priya,

Thank you for the RFQ. We can supply 10,000 units of 500ml 304 stainless steel vacuum bottles.

Pricing: USD 4.80/pc FOB Shenzhen
Lead time: 25 calendar days from deposit
MOQ: 1,000 pcs
Payment: 30% T/T deposit, 70% before shipment
Certifications: ISO 9001, FDA registered, BSCI audited

Logo: Silk screen included in unit price (1 colour). Additional colours add $0.15/pc.
Packaging: Individual gift box available at $0.45/pc additional.
Sample: 3 samples available at unit price, freight collect.

Our factory is ISO 9001 certified and FDA registered. We completed a BSCI audit in January 2026. Happy to share documentation.

Best regards,
Wei Zhang
Sales Manager
Shenzhen Steel Works Manufacturing Co., Ltd`,
    unread: true,
    category: 'supplier',
    attachments: [
      { name: 'ISO-9001-Certificate-2026.pdf', size: '245 KB' },
      { name: 'BSCI-Audit-Report.pdf', size: '1.2 MB' },
    ],
    relatedInquiryId: 'inq1',
    workflowState: {
      stage: 'Supplier Response Received',
      nextAction: 'Review and normalize response',
      status: 'responded',
    },
  },
  {
    id: 'inbox3',
    channel: 'whatsapp',
    from: 'Li Chen',
    fromEmail: 'li.chen@gdmetal.cn',
    to: 'Priya Sharma',
    toEmail: 'priya@tradeflow-sourcing.com',
    subject: 'Re: RFQ #TF-BATCH-0042: Stainless Steel Vacuum Bottle',
    date: '2026-09-19T03:45:00Z',
    body: `Hello,

Thanks for the inquiry. We can make 500ml stainless steel vacuum bottles.

Price: USD 5.20 per piece FOB Foshan
Delivery: 30 days
MOQ: 2,000 pieces

We have ISO 9001 certification. Please let us know if you need any other information.

Best regards,
Li Chen`,
    unread: true,
    category: 'supplier',
    attachments: [],
    relatedInquiryId: 'inq1',
    workflowState: {
      stage: 'Incomplete Response',
      nextAction: 'Follow up for missing details',
      status: 'incomplete',
    },
  },
  {
    id: 'inbox4',
    channel: 'wechat',
    from: 'Zhou Wei',
    fromEmail: 'zhouwei@yiwudrink.com',
    to: 'Priya Sharma',
    toEmail: 'priya@tradeflow-sourcing.com',
    subject: 'Re: RFQ #TF-BATCH-0042: 500ml Stainless Steel Vacuum Bottle',
    date: '2026-09-18T10:30:00Z',
    body: `Dear TradeFlow Team,

We are happy to quote for your vacuum bottle project.

Unit Price: USD 3.90/pc FOB Yiwu
Lead Time: 20 days after confirmation
MOQ: 500 pcs
Payment: 100% T/T in advance (first order)

We hold ISO 9001, FDA, and BSCI certifications. Silk screen and laser engraving available. Gift box packaging at $0.35/pc.

We can send samples within 3 days. Sample cost $5/pc, refundable on order.

Looking forward to working with you.

Zhou Wei
Yiwu Drinkware Factory`,
    unread: false,
    category: 'supplier',
    attachments: [
      { name: 'Product-Catalog-2026.pdf', size: '3.8 MB' },
    ],
    relatedInquiryId: 'inq1',
    workflowState: {
      stage: 'Supplier Response Received',
      nextAction: 'Review and normalize response',
      status: 'responded',
    },
  },
  {
    id: 'inbox5',
    channel: 'email',
    from: 'Hans Müller',
    fromEmail: 'hans@aquapure.de',
    to: 'James Mitchell',
    toEmail: 'james@tradeflow-sourcing.com',
    subject: 'Inquiry: BPA-Free Water Bottles for German Market',
    date: '2026-09-19T11:00:00Z',
    body: `Hello TradeFlow Team,

We are a German distributor looking for BPA-free water bottles for the European market. We need:

- Capacity: 750ml
- Material: BPA-free Tritan plastic
- Quantity: 25,000 units
- Certifications: LFGB, FDA
- Destination: Hamburg, Germany

Could you provide your best pricing and available certifications?

Best regards,
Hans Müller
AquaPure GmbH`,
    unread: true,
    category: 'inquiry',
    attachments: [],
  },
  {
    id: 'inbox6',
    channel: 'email',
    from: 'Emily Wong',
    fromEmail: 'emily@pacificdrinks.com.au',
    to: 'James Mitchell',
    toEmail: 'james@tradeflow-sourcing.com',
    subject: 'Follow-up: Tumbler Order Status',
    date: '2026-09-17T14:20:00Z',
    body: `Hi James,

Just checking in on the status of our tumbler order (PO #2026-0892). Could you provide an update on the production timeline?

Also, we'd like to discuss adding 5,000 additional units to the order if possible.

Thanks,
Emily Wong
Pacific Drinks Pty`,
    unread: false,
    category: 'other',
    attachments: [],
  },
];

/* ── Channel icon + label ────────────────────────────────────────────── */

const CHANNEL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  email: {
    label: 'Email',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  },
  whatsapp: {
    label: 'WhatsApp',
    color: '#25D366',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  },
  wechat: {
    label: 'WeChat',
    color: '#07C160',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  },
};

function ChannelBadge({ channel }: { channel: string }) {
  const cfg = CHANNEL_CONFIG[channel] ?? CHANNEL_CONFIG.email;
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3 w-3">
        <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
      </svg>
      {cfg.label}
    </span>
  );
}

/* ── Workflow state badge ─────────────────────────────────────────────── */

function WorkflowBadge({ stage }: { stage: string }) {
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium"
      style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
    >
      {stage}
    </span>
  );
}

/* ── Category filter tabs ─────────────────────────────────────────────── */

type CategoryTab = 'all' | 'unread' | 'inquiries' | 'suppliers';
type ChannelTab = 'all' | 'email' | 'whatsapp' | 'wechat';

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function InboxPage() {
  const { t } = useLang();
  const [selectedId, setSelectedId] = useState<string>(MOCK_MESSAGES[0].id);
  const [categoryFilter, setCategoryFilter] = useState<CategoryTab>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelTab>('all');

  const filtered = MOCK_MESSAGES.filter((msg) => {
    if (categoryFilter === 'unread' && !msg.unread) return false;
    if (categoryFilter === 'inquiries' && msg.category !== 'inquiry') return false;
    if (categoryFilter === 'suppliers' && msg.category !== 'supplier') return false;
    if (channelFilter !== 'all' && msg.channel !== channelFilter) return false;
    return true;
  });

  const selected = MOCK_MESSAGES.find((m) => m.id === selectedId) ?? MOCK_MESSAGES[0];

  const categoryTabs: { key: CategoryTab; en: string; zh: string }[] = [
    { key: 'all', en: 'All', zh: '全部' },
    { key: 'unread', en: 'Unread', zh: '未读' },
    { key: 'inquiries', en: 'Inquiries', zh: '询盘' },
    { key: 'suppliers', en: 'Suppliers', zh: '供应商' },
  ];

  const channelTabs: { key: ChannelTab; en: string; zh: string }[] = [
    { key: 'all', en: 'All Channels', zh: '所有渠道' },
    { key: 'email', en: 'Email', zh: '邮件' },
    { key: 'whatsapp', en: 'WhatsApp', zh: 'WhatsApp' },
    { key: 'wechat', en: 'WeChat', zh: '微信' },
  ];

  const channelDot: Record<string, string> = {
    email: '#2563EB',
    whatsapp: '#25D366',
    wechat: '#07C160',
  };

  const channelCounts = {
    all: MOCK_MESSAGES.length,
    email: MOCK_MESSAGES.filter((m) => m.channel === 'email').length,
    whatsapp: MOCK_MESSAGES.filter((m) => m.channel === 'whatsapp').length,
    wechat: MOCK_MESSAGES.filter((m) => m.channel === 'wechat').length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          {t('Inbox', '收件箱')}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {t(
            'Messages from customers and suppliers across all channels.',
            '来自客户和供应商的跨渠道消息。',
          )}
        </p>
      </div>

      {/* Two-row filter bar */}
      <div className="space-y-2">
        {/* Row 1: Category tabs */}
        <div className="flex items-center gap-1 rounded-[4px] border p-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {categoryTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategoryFilter(tab.key)}
              className="rounded-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors"
              style={{
                background: categoryFilter === tab.key ? 'var(--accent)' : 'transparent',
                color: categoryFilter === tab.key ? '#fff' : 'var(--text-muted)',
              }}
            >
              {t(tab.en, tab.zh)}
            </button>
          ))}
        </div>

        {/* Row 2: Channel filter pills */}
        <div className="flex items-center gap-2">
          {channelTabs.map((tab) => {
            const count = channelCounts[tab.key];
            const isActive = channelFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setChannelFilter(tab.key)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all"
                style={{
                  background: isActive ? (tab.key === 'all' ? 'var(--accent)' : CHANNEL_CONFIG[tab.key]?.bg ?? '#F3F4F6') : 'var(--surface)',
                  color: isActive ? (tab.key === 'all' ? '#fff' : CHANNEL_CONFIG[tab.key]?.color ?? '#6B7280') : 'var(--text-muted)',
                  border: `1px solid ${isActive ? (tab.key === 'all' ? 'var(--accent)' : CHANNEL_CONFIG[tab.key]?.border ?? '#E5E7EB') : 'var(--border)'}`,
                }}
              >
                {tab.key !== 'all' && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: isActive ? '#fff' : channelDot[tab.key] ?? '#6B7280' }}
                  />
                )}
                {t(tab.en, tab.zh)}
                <span
                  className="ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split view */}
      <div className="flex gap-0 rounded-[4px] border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)', minHeight: 600 }}>

        {/* ═══ LEFT: Message list (30%) ═══════════════════════════════════ */}
        <div className="w-[30%] min-w-[240px] border-r overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {t('No messages.', '暂无消息。')}
            </div>
          ) : (
            filtered.map((msg) => {
              const isSelected = msg.id === selectedId;
              const cfg = CHANNEL_CONFIG[msg.channel] ?? CHANNEL_CONFIG.email;
              return (
                <button
                  key={msg.id}
                  onClick={() => setSelectedId(msg.id)}
                  className="w-full text-left border-b px-3 py-3 transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    background: isSelected ? 'var(--accent-light)' : msg.unread ? '#FAFBFC' : 'transparent',
                  }}
                >
                  <div className="flex items-start gap-2">
                    {/* Channel dot */}
                    <div
                      className="h-2 w-2 rounded-full shrink-0 mt-1.5"
                      style={{ background: channelDot[msg.channel] ?? '#6B7280' }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[12px] font-semibold truncate"
                          style={{ color: 'var(--text)' }}
                        >
                          {msg.from}
                        </span>
                        <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(msg.date)}
                        </span>
                      </div>
                      <p
                        className="text-[12px] truncate mt-0.5"
                        style={{
                          color: msg.unread ? 'var(--text)' : 'var(--text-muted)',
                          fontWeight: msg.unread ? 600 : 400,
                        }}
                      >
                        {msg.subject}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <ChannelBadge channel={msg.channel} />
                        {msg.workflowState && (
                          <WorkflowBadge stage={msg.workflowState.stage} />
                        )}
                      </div>
                    </div>
                    {/* Unread indicator */}
                    {msg.unread && (
                      <div
                        className="h-2 w-2 rounded-full shrink-0 mt-1.5"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ═══ RIGHT: Message detail (70%) ════════════════════════════════ */}
        <div className="flex-1 flex">
          {/* Email content (55%) */}
          <div className="flex-1 overflow-y-auto" style={{ borderRight: '1px solid var(--border)' }}>
            <div className="p-6 space-y-6">
              {/* Email header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>
                    {selected.subject}
                  </h2>
                  <ChannelBadge channel={selected.channel} />
                </div>

                {/* From / To / Date */}
                <div className="rounded-[4px] border p-3 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide w-12 shrink-0" style={{ color: 'var(--text-muted)' }}>
                      From
                    </span>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                      {selected.from}
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      &lt;{selected.fromEmail}&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide w-12 shrink-0" style={{ color: 'var(--text-muted)' }}>
                      To
                    </span>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                      {selected.to}
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      &lt;{selected.toEmail}&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide w-12 shrink-0" style={{ color: 'var(--text-muted)' }}>
                      Date
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--text)' }}>
                      {formatDateTime(selected.date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email body */}
              <div
                className="rounded-[4px] border p-5 text-[13px] leading-relaxed whitespace-pre-wrap"
                style={{ background: '#FAFBFD', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {selected.body}
              </div>

              {/* Attachments */}
              {selected.attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Attachments ({selected.attachments.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.attachments.map((att) => (
                      <span
                        key={att.name}
                        className="inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[11px] font-medium"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                        </svg>
                        <span>{att.name}</span>
                        <span className="opacity-50">({att.size})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  Reply
                </button>
                <button
                  className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: '#F3F4F6', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  Forward
                </button>
                <button
                  className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: '#F3F4F6', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  Archive
                </button>
              </div>
            </div>
          </div>

          {/* ═══ Context Panel (45%) ═════════════════════════════════════ */}
          <div className="w-[45%] min-w-[280px] overflow-y-auto p-4 space-y-4" style={{ background: '#FAFBFD' }}>
            {/* Related Inquiry */}
            {selected.relatedInquiryId && (
              <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Related Inquiry
                  </span>
                  <Link
                    href={`/admin/inquiries/${selected.relatedInquiryId}`}
                    className="text-[12px] font-medium transition-colors hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    View Details →
                  </Link>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Reference</span>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>TF-2026-0193</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Customer</span>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>Global Bottling Ltd</span>
                  </div>
                </div>
              </div>
            )}

            {/* Workflow State */}
            {selected.workflowState && (
              <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Workflow State
                </span>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Current Stage</span>
                    <WorkflowBadge stage={selected.workflowState.stage} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Status</span>
                    <span className="text-[12px] font-medium capitalize" style={{ color: 'var(--text)' }}>
                      {selected.workflowState.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Next Action</span>
                    <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--text)' }}>
                      {selected.workflowState.nextAction}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sender Info */}
            <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Sender Information
              </span>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Name</span>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>{selected.from}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Email</span>
                  <span className="text-[12px] font-medium truncate max-w-[150px]" style={{ color: 'var(--text)' }}>{selected.fromEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Channel</span>
                  <ChannelBadge channel={selected.channel} />
                </div>
              </div>
            </div>

            {/* Message Metadata */}
            <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Message Details
              </span>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Received</span>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>{formatDateTime(selected.date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Category</span>
                  <span className="text-[12px] font-medium capitalize" style={{ color: 'var(--text)' }}>{selected.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Attachments</span>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>{selected.attachments.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
