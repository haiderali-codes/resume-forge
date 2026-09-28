'use client';

import { useState, type FormEvent } from 'react';
import Spinner from './Spinner';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1';

export default function JobDescriptionForm() {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (description.trim().length < 20) {
      setError('Please add a more detailed job description.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_URL}/job-descriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          company: company.trim() || undefined,
          description: description.trim(),
          sourceUrl: sourceUrl.trim() || undefined,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(body?.message)
            ? body.message.join(', ')
            : body?.message ?? 'Could not save job description',
        );
      }

      setMessage('Job description saved successfully.');
      setTitle('');
      setCompany('');
      setDescription('');
      setSourceUrl('');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-950/10 backdrop-blur sm:p-8"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-xl text-violet-300">
          ◎
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            Target role
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Add a job description
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Save the opportunity you want to match and tailor your
            resume against.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-300">
            Job title
          </span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Senior Full Stack Engineer"
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-300">
            Company
          </span>
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Company name"
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-slate-300">
          Job description
        </span>
        <textarea
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Paste the responsibilities, requirements, and preferred skills…"
          rows={8}
          className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
        />
        <span className="block text-right text-xs text-slate-500">
          {description.length} characters
        </span>
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-slate-300">
          Source URL <span className="text-slate-600">(optional)</span>
        </span>
        <input
          type="url"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          placeholder="https://company.com/jobs/123"
          className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
        />
      </label>

        <button
        type="submit"
        disabled={loading}
        className="mt-6 flex items-center gap-2 rounded-xl bg-violet-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
        {loading ? (
            <>
            <Spinner />
            Saving…
            </>
        ) : (
            'Save job description'
        )}
        </button>

      {message && (
        <p className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}