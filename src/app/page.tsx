import Link from 'next/link';

/* ── Data ───────────────────────────────────────────────────────────────── */

const LOGOS = [
  'Pacific Trading Co.',
  'Global Supply HK',
  'Shenzhen Direct',
  'AsiaSource Ltd',
  'HK Logistics',
  'Pearl River Trading',
];

const METRICS = [
  { value: '462', label: 'HK Trading Firms', sublabel: 'surveyed by HKTDC 2026' },
  { value: '79%', label: 'AI Adoption Rate', sublabel: 'tripled from 25% in 2024' },
  { value: '40%', label: 'Less Admin Time', sublabel: 'per inquiry cycle' },
  { value: '24h', label: 'Quote Turnaround', sublabel: 'down from 3-5 days' },
];

const FEATURES = [
  {
    icon: '🧠',
    title: 'Company Brain',
    desc: 'AI learns your products, suppliers, margins, and certifications. Every quote it builds gets smarter.',
    detail: 'Upload specs, pricing sheets, and supplier docs. TradeFlow builds a knowledge graph that powers every future quote.',
  },
  {
    icon: '✉️',
    title: 'Email-First Inbox',
    desc: 'Forward RFQs. TradeFlow extracts every spec, detects gaps, and drafts clarifications in your language.',
    detail: 'No new software to learn. Works from the email you already use. Supports English, 中文, and mixed-language threads.',
  },
  {
    icon: '📊',
    title: 'Cited Quotes',
    desc: 'Every number on your quote has a source. Supplier price, margin, FX rate — all traceable.',
    detail: 'AI cites where every data point came from. Show customers confidence, not guesswork.',
  },
  {
    icon: '🔄',
    title: 'Smart Follow-ups',
    desc: 'Auto-scheduled follow-ups that stop the moment a customer replies. No embarrassing double-texts.',
    detail: 'AI drafts messages in the customer\'s language. Human approves before send. WhatsApp-compliant within 24h window.',
  },
];

const STEPS = [
  { num: '01', title: 'Forward the RFQ', desc: 'Send the customer email to TradeFlow. That\'s it.' },
  { num: '02', title: 'AI Extracts & Cites', desc: 'Every spec, quantity, and requirement pulled with source citations.' },
  { num: '03', title: 'Brain Drafts the Quote', desc: 'Uses your real supplier prices, margins, and certifications.' },
  { num: '04', title: 'You Approve, Send', desc: 'Review the draft. One click to send to the customer.' },
];

const TESTIMONIALS = [
  {
    quote: 'We went from 3-day quotes to same-day. Our close rate doubled.',
    name: 'David Wong',
    role: 'Director, Pacific Trading Co.',
    metric: '2x close rate',
  },
  {
    quote: 'The AI catches spec gaps I used to miss. Fewer back-and-forth emails.',
    name: 'Priya Sharma',
    role: 'Procurement Lead, AsiaSource',
    metric: '60% fewer emails',
  },
];

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF9F6', color: '#111' }}>
      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b" style={{ background: 'rgba(250,249,246,0.85)', borderColor: '#E8E5E1' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: '#0A6E5C' }}>TF</div>
            <span className="text-lg font-semibold tracking-tight">TradeFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: '#626260' }}>
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/inbox" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors" style={{ color: '#626260' }}>
              Log in
            </Link>
            <Link href="/admin/inbox" className="text-sm font-semibold px-5 py-2.5 rounded-lg text-white transition-all hover:shadow-lg" style={{ background: '#0A6E5C' }}>
              Start Free →
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
            <Link href="/admin/inbox" className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:shadow-xl hover:scale-[1.02]" style={{ background: '#0A6E5C' }}>
              Start Free Trial
            </Link>
            <Link href="/admin/inbox" className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold border-2 transition-all hover:shadow-md" style={{ borderColor: '#D1D5DB', color: '#374151' }}>
              See a Live Demo
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Traded by teams across Hong Kong & Shenzhen</p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {LOGOS.map((name) => (
                <span key={name} className="text-sm font-medium" style={{ color: '#B0ADA8' }}>{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Preview ── */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border overflow-hidden shadow-2xl" style={{ background: '#fff', borderColor: '#E5EDF5' }}>
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: '#F8FAFD', borderColor: '#E5EDF5' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }}></div>
                <div className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }}></div>
                <div className="w-3 h-3 rounded-full" style={{ background: '#28C840' }}></div>
              </div>
              <div className="flex-1 mx-4">
                <div className="px-4 py-1.5 rounded-lg text-xs font-mono" style={{ background: '#E5EDF5', color: '#50617A' }}>
                  app.tradeflow.ai/admin/inbox
                </div>
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="p-6 md:p-10" style={{ background: '#F8FAFD' }}>
              <div className="grid grid-cols-12 gap-4">
                {/* Sidebar */}
                <div className="col-span-3 hidden md:block space-y-2">
                  {['Inbox', 'Work Queue', 'Quotes', 'Drafts', 'Knowledge Base'].map((item, i) => (
                    <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: i === 0 ? '#EFF6FF' : 'transparent', color: i === 0 ? '#2563EB' : '#50617A', fontWeight: i === 0 ? 600 : 400 }}>
                      <span className="w-4 h-4 rounded" style={{ background: i === 0 ? '#2563EB' : '#D1D5DB' }}></span>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main */}
                <div className="col-span-12 md:col-span-9 space-y-3">
                  {/* Status bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#E6F4F0', color: '#0A6E5C' }}>5 new RFQs</div>
                    <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#FEF3C7', color: '#92400E' }}>3 awaiting reply</div>
                    <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#EFF6FF', color: '#2563EB' }}>2 drafts ready</div>
                  </div>
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold rounded-lg" style={{ background: '#E5EDF5', color: '#50617A' }}>
                    <div className="col-span-5">Subject</div>
                    <div className="col-span-2">From</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">AI Confidence</div>
                    <div className="col-span-1">Date</div>
                  </div>
                  {/* Rows */}
                  {[
                    { subj: 'RFQ: 10,000 x 500ml Vacuum Bottles', from: 'Sarah Chen', status: 'Ready to Quote', conf: '94%', date: 'Sep 15', color: '#038153' },
                    { subj: 'Re: Silicone Kitchen Set Pricing', from: 'Wei Zhang', status: 'Awaiting Info', conf: '72%', date: 'Sep 14', color: '#AD5918' },
                    { subj: 'RFQ: Custom USB-C Chargers 5000pcs', from: 'James Lee', status: 'Extracting', conf: '88%', date: 'Sep 14', color: '#2563EB' },
                    { subj: 'Quote Follow-up: LED Desk Lamps', from: 'Maria Santos', status: 'Draft Sent', conf: '91%', date: 'Sep 13', color: '#7C3AED' },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 rounded-lg text-sm items-center border" style={{ background: '#fff', borderColor: '#F0F0F0' }}>
                      <div className="col-span-5 font-medium truncate">{row.subj}</div>
                      <div className="col-span-2" style={{ color: '#50617A' }}>{row.from}</div>
                      <div className="col-span-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: row.color + '15', color: row.color }}>{row.status}</span>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5EDF5' }}>
                            <div className="h-full rounded-full" style={{ width: row.conf, background: row.color }}></div>
                          </div>
                          <span className="text-xs font-mono" style={{ color: '#50617A' }}>{row.conf}</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-xs" style={{ color: '#9CA3AF' }}>{row.date}</div>
                    </div>
                  ))}
                  {/* AI insight bar */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed" style={{ borderColor: '#0A6E5C40', background: '#E6F4F020' }}>
                    <span className="text-lg">✨</span>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: '#0A6E5C' }}>AI Insight: </span>
                      <span className="text-sm" style={{ color: '#50617A' }}>Sarah Chen&apos;s RFQ matches a supplier quote you received last week. Ready to quote at 32% margin.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics ── */}
      <section className="py-20 px-6" style={{ background: '#0A6E5C' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {METRICS.map((m) => (
            <div key={m.label}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{m.value}</div>
              <div className="text-sm font-semibold text-white/90">{m.label}</div>
              <div className="text-xs text-white/60 mt-1">{m.sublabel}</div>
            </div>
          ))}
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
                <div className="text-3xl mb-4">{f.icon}</div>
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

      {/* ── Testimonials ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Trusted by trading teams
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-8 rounded-2xl border" style={{ background: '#fff', borderColor: '#E8E5E1' }}>
                <div className="text-3xl font-bold mb-4" style={{ color: '#0A6E5C' }}>{t.metric}</div>
                <p className="text-lg leading-relaxed mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#0A6E5C' }}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs" style={{ color: '#626260' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
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
                <Link href="/admin/inbox" className="block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: plan.accent ? '#0A6E5C' : '#F3F4F6', color: plan.accent ? '#fff' : '#374151' }}>
                  {plan.cta}
                </Link>
              </div>
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
            <Link href="/admin/inbox" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white transition-all hover:shadow-xl hover:scale-[1.02]" style={{ background: '#0A6E5C' }}>
              Get Started Free
            </Link>
            <Link href="/admin/inbox" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold border-2 transition-all hover:shadow-md" style={{ borderColor: '#D1D5DB', color: '#374151' }}>
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: '#E8E5E1' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: '#0A6E5C' }}>TF</div>
            <span className="text-sm font-semibold">TradeFlow</span>
          </div>
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
