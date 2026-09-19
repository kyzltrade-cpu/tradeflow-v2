'use client';

import { use } from 'react';
import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate, formatDateTime, formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { InquiryStatus, FieldStatus, FieldSourceType } from '@/lib/types';

/* ── Golden path stages ──────────────────────────────────────────────────── */

const STAGES: { key: string; en: string; zh: string }[] = [
  { key: 'received', en: 'Inquiry Received', zh: '收到询盘' },
  { key: 'requirements', en: 'Requirements', zh: '需求确认' },
  { key: 'discovery', en: 'Supplier Discovery', zh: '供应商发现' },
  { key: 'rfq', en: 'Supplier RFQ', zh: '供应商报价' },
  { key: 'responses', en: 'Responses', zh: '收到回复' },
  { key: 'comparison', en: 'Comparison', zh: '比较分析' },
  { key: 'quote', en: 'Quote', zh: '报价' },
  { key: 'follow_up', en: 'Follow-up', zh: '跟进' },
  { key: 'outcome', en: 'Outcome', zh: '结果' },
];

const STAGE_INDEX: Record<string, number> = {
  new: 0,
  needs_clarification: 1,
  clarification_sent: 1,
  customer_replied: 1,
  requirements_confirmed: 2,
  qualified: 3,
  on_hold: 1,
  declined: 8,
  duplicate: 8,
};

function getStageIndex(status: InquiryStatus): number {
  return STAGE_INDEX[status] ?? 0;
}

/* ── Badge helpers ───────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: InquiryStatus }) {
  const { t } = useLang();
  const map: Record<InquiryStatus, { label: string; zh: string; bg: string; fg: string; border: string }> = {
    new: { label: 'New', zh: '新', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    needs_clarification: { label: 'Needs Clarification', zh: '待澄清', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    clarification_sent: { label: 'Clarification Sent', zh: '已发澄清', bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD' },
    customer_replied: { label: 'Customer Replied', zh: '客户已回复', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    requirements_confirmed: { label: 'Requirements Confirmed', zh: '需求已确认', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    qualified: { label: 'Qualified', zh: '已确认', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    on_hold: { label: 'On Hold', zh: '暂停', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
    declined: { label: 'Declined', zh: '已拒绝', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    duplicate: { label: 'Duplicate', zh: '重复', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  };
  const b = map[status] ?? map.new;
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {t(b.label, b.zh)}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const { t } = useLang();
  const map: Record<string, { label: string; zh: string; bg: string; fg: string; border: string }> = {
    low: { label: 'Low', zh: '低', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
    medium: { label: 'Medium', zh: '中', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    high: { label: 'High', zh: '高', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    urgent: { label: 'Urgent', zh: '紧急', bg: '#FEF2F2', fg: '#991B1B', border: '#FCA5A5' },
  };
  const b = map[urgency] ?? map.medium;
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {t(b.label, b.zh)}
    </span>
  );
}

function FieldStatusBadge({ status }: { status: FieldStatus }) {
  const map: Record<FieldStatus, { label: string; bg: string; fg: string; border: string }> = {
    confirmed: { label: 'Confirmed', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    extracted: { label: 'Extracted', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    assumption: { label: 'Assumption', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    missing: { label: 'Missing', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    conflict: { label: 'Conflict', bg: '#FEF2F2', fg: '#991B1B', border: '#FCA5A5' },
    rejected: { label: 'Rejected', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  };
  const b = map[status] ?? map.extracted;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {b.label}
    </span>
  );
}

function SourceBadge({ source }: { source: FieldSourceType }) {
  const map: Record<FieldSourceType, { label: string; bg: string; fg: string }> = {
    customer_message: { label: 'Customer Message', bg: '#F0F9FF', fg: '#0369A1' },
    customer_attachment: { label: 'Attachment', bg: '#F5F3FF', fg: '#7C3AED' },
    customer_reply: { label: 'Customer Reply', bg: '#ECFDF5', fg: '#038153' },
    supplier_reply: { label: 'Supplier Reply', bg: '#FFFBEB', fg: '#AD5918' },
    user_entered: { label: 'User Entered', bg: '#F3F4F6', fg: '#6B7280' },
    system_default: { label: 'System Default', bg: '#F3F4F6', fg: '#9CA3AF' },
    ai_inference: { label: 'AI Inference', bg: '#FDF4FF', fg: '#A21CAF' },
    external_source: { label: 'External', bg: '#FEF3C7', fg: '#92400E' },
  };
  const b = map[source] ?? map.ai_inference;
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: b.bg, color: b.fg }}
    >
      {b.label}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const map: Record<string, { label: string; icon: string }> = {
    email: { label: 'Email', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
    whatsapp: { label: 'WhatsApp', icon: 'M8.25 4.5l7.5 7.5-7.5 7.5m6-15v18' },
    wechat: { label: 'WeChat', icon: 'M12 21a9 9 0 100-18 9 9 0 000 18z' },
    manual: { label: 'Manual', icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z' },
  };
  const b = map[channel] ?? map.email;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium"
      style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
      </svg>
      {b.label}
    </span>
  );
}

function OpportunityStageBadge({ stage }: { stage: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    new: { label: 'New', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
    qualified: { label: 'Qualified', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    sourcing: { label: 'Sourcing', bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD' },
    rfq_sent: { label: 'RFQ Sent', bg: '#F5F3FF', fg: '#7C3AED', border: '#DDD6FE' },
    responses_received: { label: 'Responses Received', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    comparison_ready: { label: 'Comparison Ready', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    quote_draft: { label: 'Quote Draft', bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD' },
    pending_approval: { label: 'Pending Approval', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    sent: { label: 'Sent', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    negotiation: { label: 'Negotiation', bg: '#FDF4FF', fg: '#A21CAF', border: '#F0ABFC' },
    won: { label: 'Won', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    lost: { label: 'Lost', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    expired: { label: 'Expired', bg: '#F3F4F6', fg: '#9CA3AF', border: '#D1D5DB' },
  };
  const b = map[stage] ?? map.new;
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {b.label}
    </span>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    draft: { label: 'Draft', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
    pending_approval: { label: 'Pending Approval', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    approved: { label: 'Approved', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    sending: { label: 'Sending', bg: '#F0F9FF', fg: '#0369A1', border: '#BAE6FD' },
    sent: { label: 'Sent', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    viewed: { label: 'Viewed', bg: '#F5F3FF', fg: '#7C3AED', border: '#DDD6FE' },
    negotiation: { label: 'Negotiation', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    accepted: { label: 'Accepted', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    rejected: { label: 'Rejected', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    expired: { label: 'Expired', bg: '#F3F4F6', fg: '#9CA3AF', border: '#D1D5DB' },
    cancelled: { label: 'Cancelled', bg: '#F3F4F6', fg: '#9CA3AF', border: '#D1D5DB' },
  };
  const b = map[status] ?? map.draft;
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {b.label}
    </span>
  );
}

function RfqStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    draft: { label: 'Draft', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
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
      className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {b.label}
    </span>
  );
}

/* ── Primary action button ───────────────────────────────────────────────── */

function PrimaryAction({ status, onAdvance }: { status: InquiryStatus; onAdvance: (s: InquiryStatus) => void }) {
  const { t } = useLang();
  const actions: Record<InquiryStatus, { label: string; zh: string; next: InquiryStatus } | null> = {
    new: { label: 'Start Qualification', zh: '开始资质审核', next: 'needs_clarification' },
    needs_clarification: { label: 'Review Clarification', zh: '审查澄清', next: 'clarification_sent' },
    clarification_sent: { label: 'Mark as Sent', zh: '标记已发送', next: 'customer_replied' },
    customer_replied: { label: 'Confirm Requirements', zh: '确认需求', next: 'requirements_confirmed' },
    requirements_confirmed: { label: 'Find Suppliers', zh: '寻找供应商', next: 'qualified' },
    qualified: { label: 'Create RFQ Batch', zh: '创建RFQ批次', next: 'on_hold' },
    on_hold: { label: 'Resume', zh: '恢复', next: 'requirements_confirmed' },
    declined: null,
    duplicate: null,
  };
  const action = actions[status];
  if (!action) return null;
  return (
    <button
      onClick={() => onAdvance(action.next)}
      className="w-full rounded-lg px-4 py-3 text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
      style={{ background: 'var(--accent)' }}
    >
      {t(action.label, action.zh)}
    </button>
  );
}

/* ── Confidence bar ──────────────────────────────────────────────────────── */

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? 'var(--success)' : pct >= 70 ? 'var(--accent)' : pct >= 50 ? 'var(--warning)' : 'var(--error)';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--text-muted)', minWidth: 32 }}>
        {pct}%
      </span>
    </div>
  );
}

/* ── Progress tracker ────────────────────────────────────────────────────── */

function ProgressTracker({ currentIndex }: { currentIndex: number }) {
  const { t } = useLang();
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max py-2">
        {STAGES.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;
          return (
            <div key={stage.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all"
                  style={{
                    background: isCompleted ? 'var(--accent)' : isCurrent ? 'var(--surface)' : 'transparent',
                    color: isCompleted ? '#fff' : isCurrent ? 'var(--accent)' : '#9CA3AF',
                    border: isCurrent ? '2px solid var(--accent)' : isFuture ? '2px solid #D1D5DB' : 'none',
                  }}
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className="mt-1 text-[10px] font-medium text-center leading-tight"
                  style={{
                    color: isCompleted ? 'var(--accent)' : isCurrent ? 'var(--text)' : '#9CA3AF',
                    maxWidth: 68,
                  }}
                >
                  {t(stage.en, stage.zh)}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className="mx-1 h-px flex-1"
                  style={{
                    minWidth: 24,
                    background: i < currentIndex ? 'var(--accent)' : '#D1D5DB',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Card wrapper ────────────────────────────────────────────────────────── */

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[4px] border ${className}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function SidebarCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[4px] border ${className}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

/* ── Info row ────────────────────────────────────────────────────────────── */

function InfoRow({ label, value, zh }: { label: string; value: React.ReactNode; zh?: string }) {
  const { t } = useLang();
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[12px] shrink-0" style={{ color: 'var(--text-muted)' }}>{t(label, zh ?? label)}</span>
      <span className="text-[12px] font-medium text-right" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

/* ── Timeline ────────────────────────────────────────────────────────────── */

interface TimelineEvent {
  id: string;
  timestamp: string;
  label: string;
  zh: string;
  color: string;
}

function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  const { t } = useLang();
  return (
    <div className="space-y-0">
      {events.map((ev, i) => (
        <div key={ev.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
              style={{ background: ev.color }}
            />
            {i < events.length - 1 && (
              <div className="w-px flex-1 my-1" style={{ background: 'var(--border)' }} />
            )}
          </div>
          <div className="pb-4 min-w-0">
            <div className="text-[12px] font-medium leading-tight" style={{ color: 'var(--text)' }}>
              {t(ev.label, ev.zh)}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {formatRelativeTime(ev.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* ── Page component ─────────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const demo = useDemo();
  const { t } = useLang();

  const {
    inquiry,
    inquiryFields,
    customers,
    users,
    suppliers,
    opportunity,
    rfqBatch,
    supplierResponses,
    quote,
    followUp,
    messages,
    conversation,
    requirementVersions,
    advanceInquiryStatus,
  } = demo;

  const customer = customers.find((c) => c.id === inquiry.customerId);
  const owner = users.find((u) => u.id === inquiry.ownerId);
  const category = demo.categories.find((c) => c.id === inquiry.categoryId);
  const requirementVersion = requirementVersions[0];
  const stageIndex = getStageIndex(inquiry.status);

  // Missing required fields
  const missingRequired = inquiryFields.filter((f) => f.isRequired && f.status === 'missing');
  const fieldValues = inquiryFields.filter((f) => f.status !== 'missing');

  // Activity timeline events
  const timelineEvents: TimelineEvent[] = [
    { id: 'ev1', timestamp: inquiry.createdAt, label: 'Inquiry created', zh: '询盘已创建', color: 'var(--accent)' },
    ...(inquiry.status !== 'new'
      ? [{ id: 'ev2', timestamp: '2026-09-15T09:10:00Z', label: 'Clarification draft generated', zh: '澄清草案已生成', color: '#A21CAF' }]
      : []),
    ...(inquiry.status === 'requirements_confirmed' || inquiry.status === 'qualified'
      ? [
          { id: 'ev3', timestamp: '2026-09-15T14:45:00Z', label: 'Customer replied with details', zh: '客户已回复详情', color: 'var(--success)' },
          { id: 'ev4', timestamp: '2026-09-16T11:30:00Z', label: 'Requirements confirmed (v1)', zh: '需求已确认 (v1)', color: 'var(--success)' },
        ]
      : []),
    ...(rfqBatch
      ? [
          { id: 'ev5', timestamp: rfqBatch.createdAt, label: `RFQ batch ${rfqBatch.referenceNumber} created`, zh: `RFQ批次 ${rfqBatch.referenceNumber} 已创建`, color: 'var(--accent)' },
          { id: 'ev6', timestamp: '2026-09-17T09:00:00Z', label: `RFQs sent to ${rfqBatch.rfqs.length} suppliers`, zh: `RFQ已发送至 ${rfqBatch.rfqs.length} 家供应商`, color: 'var(--accent)' },
        ]
      : []),
    ...(supplierResponses.length > 0
      ? [
          { id: 'ev7', timestamp: '2026-09-18T06:15:00Z', label: 'Shenzhen Steel Works responded', zh: '深圳钢铁已回复', color: 'var(--success)' },
          { id: 'ev8', timestamp: '2026-09-18T10:30:00Z', label: 'Yiwu Drinkware responded', zh: '义乌饮具已回复', color: 'var(--success)' },
        ]
      : []),
    ...(quote
      ? [
          { id: 'ev9', timestamp: quote.createdAt, label: `Quote ${quote.referenceNumber} created`, zh: `报价 ${quote.referenceNumber} 已创建`, color: 'var(--accent)' },
          { id: 'ev10', timestamp: quote.sentAt ?? quote.createdAt, label: 'Quote sent to customer', zh: '报价已发送给客户', color: 'var(--accent)' },
        ]
      : []),
  ];

  // Supplier RFQ summaries
  const supplierSummaries = rfqBatch?.rfqs.map((rfq) => {
    const supplier = suppliers.find((s) => s.id === rfq.supplierId);
    const response = supplierResponses.find((r) => r.supplierRfqId === rfq.id);
    return { ...rfq, supplier, response };
  }) ?? [];

  return (
    <div className="space-y-6">
      {/* ── Back link ──────────────────────────────────────────────────── */}
      <Link
        href="/admin/inquiries"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('Back to Inquiries', '返回询盘列表')}
      </Link>

      {/* ── Two-column layout ──────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* ═══ LEFT COLUMN (main) ═════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 space-y-6" style={{ flexBasis: '65%' }}>

          {/* 1. Header */}
          <div className="rounded-[4px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>
                    {customer?.contactName ?? 'Unknown Customer'}
                  </h1>
                  <ChannelBadge channel={conversation.channel} />
                  <StatusBadge status={inquiry.status} />
                  <UrgencyBadge urgency={inquiry.urgency} />
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-[14px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {customer?.companyName}
                  </span>
                  <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    {inquiry.referenceNumber}
                  </span>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
                    {formatCurrency(inquiry.estimatedValue, inquiry.currency)}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>
                  {t('Category', '类别')}
                </div>
                <div className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--text)' }}>
                  {category?.name ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Progress Tracker */}
          <Card title={t('Progress', '进度')}>
            <ProgressTracker currentIndex={stageIndex} />
          </Card>

          {/* 3. Original Conversation */}
          <Card title={t('Original Conversation', '原始对话')}>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {messages.filter((m) => m.conversationId === conversation.id).map((msg) => {
                const isInbound = msg.direction === 'inbound';
                return (
                  <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className="max-w-[85%] rounded-lg px-4 py-3"
                      style={{
                        background: isInbound ? 'var(--accent-light)' : '#F3F4F6',
                        border: `1px solid ${isInbound ? 'var(--border)' : '#E5E7EB'}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
                          {msg.senderName}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {formatDateTime(msg.receivedAt)}
                        </span>
                      </div>
                      <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                        {msg.bodyText}
                      </div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.attachments.map((att) => (
                            <span
                              key={att.id}
                              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium"
                              style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3 w-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                              </svg>
                              {att.fileName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 4. AI Extraction Panel */}
          <Card title={t('AI Field Extraction', 'AI 字段提取')}>
            {/* Missing required fields alert */}
            {missingRequired.length > 0 && (
              <div
                className="rounded-[4px] border px-4 py-3 mb-4"
                style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" style={{ color: 'var(--error)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--error)' }}>
                    {t('Missing Required Fields', '缺少必填字段')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {missingRequired.map((f) => (
                    <span
                      key={f.fieldKey}
                      className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}
                    >
                      {f.fieldLabel}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fields table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>{t('Field', '字段')}</th>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>{t('Value', '值')}</th>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>{t('Status', '状态')}</th>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>{t('Source', '来源')}</th>
                    <th className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>{t('Confidence', '置信度')}</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiryFields.map((field) => (
                    <tr
                      key={field.fieldKey}
                      className="border-b last:border-b-0"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text)' }}>
                        {field.fieldLabel}
                        {field.isRequired && (
                          <span className="ml-1" style={{ color: 'var(--error)' }}>*</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {field.status === 'missing' ? (
                          <span className="italic" style={{ color: 'var(--error)' }}>
                            {t('Missing', '缺失')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text)' }}>
                            {field.normalizedValue || field.rawValue}
                            {field.unit && (
                              <span className="ml-0.5" style={{ color: 'var(--text-muted)' }}>{field.unit}</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <FieldStatusBadge status={field.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        <SourceBadge source={field.sourceType} />
                      </td>
                      <td className="px-3 py-2.5" style={{ minWidth: 100 }}>
                        <ConfidenceBar value={field.confidence} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 5. Clarification Draft */}
          {inquiry.status === 'needs_clarification' && (
            <Card title={t('Clarification Email Draft', '澄清邮件草案')}>
              <div className="space-y-3">
                <div
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: '#FDF4FF', color: '#A21CAF', border: '1px solid #F0ABFC' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  {t('AI Generated — Awaiting approval', 'AI 生成 — 等待审批')}
                </div>
                <div
                  className="rounded-[4px] border p-4 text-[13px] leading-relaxed whitespace-pre-wrap"
                  style={{ background: '#F8FAFD', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {messages.find((m) => m.classification === 'customer_clarification' && m.direction === 'outbound')?.bodyText ??
                    t('No clarification draft available.', '暂无澄清草案。')}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                    onClick={() => advanceInquiryStatus('clarification_sent')}
                  >
                    {t('Approve & Send', '批准并发送')}
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => advanceInquiryStatus('needs_clarification')}
                  >
                    {t('Edit', '编辑')}
                  </button>
                  <button
                    className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
                    style={{ background: '#FEF2F2', color: 'var(--error)', border: '1px solid #FECACA' }}
                    onClick={() => advanceInquiryStatus('new')}
                  >
                    {t('Discard', '丢弃')}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* 6. Requirement Version */}
          {requirementVersion && (
            <Card title={t(`Requirement Version ${requirementVersion.versionNumber}`, `需求版本 ${requirementVersion.versionNumber}`)}>
              <div className="flex items-center gap-2 mb-3">
                <FieldStatusBadge status={requirementVersion.status as FieldStatus} />
                {requirementVersion.approvedBy && (
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {t('Approved by', '审批人')}: {users.find((u) => u.id === requirementVersion.approvedBy)?.name}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {Object.entries(requirementVersion.snapshot).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-muted)' }}>
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[13px] font-medium mt-0.5" style={{ color: value ? 'var(--text)' : '#9CA3AF' }}>
                      {value || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ═══ RIGHT COLUMN (sidebar) ════════════════════════════════════ */}
        <div className="space-y-4 xl:w-[35%] shrink-0">

          {/* 7. Customer Card */}
          <SidebarCard title={t('Customer', '客户')}>
            <div className="space-y-1">
              <InfoRow label="Name" zh="姓名" value={customer?.contactName ?? '—'} />
              <InfoRow label="Email" zh="邮箱" value={
                <span className="truncate max-w-[180px] block">{customer?.email ?? '—'}</span>
              } />
              <InfoRow label="Phone" zh="电话" value={customer?.phone ?? '—'} />
              <InfoRow label="Country" zh="国家" value={customer?.country ?? '—'} />
              <InfoRow label="Source" zh="来源" value={customer?.source?.replace(/_/g, ' ') ?? '—'} />
            </div>
          </SidebarCard>

          {/* 8. Opportunity Card */}
          {opportunity && (
            <SidebarCard title={t('Opportunity', '商机')}>
              <div className="space-y-1">
                <div className="mb-2">
                  <OpportunityStageBadge stage={opportunity.stage} />
                </div>
                <InfoRow label="Value" zh="金额" value={
                  <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                    {formatCurrency(opportunity.estimatedValue, opportunity.currency)}
                  </span>
                } />
                <InfoRow label="Target Margin" zh="目标利润率" value={`${opportunity.targetMarginPercent}%`} />
                <InfoRow label="Next Action" zh="下一步" value={
                  <span className="text-right max-w-[160px] block">{opportunity.nextAction}</span>
                } />
                <InfoRow label="Owner" zh="负责人" value={
                  users.find((u) => u.id === opportunity.ownerId)?.name ?? '—'
                } />
                <InfoRow label="Sample" zh="样品" value={opportunity.sampleDecision} />
              </div>
            </SidebarCard>
          )}

          {/* 9. Supplier RFQ Summary */}
          {rfqBatch && (
            <SidebarCard title={t('Supplier RFQ', '供应商询价')}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {rfqBatch.referenceNumber}
                  </span>
                  <RfqStatusBadge status={rfqBatch.status} />
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {t('Deadline', '截止')}: {formatDate(rfqBatch.responseDeadline)}
                </div>
                <div className="border-t pt-2 space-y-2" style={{ borderColor: 'var(--border)' }}>
                  {supplierSummaries.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium truncate" style={{ color: 'var(--text)' }}>
                          {s.supplier?.name ?? 'Unknown'}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {s.supplier?.country} · {s.supplier?.city}
                        </div>
                      </div>
                      <RfqStatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              </div>
            </SidebarCard>
          )}

          {/* 10. Quote Summary */}
          {quote && (
            <SidebarCard title={t('Quote', '报价')}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {quote.referenceNumber}
                  </span>
                  <QuoteStatusBadge status={quote.status} />
                </div>
                <div className="space-y-1">
                  <InfoRow label="Customer Price" zh="客户价格" value={
                    <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                      {formatCurrency(quote.customerPrice, quote.currency)}
                    </span>
                  } />
                  <InfoRow label="Margin" zh="利润率" value={
                    <span style={{ color: quote.internalView.marginPercent >= 20 ? 'var(--success)' : 'var(--warning)' }}>
                      {quote.internalView.marginPercent.toFixed(1)}%
                    </span>
                  } />
                  <InfoRow label="Valid Until" zh="有效期至" value={formatDate(quote.validUntil)} />
                </div>
              </div>
            </SidebarCard>
          )}

          {/* 11. Follow-up Status */}
          {followUp && (
            <SidebarCard title={t('Follow-up', '跟进')}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                    {t('Step', '步骤')} {followUp.currentStep + 1}/{followUp.steps.length}
                  </span>
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      background: followUp.status === 'active' ? '#ECFDF5' : '#F3F4F6',
                      color: followUp.status === 'active' ? 'var(--success)' : '#6B7280',
                      border: `1px solid ${followUp.status === 'active' ? '#A7F3D0' : '#D1D5DB'}`,
                    }}
                  >
                    {followUp.status}
                  </span>
                </div>
                <InfoRow label="Next Due" zh="下次到期" value={formatDate(followUp.nextDueAt)} />
                <div className="border-t pt-2 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                  {followUp.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          background: step.status === 'completed' ? 'var(--success)' :
                            i === followUp.currentStep ? 'var(--accent)' : '#D1D5DB',
                        }}
                      />
                      <span
                        className="text-[11px] truncate"
                        style={{
                          color: step.status === 'completed' ? 'var(--text-muted)' : 'var(--text)',
                          textDecoration: step.status === 'completed' ? 'line-through' : 'none',
                        }}
                      >
                        Day {step.day}: {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SidebarCard>
          )}

          {/* 12. Activity Timeline */}
          <SidebarCard title={t('Activity', '活动记录')}>
            <ActivityTimeline events={timelineEvents.slice(0, 8)} />
          </SidebarCard>

          {/* 13. Primary Action Button */}
          <div className="space-y-3">
            <PrimaryAction status={inquiry.status} onAdvance={advanceInquiryStatus} />
            <div className="text-center">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {t('Owner', '负责人')}: {owner?.name ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
