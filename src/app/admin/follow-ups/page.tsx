'use client';

import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate, formatDateTime } from '@/lib/utils';

/* ── Status badge ──────────────────────────────────────────────────────── */

const STATUS_BADGE: Record<string, { en: string; zh: string; bg: string; fg: string; border: string }> = {
  active: { en: 'Active', zh: '活跃', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  paused: { en: 'Paused', zh: '暂停', bg: '#FFFBEB', fg: '#D97706', border: '#FDE68A' },
  completed: { en: 'Completed', zh: '已完成', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  cancelled: { en: 'Cancelled', zh: '已取消', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  const b = STATUS_BADGE[status] ?? STATUS_BADGE.active;
  return (
    <span
      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {t(b.en, b.zh)}
    </span>
  );
}

/* ── Step status badge ──────────────────────────────────────────────────── */

const STEP_STATUS: Record<string, { en: string; zh: string; bg: string; fg: string }> = {
  completed: { en: 'Completed', zh: '已完成', bg: '#ECFDF5', fg: '#038153' },
  pending: { en: 'Pending', zh: '待处理', bg: '#FFFBEB', fg: '#D97706' },
  sent: { en: 'Sent', zh: '已发送', bg: '#EFF6FF', fg: '#2563EB' },
  paused: { en: 'Paused', zh: '暂停', bg: '#F3F4F6', fg: '#6B7280' },
  cancelled: { en: 'Cancelled', zh: '已取消', bg: '#FEF2F2', fg: '#CC3340' },
};

function StepBadge({ status }: { status: string }) {
  const { t } = useLang();
  const b = STEP_STATUS[status] ?? STEP_STATUS.pending;
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: b.bg, color: b.fg }}
    >
      {t(b.en, b.zh)}
    </span>
  );
}

/* ── Card wrapper ────────────────────────────────────────────────────────── */

function Card({ title, titleZh, children, className = '' }: { title: string; titleZh: string; children: React.ReactNode; className?: string }) {
  const { t } = useLang();
  return (
    <div className={`rounded-[4px] border ${className}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{t(title, titleZh)}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
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

/* ── Step timeline ──────────────────────────────────────────────────────── */

function StepTimeline({ steps, currentStep }: { steps: { day: number; label: string; action: string; status: string; sentAt?: string }[]; currentStep: number }) {
  const { t } = useLang();
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const isCompleted = step.status === 'completed';
        const isCurrent = i === currentStep;
        const isFuture = i > currentStep;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="h-3 w-3 rounded-full shrink-0 mt-0.5 border-2"
                style={{
                  background: isCompleted ? 'var(--success)' : isCurrent ? 'var(--accent)' : '#fff',
                  borderColor: isCompleted ? 'var(--success)' : isCurrent ? 'var(--accent)' : '#D1D5DB',
                }}
              />
              {i < steps.length - 1 && (
                <div
                  className="w-px flex-1 my-1"
                  style={{ background: isCompleted ? 'var(--success)' : '#D1D5DB' }}
                />
              )}
            </div>
            <div className="pb-4 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[13px] font-semibold"
                  style={{
                    color: isCompleted ? 'var(--text-muted)' : isCurrent ? 'var(--text)' : 'var(--text-muted)',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                  }}
                >
                  Day {step.day}: {step.label}
                </span>
                <StepBadge status={step.status} />
              </div>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {step.action}
              </p>
              {step.sentAt && (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {t('Sent', '发送')}: {formatDateTime(step.sentAt)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* ── Page ───────────────────────────────────────────────────────────────── */
/* ════════════════════════════════════════════════════════════════════════════ */

export default function FollowUpsPage() {
  const { t } = useLang();
  const demo = useDemo();
  const { followUp, quote, customers, opportunity, advanceFollowUpStep } = demo;

  const customer = customers.find((c) => c.id === opportunity.customerId);
  const activeFollowUps = followUp.status === 'active' ? [followUp] : [];
  const allFollowUps = [followUp];

  const handlePause = () => {
    // Demo: just show a toast
    alert(t('Follow-up paused', '跟进已暂停'));
  };

  const handleRunNext = () => {
    advanceFollowUpStep(followUp.id);
  };

  const handleCancel = () => {
    alert(t('Follow-up cancelled', '跟进已取消'));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          {t('Follow-ups', '跟进')}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {t(
            `${activeFollowUps.length} active follow-up sequences`,
            `${activeFollowUps.length} 个活跃跟进序列`,
          )}
        </p>
      </div>

      {/* Follow-up cards */}
      <div className="space-y-4">
        {allFollowUps.map((fu) => {
          const quoteRef = quote.referenceNumber;
          const isCurrentStep = (i: number) => i === fu.currentStep;
          return (
            <div
              key={fu.id}
              className="rounded-[4px] border overflow-hidden"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Card header */}
              <div className="border-b px-4 py-3 flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      {t('Follow-up Sequence', '跟进序列')}
                    </span>
                    <StatusBadge status={fu.status} />
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {t('Quote', '报价')}: <span className="font-medium" style={{ color: 'var(--accent)' }}>{quoteRef}</span>
                    {customer?.companyName && <span> — {customer.companyName}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                    {t('Step', '步骤')} {fu.currentStep + 1}/{fu.steps.length}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {t('Next due', '下次到期')}: {formatDate(fu.nextDueAt)}
                  </div>
                </div>
              </div>

              {/* Paused reason */}
              {fu.status === 'paused' && fu.pausedReason && (
                <div
                  className="mx-4 mt-3 rounded-[4px] border px-3 py-2"
                  style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
                >
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5" style={{ color: '#D97706' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span className="text-[12px] font-medium" style={{ color: '#92400E' }}>
                      {t('Pause reason', '暂停原因')}: {fu.pausedReason}
                    </span>
                  </div>
                </div>
              )}

              {/* Step timeline */}
              <div className="px-4 py-4">
                <StepTimeline steps={fu.steps} currentStep={fu.currentStep} />
              </div>

              {/* Action buttons */}
              {fu.status === 'active' && (
                <div className="border-t px-4 py-3 flex flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={handlePause}
                    className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
                    style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}
                  >
                    {t('Pause', '暂停')}
                  </button>
                  <button
                    onClick={handleRunNext}
                    className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'var(--accent)' }}
                  >
                    {t('Run Next Step', '执行下一步')}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
                    style={{ background: '#FEF2F2', color: '#CC3340', border: '1px solid #FECACA' }}
                  >
                    {t('Cancel', '取消')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
