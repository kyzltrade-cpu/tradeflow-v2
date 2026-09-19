'use client';

import Link from 'next/link';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';
import { formatDate, formatCurrency } from '@/lib/utils';

const stageColors: Record<string, { bg: string; color: string }> = {
  new: { bg: '#F3F4F6', color: '#6B7280' },
  qualified: { bg: '#DBEAFE', color: '#2563EB' },
  sourcing: { bg: '#D1FAE5', color: '#059669' },
  rfq_sent: { bg: '#E0E7FF', color: '#4F46E5' },
  responses_received: { bg: '#FEF3C7', color: '#D97706' },
  comparison_ready: { bg: '#FEF3C7', color: '#D97706' },
  quote_draft: { bg: '#E0E7FF', color: '#4F46E5' },
  pending_approval: { bg: '#FEF3C7', color: '#D97706' },
  sent: { bg: '#DBEAFE', color: '#2563EB' },
  negotiation: { bg: '#FED7AA', color: '#EA580C' },
  won: { bg: '#D1FAE5', color: '#059669' },
  lost: { bg: '#FEE2E2', color: '#DC2626' },
  expired: { bg: '#F3F4F6', color: '#6B7280' },
};

const stageLabels: Record<string, { en: string; zh: string }> = {
  new: { en: 'New', zh: '新增' },
  qualified: { en: 'Qualified', zh: '已資格' },
  sourcing: { en: 'Sourcing', zh: '採購中' },
  rfq_sent: { en: 'RFQ Sent', zh: '已發詢價' },
  responses_received: { en: 'Responses Received', zh: '已收回覆' },
  comparison_ready: { en: 'Comparison Ready', zh: '比較就緒' },
  quote_draft: { en: 'Quote Draft', zh: '報價草稿' },
  pending_approval: { en: 'Pending Approval', zh: '待審批' },
  sent: { en: 'Sent', zh: '已發送' },
  negotiation: { en: 'Negotiation', zh: '議價中' },
  won: { en: 'Won', zh: '已成交' },
  lost: { en: 'Lost', zh: '已失去' },
  expired: { en: 'Expired', zh: '已過期' },
};

export default function OpportunitiesPage() {
  const { t } = useLang();
  const { opportunity, customers, inquiry } = useDemo();

  const customer = customers.find((c) => c.id === opportunity.customerId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.5px]">{t('Opportunities', '商機')}</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('Track and manage your sales pipeline', '追蹤和管理你的銷售管道')}
          </p>
        </div>
      </div>

      <div className="border rounded-[4px] overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-6 gap-4 text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
            <span>{t('Reference', '參考編號')}</span>
            <span>{t('Customer', '客戶')}</span>
            <span>{t('Stage', '階段')}</span>
            <span>{t('Value', '價值')}</span>
            <span>{t('Next Action', '下一步')}</span>
            <span>{t('Created', '建立日期')}</span>
          </div>
        </div>

        <Link
          href={`/admin/opportunities/${opportunity.id}`}
          className="block p-4 border-b transition-colors hover:bg-black/[.02]"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="grid grid-cols-6 gap-4 items-center text-[13px]">
            <span className="font-medium" style={{ color: 'var(--accent)' }}>{opportunity.referenceNumber}</span>
            <div>
              <p className="font-medium">{customer?.companyName}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{customer?.contactName}</p>
            </div>
            <span
              className="inline-flex w-fit px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                background: stageColors[opportunity.stage]?.bg || '#F3F4F6',
                color: stageColors[opportunity.stage]?.color || '#6B7280',
              }}
            >
              {t(stageLabels[opportunity.stage]?.en || opportunity.stage, stageLabels[opportunity.stage]?.zh || opportunity.stage)}
            </span>
            <span className="font-medium">{formatCurrency(opportunity.estimatedValue, opportunity.currency)}</span>
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{opportunity.nextAction}</span>
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{formatDate(opportunity.createdAt)}</span>
          </div>
        </Link>

        {/* Second opportunity for demo */}
        <Link
          href={`/admin/inquiries/${inquiry.id}`}
          className="block p-4 border-b transition-colors hover:bg-black/[.02]"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="grid grid-cols-6 gap-4 items-center text-[13px]">
            <span className="font-medium" style={{ color: 'var(--accent)' }}>OPP-2026-002</span>
            <div>
              <p className="font-medium">Nordic Wellness AB</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Erik Lindqvist</p>
            </div>
            <span
              className="inline-flex w-fit px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ background: stageColors.qualified.bg, color: stageColors.qualified.color }}
            >
              {t(stageLabels.qualified.en, stageLabels.qualified.zh)}
            </span>
            <span className="font-medium">{formatCurrency(25000, 'USD')}</span>
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{t('Awaiting product specs', '等待產品規格')}</span>
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>2026-08-15</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
