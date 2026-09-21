'use client';

import { useState, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LangProvider, LangToggle, useLang } from '@/lib/lang';
import { DemoProvider, useDemo } from '@/lib/demo-store';

/* ── Navigation config ──────────────────────────────────────────────────── */

interface NavItem {
  href: string;
  en: string;
  zh: string;
  icon: string;
}

interface NavGroup {
  label: { en: string; zh: string };
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: { en: 'Primary', zh: '主要' },
    items: [
      {
        href: '/admin/inbox',
        en: 'Inbox',
        zh: '收件箱',
        icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
      },
      {
        href: '/admin/work-queue',
        en: 'Work Queue',
        zh: '工作队列',
        icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z',
      },
      {
        href: '/admin/opportunities',
        en: 'Opportunities',
        zh: '商机',
        icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
      },
      {
        href: '/admin/quotes',
        en: 'Quotes',
        zh: '报价',
        icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
      },
      {
        href: '/admin/follow-ups',
        en: 'Follow-ups',
        zh: '跟进',
        icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        href: '/admin/cost-calculator',
        en: 'Cost Calculator',
        zh: '成本计算器',
        icon: 'M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008H18v-.008zm0 2.25H18V13.5zm0 2.25H18v-.008zm0 2.25H18V18z',
      },
    ],
  },
  {
    label: { en: 'Secondary', zh: '次要' },
    items: [
      {
        href: '/admin/suppliers',
        en: 'Suppliers',
        zh: '供应商',
        icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z',
      },
      {
        href: '/admin/products',
        en: 'Products',
        zh: '产品',
        icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
      },
      {
        href: '/admin/knowledge',
        en: 'Knowledge Base',
        zh: '知识库',
        icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
      },
      {
        href: '/admin/settings',
        en: 'Settings',
        zh: '设置',
        icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z',
      },
    ],
  },
];

/* ── Sidebar component ──────────────────────────────────────────────────── */

function SidebarItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const { t } = useLang();
  const active = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      title={collapsed ? t(item.en, item.zh) : undefined}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors"
      style={{
        background: active ? 'var(--accent-light)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5 shrink-0"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
      </svg>
      {!collapsed && <span>{t(item.en, item.zh)}</span>}
    </Link>
  );
}

function Sidebar({ collapsed, onClose }: { collapsed: boolean; onClose: () => void }) {
  const { t } = useLang();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        onClick={onClose}
      />

      <aside
        className="fixed left-0 top-0 z-50 flex h-full flex-col border-r transition-all duration-200 lg:static lg:z-auto"
        style={{
          width: collapsed ? 60 : 240,
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b px-4" style={{ borderColor: 'var(--border)' }}>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-white text-sm"
            style={{ background: 'var(--accent)' }}
          >
            TF
          </div>
          {!collapsed && (
            <span className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
              TradeFlow
            </span>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
              {!collapsed && (
                <div
                  className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t(group.label.en, group.label.zh)}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarItem key={item.href} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User badge */}
        <div className="border-t px-3 py-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: '#6366F1' }}
            >
              DW
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                  David Wong
                </div>
                <div className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Pacific Trading Co.
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── Header ─────────────────────────────────────────────────────────────── */

function Header({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <button
        onClick={onToggle}
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
        aria-label="Toggle sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
          style={{ color: 'var(--text-muted)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <LangToggle />
      </div>
    </header>
  );
}

/* ── Admin shell ────────────────────────────────────────────────────────── */

function AdminShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resetDemo } = useDemo();

  const toggleCollapse = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <div className="dashboard-mode flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sidebar collapsed={false} onClose={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onClose={() => {}} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header collapsed={collapsed} onToggle={toggleCollapse} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Reset demo button */}
      <button
        onClick={resetDemo}
        className="fixed bottom-6 right-6 z-50 rounded-lg px-4 py-2 text-[13px] font-medium shadow-lg transition-all hover:shadow-xl"
        style={{
          background: 'var(--surface)',
          color: 'var(--error)',
          border: '1px solid var(--border)',
        }}
      >
        Reset Demo
      </button>
    </div>
  );
}

/* ── Root layout ────────────────────────────────────────────────────────── */

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <DemoProvider>
        <AdminShell>{children}</AdminShell>
      </DemoProvider>
    </LangProvider>
  );
}
