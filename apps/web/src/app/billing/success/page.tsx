'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function BillingSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b16] px-5 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-8 text-center">
        <CheckCircle2 className="mx-auto text-emerald-300" size={54} />

        <h1 className="mt-6 text-3xl font-bold">
          Payment successful
        </h1>

        <p className="mt-3 text-slate-400">
          Your Pro subscription is being activated. It may take a few seconds
          for the webhook to update your account.
        </p>

        <Link
          href="/billing"
          className="mt-7 inline-flex rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300"
        >
          View subscription
        </Link>
      </section>
    </main>
  );
}