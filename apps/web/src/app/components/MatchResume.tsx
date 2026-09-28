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

type MatchResult = {
  status: string;
  progress: number;
  matchScore?: number | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  errorMessage?: string | null;
};

export default function MatchResume() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [resumeId, setResumeId] = useState('');
  const [jobDescriptionId, setJobDescriptionId] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
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

  async function createMatch() {
    if (!resumeId || !jobDescriptionId) {
      setError('Select a resume and job description first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/matches`, {
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
            : body?.message ?? 'Could not create match',
        );
      }

      for (let attempt = 0; attempt < 60; attempt += 1) {
        const statusResponse = await fetch(
          `${API_URL}/matches/${body.id}`,
          {
            credentials: 'include',
          },
        );

        const status: MatchResult =
          await statusResponse.json();

        setResult(status);

        if (
          status.status === 'COMPLETED' ||
          status.status === 'FAILED'
        ) {
          if (status.status === 'FAILED') {
            throw new Error(
              status.errorMessage ?? 'Matching failed',
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
          : 'Matching failed',
      );
    } finally {
      setLoading(false);
    }
  }

  const score = Math.round(result?.matchScore ?? 0);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
        Fit analysis
      </p>

      <h2 className="mt-2 text-2xl font-semibold">
        Match your resume
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Compare your experience with a target job.
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <SelectField
          value={resumeId}
          onChange={setResumeId}
          placeholder="Select a completed resume"
          options={resumes.map((resume) => ({
            value: resume.id,
            label: resume.originalName,
          }))}
        />

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
      </div>

        <button
        type="button"
        onClick={createMatch}
        disabled={loading}
        className="mt-6 flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
        {loading ? (
            <>
            <Spinner />
            Analysing…
            </>
        ) : (
            'Analyse match'
        )}
        </button>

      {result?.status === 'COMPLETED' && (
        <div className="mt-7 grid gap-5 lg:grid-cols-[180px_1fr]">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 p-6">
            <span className="text-xs uppercase tracking-widest text-amber-200">
              Match score
            </span>

            <span className="mt-2 text-5xl font-bold">
              {score}%
            </span>
          </div>

          <div className="space-y-5">
            <SkillGroup
              title="Matched skills"
              skills={result.matchedSkills}
              color="emerald"
            />

            <SkillGroup
              title="Skills to strengthen"
              skills={result.missingSkills}
              color="rose"
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

function SkillGroup({
  title,
  skills,
  color,
}: {
  title: string;
  skills?: string[];
  color: 'emerald' | 'rose';
}) {
  const styles =
    color === 'emerald'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
      : 'border-rose-400/20 bg-rose-400/10 text-rose-200';

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-300">
        {title}
      </p>

      <div className="flex flex-wrap gap-2">
        {skills?.length ? (
          skills.map((skill) => (
            <span
              key={skill}
              className={`rounded-full border px-3 py-1.5 text-xs ${styles}`}
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">
            None identified
          </span>
        )}
      </div>
    </div>
  );
}