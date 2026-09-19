'use client';

import { useLang } from '@/lib/lang';

const CERTIFICATIONS = [
  {
    supplier: 'Shenzhen Electronics Co.',
    certification: 'ISO 9001:2015',
    status: 'verified',
    expiry: '2025-12-31',
  },
  {
    supplier: 'Guangzhou Food Processing Ltd.',
    certification: 'FDA Registration',
    status: 'verified',
    expiry: '2026-06-15',
  },
  {
    supplier: 'Dongguan Packaging Solutions',
    certification: 'BRC Grade A',
    status: 'expired',
    expiry: '2024-03-01',
  },
  {
    supplier: 'Shanghai Textile Group',
    certification: 'OEKO-TEX Standard 100',
    status: 'pending',
    expiry: '2025-09-30',
  },
  {
    supplier: 'Foshan Ceramics International',
    certification: 'ISO 14001:2015',
    status: 'verified',
    expiry: '2026-01-20',
  },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  verified: { bg: 'var(--success-light)', color: 'var(--success)' },
  expired: { bg: 'var(--error-light)', color: 'var(--error)' },
  pending: { bg: 'var(--warning-light)', color: 'var(--warning)' },
};

export default function CertificationsPage() {
  const { t } = useLang();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
        {t('Certifications', '认证')}
      </h1>

      <div className="overflow-x-auto rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{t('Supplier', '供应商')}</th>
              <th className="px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{t('Certification', '认证')}</th>
              <th className="px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{t('Status', '状态')}</th>
              <th className="px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{t('Expiry Date', '到期日')}</th>
              <th className="px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{t('Actions', '操作')}</th>
            </tr>
          </thead>
          <tbody>
            {CERTIFICATIONS.map((cert, i) => {
              const style = STATUS_STYLES[cert.status];
              return (
                <tr key={i} style={{ borderBottom: i < CERTIFICATIONS.length - 1 ? '1px solid var(--border)' : undefined }}>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{cert.supplier}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{cert.certification}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {t(cert.status, cert.status === 'verified' ? '已验证' : cert.status === 'expired' ? '已过期' : '待审核')}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{cert.expiry}</td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-md px-3 py-1 text-[12px] font-medium transition-colors"
                      style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}
                    >
                      {t('View', '查看')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
