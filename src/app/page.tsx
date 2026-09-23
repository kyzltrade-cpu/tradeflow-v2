import Link from 'next/link';

/* ── Data ───────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: null,
    title: 'Company Brain',
    desc: 'AI learns your products, suppliers, margins, and certifications. Every quote it builds gets smarter.',
    detail: 'Upload specs, pricing sheets, and supplier docs. TradeFlow builds a knowledge graph that powers every future quote.',
  },
  {
    icon: null,
    title: 'Email + WhatsApp Inbox',
    desc: 'Forward RFQs to your email inbox, or forward them from WhatsApp. TradeFlow extracts every spec, detects gaps, and drafts clarifications in your language.',
    detail: 'Works with the email and WhatsApp you already use. No new software for your team, customers, or suppliers to learn. Supports English, Chinese, and mixed-language threads.',
  },
  {
    icon: null,
    title: 'Cited Quotes',
    desc: 'Every number on your quote has a source. Supplier price, margin, FX rate -- all traceable.',
    detail: 'AI cites where every data point came from. Show customers confidence, not guesswork.',
  },
  {
    icon: null,
    title: 'Smart Follow-ups',
    desc: 'Auto-scheduled follow-ups that stop the moment a customer replies. No embarrassing double-texts.',
    detail: 'AI drafts messages in the customer\'s language. Human approves before send.',
  },
];

const STEPS = [
  { num: '01', title: 'Forward the RFQ', desc: 'Send the customer email or WhatsApp message to TradeFlow. That\'s it.' },
  { num: '02', title: 'AI Extracts & Cites', desc: 'Every spec, quantity, and requirement pulled with source citations.' },
  { num: '03', title: 'Brain Drafts the Quote', desc: 'Uses your real supplier prices, margins, and certifications.' },
  { num: '04', title: 'You Approve, Send', desc: 'Review the draft. One click to send to the customer.' },
];

const FAQS = [
  {
    q: 'Does it work with the email I already use?',
    a: 'Yes. Forward any RFQ to your TradeFlow address, or connect your mailbox. There is no new software for your team or your customers to learn.',
  },
  {
    q: 'Does it work with WhatsApp?',
    a: 'Yes. Forward RFQs from WhatsApp in the same way — TradeFlow extracts the specs and routes the reply back through the channel you prefer. Ideal for working with Shenzhen and mainland suppliers who live on WeChat and WhatsApp.',
  },
  {
    q: 'Can it handle Chinese and mixed-language emails?',
    a: 'TradeFlow extracts specs from English, Simplified Chinese, Traditional Chinese, and mixed-language threads — common in HK and SZ trade.',
  },
  {
    q: 'What happens when a spec is missing?',
    a: 'AI flags the gap and drafts a clarification question in the customer\'s language, so you never quote on assumptions.',
  },
  {
    q: 'Who controls the final quote?',
    a: 'You do. Every quote is a draft until you approve it. AI cites where each number came from — supplier price, margin rule, FX rate — so you can verify fast.',
  },
  {
    q: 'Is my supplier and pricing data safe?',
    a: 'Your knowledge base is private to your company. Data is stored encrypted, access is per-user, and it is never used to train models shared with other customers.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'The free plan is yours forever. Paid plans are month-to-month — cancel with one click, keep access to everything you built.',
  },
];

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF9F6', color: '#111' }}>
      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b" style={{ background: 'rgba(250,249,246,0.85)', borderColor: '#E8E5E1' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center">
          <div className="text-base font-semibold tracking-tight" style={{ color: '#111' }}>TradeFlow</div>
          <div className="hidden md:flex items-center justify-center gap-8 text-sm font-medium" style={{ color: '#626260' }}>
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors" style={{ color: '#626260' }}>
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-all" style={{ background: '#0A6E5C', boxShadow: 'inset 0 -2px 0 0 #085a4a' }}>
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border" style={{ background: '#E6F4F0', color: '#0A6E5C', borderColor: '#B8DDD3' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#0A6E5C' }}></span>
            Built for HK & SZ trading companies
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Forward the RFQ.<br />
            <span style={{ color: '#0A6E5C' }}>We draft the quote.</span>
          </h1>

          {/* Subhead */}
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#626260' }}>
            TradeFlow is the AI copilot for trading companies. It reads your emails, learns your products and suppliers, and generates cited, ready-to-send quotes — in hours, not days.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-sm font-medium text-white transition-all active:translate-y-px active:scale-[0.99]" style={{ background: '#0A6E5C', boxShadow: 'inset 0 -2px 0 0 #085a4a' }}>
              Start Free Trial
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-sm font-medium border transition-colors hover:bg-black/[0.03]" style={{ borderColor: '#D9D7CB', color: '#374151' }}>
              See a Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#626260' }}>
              Built for the way traders actually work — email-first, citation-backed, human-approved.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group p-8 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1" style={{ background: '#fff', borderColor: '#E8E5E1' }}>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#626260' }}>{f.desc}</p>
                <p className="text-xs leading-relaxed px-4 py-3 rounded-lg" style={{ background: '#F8FAFD', color: '#50617A' }}>{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: '#F8FAFD' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              From RFQ to quote in 4 steps
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#626260' }}>
              No new software to learn. Just forward your email.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white mx-auto mb-4" style={{ background: '#0A6E5C' }}>{s.num}</div>
                <h3 className="text-base font-bold mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#626260' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── See It In Action ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              See it in action
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#626260' }}>
              A real RFQ, 10 minutes later. Here&apos;s the whole flow.
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1 — the RFQ arrives */}
            <div className="p-8 rounded-2xl border" style={{ background: '#fff', borderColor: '#E8E5E1' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#0A6E5C' }}>1</div>
                <div>
                  <div className="text-sm font-semibold">The RFQ arrives</div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>You forward it to TradeFlow, or it lands in your shared inbox</div>
                </div>
              </div>
              <div className="px-5 py-4 rounded-xl text-sm leading-relaxed" style={{ background: '#F8FAFD', color: '#50617A', border: '1px solid #E5EDF5' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>From: Sarah Chen</div>
                Hi, we need 10,000 pcs of 500ml stainless steel vacuum bottles for a corporate order. Please quote with logo printing and your best lead time. Preference for double-wall, 304 food grade. We also need a sample before mass production. Thank you!
              </div>
            </div>

            {/* Step 2 — AI extracts */}
            <div className="p-8 rounded-2xl border" style={{ background: '#fff', borderColor: '#E8E5E1' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#0A6E5C' }}>2</div>
                <div>
                  <div className="text-sm font-semibold">AI extracts every spec</div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>It pulls specs, detects the gaps, and asks only what&apos;s missing</div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="px-5 py-4 rounded-xl text-sm" style={{ background: '#F8FAFD', border: '1px solid #E5EDF5' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Extracted</div>
                  <ul className="space-y-2 text-sm" style={{ color: '#50617A' }}>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0A6E5C' }}></span>10,000 pcs</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0A6E5C' }}></span>500ml, double-wall, 304</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0A6E5C' }}></span>Logo printing requested</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0A6E5C' }}></span>Sample required pre-order</li>
                  </ul>
                </div>
                <div className="px-5 py-4 rounded-xl text-sm" style={{ background: '#FFF9EC', border: '1px solid #F3E5C9' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#B45309' }}>Gaps it caught</div>
                  <ul className="space-y-2 text-sm" style={{ color: '#92600E' }}>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D97706' }}></span>Target price or budget?</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D97706' }}></span>Incoterm (FOB / CIF / EXW)?</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D97706' }}></span>Delivery destination & date?</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 — cited quote */}
            <div className="p-8 rounded-2xl border" style={{ background: '#fff', borderColor: '#E8E5E1' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#0A6E5C' }}>3</div>
                <div>
                  <div className="text-sm font-semibold">A cited quote, ready to send</div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>Every number traces back to a supplier price or your margin rule</div>
                </div>
              </div>
              <div className="px-5 py-4 rounded-xl text-sm" style={{ background: '#F8FAFD', border: '1px solid #E5EDF5' }}>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-semibold" style={{ color: '#111' }}>500ml Vacuum Bottle, Double-Wall 304</span>
                  <span className="font-bold" style={{ color: '#0A6E5C' }}>USD 4.80 / pc</span>
                </div>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="font-semibold" style={{ color: '#111' }}>Logo Printing (single-color laser)</span>
                  <span className="font-bold" style={{ color: '#0A6E5C' }}>USD 0.35 / pc</span>
                </div>
                <div className="flex justify-between items-baseline mb-4">
                  <span className="font-semibold" style={{ color: '#111' }}>Sample (air freight)</span>
                  <span className="font-bold" style={{ color: '#0A6E5C' }}>USD 25.00</span>
                </div>
                <div className="py-3 border-t text-xs" style={{ borderColor: '#E5EDF5', color: '#50617A' }}>
                  <span className="font-semibold" style={{ color: '#0A6E5C' }}>Sources: </span>
                  Supplier quote #SO-2091 (Global Stainless) · 32% target margin · FX 7.82 · Validity 15 days
                </div>
              </div>
              <p className="text-sm mt-4" style={{ color: '#626260' }}>
                You review, adjust, approve. The quote goes out in your voice, with your margins intact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: '#F8FAFD' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Simple, transparent pricing
          </h2>
          <p className="text-lg mb-12" style={{ color: '#626260' }}>
            Start free. Scale when you&apos;re ready.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: 'Free', period: 'forever', features: ['5 quotes/month', '1 user', 'Email support', 'Basic AI extraction'], cta: 'Start Free', accent: false },
              { name: 'Pro', price: '$299', period: '/month', features: ['Unlimited quotes', '3 users', 'Company Brain', 'Cited quotes', 'Follow-up automation'], cta: 'Start Trial', accent: true },
              { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited everything', 'SSO & team management', 'API access', 'Dedicated support', 'Custom integrations'], cta: 'Contact Sales', accent: false },
            ].map((plan) => (
              <div key={plan.name} className="p-8 rounded-2xl border-2 text-left transition-all hover:shadow-xl" style={{ background: '#fff', borderColor: plan.accent ? '#0A6E5C' : '#E8E5E1' }}>
                {plan.accent && <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#0A6E5C' }}>Most Popular</div>}
                <div className="text-base font-semibold mb-2" style={{ color: '#626260' }}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{plan.price}</span>
                  {plan.period && <span className="text-sm" style={{ color: '#626260' }}>{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 shrink-0" style={{ color: '#0A6E5C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block w-full text-center py-3 rounded-lg text-sm font-medium transition-all" style={{ background: plan.accent ? '#0A6E5C' : '#F3F4F6', color: plan.accent ? '#fff' : '#374151', boxShadow: plan.accent ? 'inset 0 -2px 0 0 #085a4a' : 'none' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Questions, answered
            </h2>
            <p className="text-lg" style={{ color: '#626260' }}>
              Everything traders ask us before starting.
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E8E5E1' }}>
                <summary className="flex items-center justify-between gap-4 px-8 py-5 text-base font-medium cursor-pointer select-none list-none" style={{ color: '#111' }}>
                  {faq.q}
                  <svg className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" style={{ color: '#9CA3AF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-8 pb-6 -mt-1 text-sm leading-relaxed" style={{ color: '#626260' }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Stop copy-pasting quotes.<br />
            <span style={{ color: '#0A6E5C' }}>Start closing deals.</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: '#626260' }}>
            Join trading companies in HK, Shenzhen, and beyond who are already using AI to quote faster and win more deals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 rounded-lg text-sm font-medium text-white transition-all active:translate-y-px active:scale-[0.99]" style={{ background: '#0A6E5C', boxShadow: 'inset 0 -2px 0 0 #085a4a' }}>
              Get Started Free
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-lg text-sm font-medium border transition-colors hover:bg-black/[0.03]" style={{ borderColor: '#D9D7CB', color: '#374151' }}>
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: '#E8E5E1' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm font-semibold" style={{ color: '#111' }}>TradeFlow</div>
          <div className="flex items-center gap-6 text-sm" style={{ color: '#626260' }}>
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
          </div>
          <div className="text-xs" style={{ color: '#B0ADA8' }}>© 2026 TradeFlow. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
