'use client';

import { useState } from 'react';
import { useDemo } from '@/lib/demo-store';
import { useLang } from '@/lib/lang';

/* ── Toggle switch ──────────────────────────────────────────────────────── */

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
      style={{ background: checked ? 'var(--accent)' : '#D1D5DB' }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

/* ── Integration status row ─────────────────────────────────────────────── */

function IntegrationRow({
  name,
  connected,
  zh,
}: {
  name: string;
  connected: boolean;
  zh: string;
}) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
        {t(name, zh)}
      </span>
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{
          background: connected ? '#ECFDF5' : '#F3F4F6',
          color: connected ? '#038153' : '#6B7280',
          border: `1px solid ${connected ? '#A7F3D0' : '#D1D5DB'}`,
        }}
      >
        {connected ? t('Connected', '已连接') : t('Not connected', '未连接')}
      </span>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { t } = useLang();
  const { tenant } = useDemo();
  const [autoSend, setAutoSend] = useState(true);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
          {t('Settings', '設定')}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {t(
            'Company profile, defaults, and integration settings.',
            '公司资料、默认设置和集成配置。',
          )}
        </p>
      </div>

      {/* Company Profile */}
      <div
        className="rounded-[4px] border p-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
          {t('Company Profile', '公司资料')}
        </h2>
        <div className="mt-3 space-y-2 text-[13px]">
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)' }}>{t('Legal Name', '公司名称')}</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              {t('Pacific Trading Company Limited', '太平洋贸易有限公司')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)' }}>{t('Location', '所在地')}</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>
              {t('Hong Kong', '香港')}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Defaults */}
      <div
        className="rounded-[4px] border p-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
          {t('Financial Defaults', '财务默认值')}
        </h2>
        <div className="mt-3 space-y-2 text-[13px]">
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)' }}>{t('Default Currency', '默认货币')}</span>
            <span className="font-mono font-medium" style={{ color: 'var(--text)' }}>
              {tenant.defaultCurrency}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)' }}>{t('Default Margin', '默认利润率')}</span>
            <span className="font-mono font-medium" style={{ color: 'var(--text)' }}>
              {tenant.defaultMarginPercent}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--text-muted)' }}>{t('Minimum Margin', '最低利润率')}</span>
            <span className="font-mono font-medium" style={{ color: 'var(--text)' }}>
              {tenant.minimumMarginPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* AI Policy */}
      <div
        className="rounded-[4px] border p-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
          {t('AI Policy', 'AI 策略')}
        </h2>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
              {t('Auto-send low-risk messages', '自动发送低风险消息')}
            </p>
            <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {t(
                'Allow AI to send routine follow-ups and confirmations without manual approval.',
                '允许 AI 自动发送例行跟进和确认，无需人工审批。',
              )}
            </p>
          </div>
          <Toggle checked={autoSend} onChange={setAutoSend} />
        </div>
      </div>

      {/* Integration Status */}
      <div
        className="rounded-[4px] border p-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
          {t('Integration Status', '集成状态')}
        </h2>
        <div className="mt-3 divide-y" style={{ borderColor: 'var(--border)' }}>
          <IntegrationRow name="Email Forwarding" zh="邮件转发" connected={true} />
          <IntegrationRow name="Gmail" zh="Gmail" connected={false} />
          <IntegrationRow name="WhatsApp" zh="WhatsApp" connected={false} />
        </div>
      </div>
    </div>
  );
}
