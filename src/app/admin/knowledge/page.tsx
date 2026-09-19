'use client';

import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';

/* ── Placeholder cards ──────────────────────────────────────────────────── */

const PLACEHOLDER_CARDS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    en: { title: 'Supplier Certifications', desc: 'ISO, FDA, BSCI, and LFGB certificates from verified suppliers' },
    zh: { title: '供应商认证', desc: '来自已验证供应商的ISO、FDA、BSCI和LFGB证书' },
    count: 12,
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    en: { title: 'Product Specifications', desc: 'Dimensional drawings, material specs, and packaging details' },
    zh: { title: '产品规格', desc: '尺寸图纸、材料规格和包装详情' },
    count: 28,
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    en: { title: 'Trade Compliance Notes', desc: 'Import regulations, tariff codes, and compliance requirements by market' },
    zh: { title: '贸易合规说明', desc: '各市场的进口法规、关税编码和合规要求' },
    count: 8,
  },
];

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function KnowledgePage() {
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          {t('Knowledge Base', '知識庫')}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {t(
            'Supplier documents, product specs, and reference materials',
            '供应商文件、产品规格和参考资料',
          )}
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLACEHOLDER_CARDS.map((card, i) => (
          <div
            key={i}
            className="rounded-[4px] border p-5 transition-all hover:shadow-md"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[4px]"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                {card.icon}
              </div>
              <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                {t(card.en.title, card.zh.title)}
              </h3>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t(card.en.desc, card.zh.desc)}
            </p>
            <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                {card.count} {t('documents', '文件')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
