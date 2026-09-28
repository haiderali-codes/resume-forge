'use client';

import { useEffect, useState } from 'react';
import Spinner from './Spinner';
import SelectField from './SelectField';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1';

type Resume = {
  id: string;
  originalName: string;
  status: string;
};

type JobDescription = {
  id: string;
  title: string;
  company?: string | null;
};

type Generation = {
  id: string;
  status: string;
  progress: number;
  outputText?: string | null;
  errorMessage?: string | null;
};

export default function GenerateResume() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [resumeId, setResumeId] = useState('');
  const [jobDescriptionId, setJobDescriptionId] = useState('');
  const [generation, setGeneration] =
    useState<Generation | null>(null);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [resumesResponse, jobsResponse] = await Promise.all([
          fetch(`${API_URL}/resumes`, {
            credentials: 'include',
          }),
          fetch(`${API_URL}/job-descriptions`, {
            credentials: 'include',
          }),
        ]);

        if (!resumesResponse.ok || !jobsResponse.ok) {
          throw new Error('Could not load workspace data');
        }

        const resumesBody = await resumesResponse.json();
        const jobsBody = await jobsResponse.json();

        setResumes(
          resumesBody.filter(
            (resume: Resume) => resume.status === 'COMPLETED',
          ),
        );

        setJobs(jobsBody);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Could not load data',
        );
      }
    }

    void loadData();
  }, []);

  async function generateResume() {
    if (!resumeId || !jobDescriptionId) {
      setError('Select a resume and job description.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneration(null);

    try {
      const response = await fetch(`${API_URL}/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          resumeId,
          jobDescriptionId,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(body?.message)
            ? body.message.join(', ')
            : body?.message ?? 'Generation failed',
        );
      }

      for (let attempt = 0; attempt < 60; attempt += 1) {
        const statusResponse = await fetch(
          `${API_URL}/generations/${body.id}`,
          {
            credentials: 'include',
          },
        );

        const status: Generation =
          await statusResponse.json();

        setGeneration(status);

        if (
          status.status === 'COMPLETED' ||
          status.status === 'FAILED'
        ) {
          if (status.status === 'FAILED') {
            throw new Error(
              status.errorMessage ?? 'Generation failed',
            );
          }

          break;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 500),
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Generation failed',
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
    if (!generation?.id) {
      return;
    }

    setDownloading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/generations/${generation.id}/download`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Unable to download generated resume');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = downloadUrl;
      anchor.download = `tailored-resume-${generation.id}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Download failed',
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
        AI workspace
      </p>

      <h2 className="mt-2 text-2xl font-semibold">
        Generate a tailored resume
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Create a focused resume for a specific opportunity.
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-300">
            Source resume
          </span>

          <SelectField
            value={resumeId}
            onChange={setResumeId}
            placeholder="Select a completed resume"
            options={resumes.map((resume) => ({
              value: resume.id,
              label: resume.originalName,
            }))}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-300">
            Target job
          </span>

          <SelectField
            value={jobDescriptionId}
            onChange={setJobDescriptionId}
            placeholder="Select a job description"
            options={jobs.map((job) => ({
              value: job.id,
              label: `${job.title}${
                job.company ? ` — ${job.company}` : ''
              }`,
            }))}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={generateResume}
        disabled={loading}
        className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Spinner />
            Generating…
          </>
        ) : (
          'Generate tailored resume'
        )}
      </button>

      {generation?.status === 'PROCESSING' && (
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>Processing your resume</span>
            <span>{generation.progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${generation.progress}%` }}
            />
          </div>
        </div>
      )}

      {generation?.status === 'COMPLETED' && (
        <div className="mt-7 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-emerald-300">
                Generation completed
              </p>

              <p className="mt-1 text-xs text-emerald-200/70">
                Your tailored resume is ready.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloading}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? (
                <>
                  <Spinner />
                  Downloading…
                </>
              ) : (
                'Download PDF'
              )}
            </button>
          </div>

          <pre className="mt-5 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950/70 p-4 text-sm leading-6 text-slate-200">
            {generation.outputText}
          </pre>
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