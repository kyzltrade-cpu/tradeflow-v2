'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Signup failed -- no user returned');
      setLoading(false);
      return;
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName })
      .select()
      .single();

    if (companyError || !company) {
      setError(companyError?.message ?? 'Failed to create company');
      setLoading(false);
      return;
    }

    const { error: userError } = await supabase.from('users').insert({
      company_id: company.id,
      email,
      full_name: fullName,
      role: 'OWNER',
    });

    if (userError) {
      setError(userError.message);
      setLoading(false);
      return;
    }

    router.push('/admin/inbox');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#FAF9F6' }}>
      {/* Left panel -- brand */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12" style={{ background: '#0A6E5C' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '180px' }}></div>
        <div className="relative z-10">
          <div className="text-white/60 text-sm font-medium tracking-[0.2em] uppercase">TradeFlow</div>
        </div>
        <div className="relative z-10">
          <h1 className="text-white text-4xl leading-[1.1] tracking-[-0.02em] font-semibold" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Start quoting in 15 minutes.
          </h1>
          <p className="text-white/60 text-base mt-4 max-w-md leading-relaxed">
            Upload your supplier docs. AI learns your products, prices, and margins. Your first cited quote is ready before lunch.
          </p>
        </div>
        <div className="relative z-10 text-white/40 text-xs">
          Free 14-day trial. No credit card.
        </div>
      </div>

      {/* Right panel -- form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-10">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]" style={{ color: '#111', fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Start your free trial
            </h2>
            <p className="text-sm mt-1.5" style={{ color: '#8A8A88' }}>
              No credit card required. Live in 15 minutes.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: '#8A8A88' }}>
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors"
                style={{ borderColor: '#D9D7CB', background: '#fff' }}
                placeholder="Pacific Trading Co."
              />
            </div>
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: '#8A8A88' }}>
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors"
                style={{ borderColor: '#D9D7CB', background: '#fff' }}
                placeholder="David Wong"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: '#8A8A88' }}>
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors"
                style={{ borderColor: '#D9D7CB', background: '#fff' }}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: '#8A8A88' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors"
                style={{ borderColor: '#D9D7CB', background: '#fff' }}
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-medium text-white transition-all active:translate-y-px active:scale-[0.99] disabled:opacity-50"
              style={{ background: '#0A6E5C', boxShadow: 'inset 0 -2px 0 0 #085a4a' }}
            >
              {loading ? 'Creating account...' : 'Start Free Trial'}
            </button>
          </form>

          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid #E8E5E1' }}>
            <p className="text-sm" style={{ color: '#8A8A88' }}>
              Already have an account?{' '}
              <a href="/login" className="font-medium hover:underline" style={{ color: '#0A6E5C' }}>Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
