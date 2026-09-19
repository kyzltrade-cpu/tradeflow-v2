'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { VerificationLevel } from '@/lib/types';

const VERIFICATION_MAP: Record<VerificationLevel, { label: string; zh: string; bg: string; fg: string; border: string }> = {
  site_visit_completed: { label: 'Verified', zh: '已验证', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
  documents_received: { label: 'Docs Received', zh: '已收文件', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  reference_checked: { label: 'Reference Checked', zh: '已查推荐', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  public_lead: { label: 'Unverified', zh: '未验证', bg: '#F3F4F6', fg: '#6B7280', border: '#D1D5DB' },
  supplier_responded: { label: 'Responded', zh: '已回复', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
  internal_history: { label: 'Internal History', zh: '有历史', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  third_party_checked: { label: 'Third-Party Checked', zh: '已查第三方', bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  approved_for_this_order: { label: 'Approved', zh: '已批准', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
};

function CertBadge({ name, status }: { name: string; status: string }) {
  const { t } = useLang();
  const map: Record<string, { bg: string; fg: string; border: string }> = {
    verified: { bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    claimed: { bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    not_confirmed: { bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
    documents_available: { bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
    reviewed: { bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  };
  const b = map[status] ?? map.claimed;
  const label = status.replace(/_/g, ' ');
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {name}
      <span className="opacity-70">({t(label, label)})</span>
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[12px]" style={{ color: '#F59E0B' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(rating) ? 'opacity-100' : 'opacity-25'}>
          ★
        </span>
      ))}
      <span className="ml-1 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
        {rating > 0 ? rating.toFixed(1) : '—'}
      </span>
    </span>
  );
}

function EvidenceStatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  const map: Record<string, { label: string; zh: string; bg: string; fg: string; border: string }> = {
    verified: { label: 'Verified', zh: '已验证', bg: '#ECFDF5', fg: '#038153', border: '#A7F3D0' },
    unverified: { label: 'Unverified', zh: '未验证', bg: '#FFFBEB', fg: '#AD5918', border: '#FDE68A' },
    disputed: { label: 'Disputed', zh: '有争议', bg: '#FEF2F2', fg: '#CC3340', border: '#FECACA' },
  };
  const b = map[status] ?? map.unverified;
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: b.bg, color: b.fg, border: `1px solid ${b.border}` }}
    >
      {t(b.label, b.zh)}
    </span>
  );
}

function InfoRow({ label, value, zh }: { label: string; value: React.ReactNode; zh?: string }) {
  const { t } = useLang();
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[12px] shrink-0" style={{ color: 'var(--text-muted)' }}>{t(label, zh ?? label)}</span>
      <span className="text-[12px] font-medium text-right" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useLang();
  const demo = useDemo();
  const { suppliers, users } = demo;

  const supplier = suppliers.find((s) => s.id === id);

  if (!supplier) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/admin/suppliers"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t('Back to Suppliers', '返回供应商列表')}
        </Link>
        <div className="rounded-[4px] border p-8 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {t('Supplier not found.', '未找到供应商。')}
          </p>
        </div>
      </div>
    );
  }

  const vBadge = VERIFICATION_MAP[supplier.verificationLevel] ?? VERIFICATION_MAP.public_lead;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/admin/suppliers"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('Back to Suppliers', '返回供应商列表')}
      </Link>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* ═══ LEFT COLUMN (60%) ═════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 space-y-6" style={{ flexBasis: '60%' }}>

          {/* Header */}
          <div className="rounded-[4px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>
                    {supplier.name}
                  </h1>
                  <span
                    className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: supplier.supplierType === 'existing' ? '#EFF6FF' : '#FFF7ED',
                      color: supplier.supplierType === 'existing' ? '#2563EB' : '#EA580C',
                      border: `1px solid ${supplier.supplierType === 'existing' ? '#BFDBFE' : '#FED7AA'}`,
                    }}
                  >
                    {supplier.supplierType === 'existing' ? t('Existing', '现有') : t('New', '新')}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    {supplier.city}, {supplier.country}
                  </span>
                  {supplier.website && (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] font-medium transition-colors hover:underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      {supplier.website.replace(/^https?:\/\//, '')}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3 w-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
              {t('Verification', '验证信息')}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[12px] font-semibold"
                style={{ background: vBadge.bg, color: vBadge.fg, border: `1px solid ${vBadge.border}` }}
              >
                {t(vBadge.label, vBadge.zh)}
              </span>
              {supplier.lastVerifiedAt && (
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {t('Last verified', '最后验证')}: {formatDate(supplier.lastVerifiedAt)}
                </span>
              )}
            </div>
            {supplier.lastVerifiedAt && (
              <p className="text-[12px] mt-2" style={{ color: 'var(--text-muted)' }}>
                {t('Verified by', '验证人')}: {users.find((u) => u.id === 'u1')?.name ?? 'James Mitchell'}
              </p>
            )}
          </div>

          {/* Certifications */}
          {supplier.certifications.length > 0 && (
            <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {t('Certifications', '认证')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {supplier.certifications.map((cert) => (
                  <CertBadge key={cert.name} name={cert.name} status={cert.status} />
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
              {t('Evidence', '证据')} ({supplier.evidence.length})
            </h3>
            {supplier.evidence.length === 0 ? (
              <p className="text-[12px] italic" style={{ color: 'var(--text-muted)' }}>
                {t('No evidence collected yet.', '暂未收集证据。')}
              </p>
            ) : (
              <div className="space-y-3">
                {supplier.evidence.map((ev) => (
                  <div key={ev.id} className="rounded-[4px] border p-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
                          >
                            {ev.sourceType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                            {ev.sourceTitle}
                          </span>
                        </div>
                        <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {ev.claimText}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(ev.sourceDate)}
                          </span>
                          <EvidenceStatusBadge status={ev.verificationStatus} />
                          {ev.reviewedBy && (
                            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              {t('Reviewed by', '审核人')}: {users.find((u) => u.id === ev.reviewedBy)?.name ?? '—'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specialties */}
          {supplier.specialties.length > 0 && (
            <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text)' }}>
                {t('Specialties', '专长')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {supplier.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex rounded px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {supplier.notes && (
            <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text)' }}>
                {t('Notes', '备注')}
              </h3>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
                {supplier.notes}
              </p>
            </div>
          )}
        </div>

        {/* ═══ RIGHT COLUMN (40%) ════════════════════════════════════════ */}
        <div className="space-y-4 xl:w-[40%] shrink-0">

          {/* Contact Card */}
          <div className="rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {t('Contact', '联系人')}
              </h3>
            </div>
            <div className="px-3 py-3 space-y-1">
              <InfoRow label="Name" zh="姓名" value={<span className="font-semibold">{supplier.contactName}</span>} />
              <InfoRow label="Email" zh="邮箱" value={
                <span className="truncate max-w-[180px] block">{supplier.email}</span>
              } />
              <InfoRow label="Phone" zh="电话" value={supplier.phone} />
            </div>
          </div>

          {/* Performance Summary */}
          <div className="rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {t('Performance', '绩效')}
              </h3>
            </div>
            <div className="px-3 py-3 space-y-1">
              <InfoRow label="MOQ" zh="最低起订量" value={`${supplier.moq.toLocaleString()} pcs`} />
              <InfoRow label="Lead Time" zh="交货期" value={`${supplier.leadTimeDays} ${t('days', '天')}`} />
              <InfoRow label="Rating" zh="评分" value={<Stars rating={supplier.internalRating} />} />
            </div>
          </div>

          {/* Past Orders (placeholder) */}
          <div className="rounded-[4px] border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {t('Past Orders', '历史订单')}
              </h3>
            </div>
            <div className="px-3 py-3">
              <p className="text-[12px] italic" style={{ color: 'var(--text-muted)' }}>
                {t('No past orders recorded.', '暂无历史订单。')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-[4px] border p-3 space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <button
              className="w-full rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--accent)' }}
            >
              {t('Edit Supplier', '编辑供应商')}
            </button>
            <button
              className="w-full rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#F3F4F6', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              {t('Add Evidence', '添加证据')}
            </button>
            <button
              className="w-full rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#F3F4F6', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              {t('Send RFQ', '发送询价')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
