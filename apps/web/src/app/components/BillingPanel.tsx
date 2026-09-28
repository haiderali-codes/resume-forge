'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, CreditCard, Sparkles } from 'lucide-react';
import Spinner from './Spinner';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1';

type Usage = {
  plan: 'FREE' | 'PRO';
  resumeUploads: number;
  resumeUploadLimit: number;
  jobDescriptions: number;
  jobDescriptionLimit: number;
};

export default function BillingPanel() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadUsage() {
    try {
      const response = await fetch(`${API_URL}/usage`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.message ?? 'Unable to load subscription');
      }

      setUsage(body);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load subscription',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsage();
  }, []);

  async function upgrade() {
    setCheckoutLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/billing/checkout`, {
        method: 'POST',
        credentials: 'include',
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.message ?? 'Unable to start checkout');
      }

      const checkoutUrl = body.url ?? body.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error('Stripe checkout URL was not returned');
      }

      window.location.assign(checkoutUrl);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to start checkout',
      );
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Spinner />
          Loading subscription…
        </div>
      </section>
    );
  }

  if (!usage) {
    return (
      <section className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-300">
        {error || 'Subscription information is unavailable.'}
      </section>
    );
  }

  const isPro = usage.plan === 'PRO';

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl">
      <div className="border-b border-white/10 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles size={18} />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                Subscription
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold text-white">
              {isPro ? 'ResumeForge Pro' : 'Choose your plan'}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {isPro
                ? 'You have access to the full resume intelligence workspace.'
                : 'Upgrade to unlock higher processing limits and unlimited workflow flexibility.'}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-bold ${
              isPro
                ? 'bg-emerald-400/15 text-emerald-300'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {usage.plan}
          </span>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <UsageCard
            label="Resume uploads"
            used={usage.resumeUploads}
            limit={usage.resumeUploadLimit}
          />

          <UsageCard
            label="Job descriptions"
            used={usage.jobDescriptions}
            limit={usage.jobDescriptionLimit}
          />
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
          <CreditCard className="text-cyan-300" size={22} />

          <h2 className="mt-4 text-lg font-semibold text-white">
            {isPro ? 'You are on Pro' : 'Upgrade to Pro'}
          </h2>

          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <Feature text="100 resume uploads" />
            <Feature text="100 job descriptions" />
            <Feature text="Priority resume workflows" />
          </ul>

          {!isPro && (
            <button
              type="button"
              onClick={upgrade}
              disabled={checkoutLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutLoading ? (
                <>
                  <Spinner />
                  Opening checkout…
                </>
              ) : (
                'Upgrade with Stripe'
              )}
            </button>
          )}

          {isPro && (
            <Link
              href="/"
              className="mt-6 block rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/5"
            >
              Return to workspace
            </Link>
          )}
        </div>
      </div>

      {error && (
        <p className="mx-6 mb-6 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300 sm:mx-8">
          {error}
        </p>
      )}
    </section>
  );
}

function UsageCard({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const percentage = Math.min((used / Math.max(limit, 1)) * 100, 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-slate-400">{label}</p>

      <div className="mt-3 flex items-end justify-between">
        <p className="text-3xl font-bold text-white">{used}</p>
        <p className="text-sm text-slate-500">of {limit}</p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check size={16} className="text-cyan-300" />
      {text}
    </li>
  );
}