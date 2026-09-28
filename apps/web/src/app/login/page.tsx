'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useAuth } from '../components/AuthProvider';
import Spinner from '../components/Spinner';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1';

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    refreshUser,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      window.location.replace('/');
    }
  }, [authLoading, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(body?.message)
            ? body.message.join(', ')
            : body?.message ?? 'Login failed',
        );
      }

      const authenticatedUser = await refreshUser();

      if (!authenticatedUser) {
        throw new Error(
          'Login succeeded, but the session could not be restored.',
        );
      }

      toast.success('Login successful', {
        description: 'Welcome back to ResumeForge.',
      });

      window.location.replace('/');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Invalid email or password.';

      setError(message);

      toast.error('Login failed', {
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
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in to continue building stronger applications.
          </p>
        </div>

        <label className="block text-sm font-medium text-slate-300">
          Email address

          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-300">
          Password

          <input
            required
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Your password"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
          />
        </label>

        <button
          type="submit"
          disabled={loading || authLoading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Spinner />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Don’t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-cyan-300 hover:text-cyan-200"
          >
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}