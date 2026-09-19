'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate } from '@/lib/utils';
import type { VerificationLevel } from '@/lib/types';

/* ── Verification level config ──────────────────────────────────────────── */

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

/* ── Certification badge colors ─────────────────────────────────────────── */

function CertBadge({ name, status }: { name: string; status: string }) {
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
      <span className="opacity-70">({label})</span>
    </span>
  );
}

/* ── Star rating ────────────────────────────────────────────────────────── */

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

/* ── Filter tab type ────────────────────────────────────────────────────── */

type FilterTab = 'all' | 'existing' | 'new' | 'verified' | 'pending';

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function SuppliersPage() {
  const { t } = useLang();
  const demo = useDemo();
  const { suppliers } = demo;
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = suppliers.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'existing') return s.supplierType === 'existing';
    if (filter === 'new') return s.supplierType === 'new';
    if (filter === 'verified') return s.verificationStatus === 'verified';
    if (filter === 'pending') return s.verificationStatus !== 'verified';
    return true;
  });

  const tabs: { key: FilterTab; en: string; zh: string }[] = [
    { key: 'all', en: 'All', zh: '全部' },
    { key: 'existing', en: 'Existing', zh: '现有' },
    { key: 'new', en: 'New', zh: '新' },
    { key: 'verified', en: 'Verified', zh: '已验证' },
    { key: 'pending', en: 'Pending', zh: '待验证' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
            {t('Suppliers', '供应商')}
            <span
              className="ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[12px] font-semibold"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              {suppliers.length}
            </span>
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {t(
              'Manage your supplier directory and verification status.',
              '管理供应商目录和验证状态。',
            )}
          </p>
        </div>
        <button
          className="rounded-[4px] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'var(--accent)' }}
        >
          + {t('Add Supplier', '添加供应商')}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-[4px] border p-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="rounded-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors"
            style={{
              background: filter === tab.key ? 'var(--accent)' : 'transparent',
              color: filter === tab.key ? '#fff' : 'var(--text-muted)',
            }}
          >
            {t(tab.en, tab.zh)}
          </button>
        ))}
      </div>

      {/* Supplier grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((supplier) => {
          const vBadge = VERIFICATION_MAP[supplier.verificationLevel] ?? VERIFICATION_MAP.public_lead;
          return (
            <div
              key={supplier.id}
              className="rounded-[4px] border p-4 transition-all hover:shadow-md"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Row 1: Name, location, type badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {supplier.name}
                  </h3>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {supplier.city}, {supplier.country}
                  </p>
                </div>
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

              {/* Specialties */}
              {supplier.specialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {supplier.specialties.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              {/* Verification + Rating row */}
              <div className="mt-3 flex items-center gap-3">
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: vBadge.bg, color: vBadge.fg, border: `1px solid ${vBadge.border}` }}
                >
                  {t(vBadge.label, vBadge.zh)}
                </span>
                <Stars rating={supplier.internalRating} />
              </div>

              {/* Certifications */}
              {supplier.certifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {supplier.certifications.map((cert) => (
                    <CertBadge key={cert.name} name={cert.name} status={cert.status} />
                  ))}
                </div>
              )}

              {/* MOQ + Lead Time */}
              <div className="mt-3 flex items-center gap-4 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                <span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>MOQ:</span>{' '}
                  {supplier.moq.toLocaleString()} pcs
                </span>
                <span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{t('Lead Time', '交货期')}:</span>{' '}
                  {supplier.leadTimeDays} {t('days', '天')}
                </span>
              </div>

              {/* Last verified */}
              {supplier.lastVerifiedAt && (
                <p className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {t('Last verified', '最后验证')}: {formatDate(supplier.lastVerifiedAt)}
                </p>
              )}

              {/* View details */}
              <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <Link
                  href={`/admin/suppliers/${supplier.id}`}
                  className="inline-flex items-center gap-1 text-[12px] font-medium transition-colors hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  {t('View Details', '查看详情')}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          className="rounded-[4px] border p-8 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {t('No suppliers match this filter.', '没有供应商匹配此筛选。')}
          </p>
        </div>
      )}
    </div>
  );
}
