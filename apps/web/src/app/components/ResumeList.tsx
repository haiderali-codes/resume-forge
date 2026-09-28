'use client';

import { useEffect, useState } from 'react';
import { FileText, RefreshCw, Trash2 } from 'lucide-react';
import Spinner from './Spinner';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1';

type Resume = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  progress: number;
  extractedText?: string | null;
  createdAt: string;
};

export default function ResumeList() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  async function loadResumes(showRefreshLoader = false) {
    if (showRefreshLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await fetch(`${API_URL}/resumes`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(body?.message)
            ? body.message.join(', ')
            : body?.message ?? 'Could not load resumes',
        );
      }

      setResumes(body);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Could not load resumes',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadResumes();
  }, []);

  function formatSize(sizeBytes: number) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  }

  async function deleteResume(resumeId: string) {
        const confirmed = window.confirm(
            'Delete this resume and all of its versions?',
        );

        if (!confirmed) {
            return;
        }

        setDeletingId(resumeId);
        setError('');

        try {
            const response = await fetch(
            `${API_URL}/resumes/${resumeId}`,
            {
                method: 'DELETE',
                credentials: 'include',
            },
            );

            const body = await response.json();

            if (!response.ok) {
            throw new Error(
                Array.isArray(body?.message)
                ? body.message.join(', ')
                : body?.message ?? 'Could not delete resume',
            );
            }

            setResumes((current) =>
            current.filter((resume) => resume.id !== resumeId),
            );
        } catch (error) {
            setError(
            error instanceof Error
                ? error.message
                : 'Could not delete resume',
            );
        } finally {
            setDeletingId(null);
        }
    }

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Your library
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Uploaded resumes
          </h2>
        </div>

        <button
          type="button"
          onClick={() => void loadResumes(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-white disabled:opacity-50"
        >
          {refreshing ? (
            <Spinner />
          ) : (
            <RefreshCw size={15} />
          )}
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-10 text-sm text-slate-400">
          <Spinner size="md" />
          Loading your resumes…
        </div>
      )}

      {!loading && error && (
        <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && resumes.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <FileText className="mx-auto text-slate-500" size={32} />

          <p className="mt-4 font-semibold text-slate-300">
            No resumes uploaded yet
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Upload your first resume above to start processing.
          </p>
        </div>
      )}

      {!loading && !error && resumes.length > 0 && (
        <div className="mt-6 space-y-3">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-cyan-400/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-cyan-400/10 p-3 text-cyan-300">
                  <FileText size={20} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {resume.originalName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatSize(resume.sizeBytes)} ·{' '}
                    {formatDate(resume.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    resume.status === 'COMPLETED'
                      ? 'bg-emerald-400/10 text-emerald-300'
                      : resume.status === 'FAILED'
                        ? 'bg-red-400/10 text-red-300'
                        : 'bg-amber-400/10 text-amber-300'
                  }`}
                >
                  {resume.status}
                </span>

                <button
                    type="button"
                    onClick={() => void deleteResume(resume.id)}
                    disabled={deletingId === resume.id}
                    className="flex items-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    {deletingId === resume.id ? (
                        <>
                        <Spinner />
                        Deleting…
                        </>
                    ) : (
                        <>
                        <Trash2 size={14} />
                        Delete
                        </>
                    )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}