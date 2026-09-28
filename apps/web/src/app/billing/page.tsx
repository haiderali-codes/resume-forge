import Link from 'next/link';
import AuthGate from '../components/AuthGate';
import BillingPanel from '../components/BillingPanel';

export default function BillingPage() {
  return (
    <AuthGate>
      <main className="min-h-screen bg-[#070b16] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-300"
          >
            <span aria-hidden="true">←</span>
            Back to dashboard
          </Link>

          <BillingPanel />
        </div>
      </main>
    </AuthGate>
  );
}