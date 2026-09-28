'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import Spinner from '../components/Spinner';
import { toast } from 'sonner';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1';

export default function SignupPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  function updateField(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(body?.message)
            ? body.message.join(', ')
            : body?.message ?? 'Signup failed',
        );
      }

      await refreshUser();

        toast.success('Account created', {
        description: 'Welcome to ResumeForge.',
        });

        setTimeout(() => {
        router.replace('/');
        }, 300);
    } catch (error) {
        const message =
        error instanceof Error
        ? error.message
        : 'Could not create your account.';

        setError(message);

        toast.error('Signup failed', {
            description: message,
        });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b16] px-5 text-white">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl"
      >
        <div className="mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
            R
          </div>

          <h1 className="mt-6 text-3xl font-bold">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Start building stronger applications.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="First name"
            value={form.firstName}
            onChange={(event) =>
              updateField('firstName', event.target.value)
            }
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
          />

          <input
            required
            placeholder="Last name"
            value={form.lastName}
            onChange={(event) =>
              updateField('lastName', event.target.value)
            }
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
          />
        </div>

        <input
          required
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(event) =>
            updateField('email', event.target.value)
          }
          className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
        />

        <input
          required
          minLength={8}
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) =>
            updateField('password', event.target.value)
          }
          className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
        />

        <button
        type="submit"
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
        {loading ? (
            <>
            <Spinner />
            Creating account…
            </>
        ) : (
            'Create account'
        )}
        </button>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-cyan-300 hover:text-cyan-200"
          >
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}