'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type Lang = 'en' | 'zh';

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (en: string, zh: string) => string }>({
  lang: 'en',
  setLang: () => {},
  t: (en) => en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const t = useCallback((en: string, zh: string) => (lang === 'zh' ? zh : en), [lang]);
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      className="px-2 py-1 rounded text-[11px] font-medium border"
      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
    >
      {lang === 'en' ? 'EN' : '中文'}
    </button>
  );
}
