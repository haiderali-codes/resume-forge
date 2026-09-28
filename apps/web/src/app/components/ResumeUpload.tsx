'use client';

import { useState } from 'react';
import Spinner from './Spinner';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1';

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) {
      setError('Please select a PDF or DOCX file.');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Uploading resume…');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${API_URL}/resumes`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const uploadedResume = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          Array.isArray(uploadedResume?.message)
            ? uploadedResume.message.join(', ')
            : uploadedResume?.message ?? 'Upload failed',
        );
      }

      setStatus('Processing resume…');

      for (let attempt = 0; attempt < 60; attempt += 1) {
        const statusResponse = await fetch(
          `${API_URL}/resumes/${uploadedResume.id}/status`,
          {
            credentials: 'include',
          },
        );

        const resumeStatus = await statusResponse.json();

        setProgress(resumeStatus.progress ?? 0);

        if (resumeStatus.status === 'COMPLETED') {
          setStatus('Resume processed successfully');
          setProgress(100);
          break;
        }

        if (resumeStatus.status === 'FAILED') {
          throw new Error(
            resumeStatus.errorMessage ??
              'Resume processing failed',
          );
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1000),
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
      setStatus('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
        Source material
      </p>

      <h2 className="mt-2 text-2xl font-semibold">
        Upload your resume
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Add a PDF or DOCX file for processing.
      </p>

      <label className="mt-7 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/30 bg-slate-950/50 px-6 py-10 text-center transition hover:border-cyan-300 hover:bg-cyan-400/5">
        <span className="text-3xl text-cyan-300">＋</span>

        <span className="mt-3 text-sm font-semibold text-slate-200">
          {file ? file.name : 'Choose a resume file'}
        </span>

        <span className="mt-2 text-xs text-slate-500">
          PDF or DOCX · maximum 10 MB
        </span>

        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) =>
            setFile(event.target.files?.[0] ?? null)
          }
          className="sr-only"
        />
      </label>

        <button
        type="button"
        onClick={handleUpload}
        disabled={loading}
        className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
        {loading ? (
            <>
            <Spinner />
            Processing…
            </>
        ) : (
            'Upload resume'
        )}
        </button>

      {status && (
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>{status}</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}