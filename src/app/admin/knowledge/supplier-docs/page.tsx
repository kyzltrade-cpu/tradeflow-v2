'use client';

import { useLang } from '@/lib/lang';

const DOCUMENTS = [
  {
    name: 'Product Catalog 2024',
    supplier: 'Shenzhen Electronics Co.',
    type: 'Catalog',
    uploaded: '2024-01-15',
    status: 'current',
  },
  {
    name: 'Quality Management Manual',
    supplier: 'Guangzhou Food Processing Ltd.',
    type: 'Quality Manual',
    uploaded: '2023-11-20',
    status: 'current',
  },
  {
    name: 'FDA Compliance Certificate',
    supplier: 'Guangzhou Food Processing Ltd.',
    type: 'Compliance',
    uploaded: '2024-02-10',
    status: 'current',
  },
  {
    name: 'Factory Audit Report Q4',
    supplier: 'Dongguan Packaging Solutions',
    type: 'Audit Report',
    uploaded: '2023-09-05',
    status: 'outdated',
  },
  {
    name: 'Material Safety Data Sheet',
    supplier: 'Shanghai Textile Group',
    type: 'Compliance',
    uploaded: '2024-03-01',
    status: 'current',
  },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  current: { bg: 'var(--success-light)', color: 'var(--success)' },
  outdated: { bg: 'var(--warning-light)', color: 'var(--warning)' },
};

export default function SupplierDocsPage() {
  const { t } = useLang();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
        {t('Supplier Documents', '供应商文档')}
      </h1>

      <div className="space-y-3">
        {DOCUMENTS.map((doc, i) => {
          const style = STATUS_STYLES[doc.status];
          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: 'var(--accent-light)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                    style={{ color: 'var(--accent)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>
                    {doc.name}
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {doc.supplier} &middot; {doc.type}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {doc.uploaded}
                </span>
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize"
                  style={{ background: style.bg, color: style.color }}
                >
                  {t(doc.status === 'current' ? 'Current' : 'Outdated', doc.status === 'current' ? '最新' : '过时')}
                </span>
                <button
                  className="rounded-md px-3 py-1 text-[12px] font-medium transition-colors"
                  style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}
                >
                  {t('Download', '下载')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
