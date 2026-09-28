import Link from 'next/link';

export default function BillingCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b16] px-5 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <h1 className="text-3xl font-bold">
          Checkout cancelled
        </h1>

        <p className="mt-3 text-slate-400">
          No payment was made. You can return to billing whenever you are ready.
        </p>

        <Link
          href="/billing"
          className="mt-7 inline-flex rounded-xl border border-white/10 px-6 py-3 font-semibold text-slate-200 hover:bg-white/5"
        >
          Return to billing
        </Link>
      </section>
    </main>
  );
}