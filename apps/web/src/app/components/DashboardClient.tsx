'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  BriefcaseBusiness,
  FileCheck2,
  FileText,
  History,
  LayoutDashboard,
  CreditCard, 
  Sparkles,
  UploadCloud,
} from 'lucide-react';

import ResumeUpload from './ResumeUpload';
import JobDescriptionForm from './JobDescriptionForm';
import MatchResume from './MatchResume';
import GenerateResume from './GenerateResume';
import ResumeList from './ResumeList';
import { useAuth } from './AuthProvider';
import Link from 'next/link';

type Section =
  | 'overview'
  | 'resume'
  | 'jobs'
  | 'matching'
  | 'generate'
  | 'history';

const navigation: {
  id: Section;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Workspace summary',
    icon: LayoutDashboard,
  },
  {
    id: 'resume',
    label: 'Resumes',
    description: 'Upload and process',
    icon: FileText,
  },
  {
    id: 'jobs',
    label: 'Job targets',
    description: 'Manage opportunities',
    icon: BriefcaseBusiness,
  },
  {
    id: 'matching',
    label: 'Match analysis',
    description: 'Compare your fit',
    icon: BarChart3,
  },
  {
    id: 'generate',
    label: 'Tailored resume',
    description: 'Create an application',
    icon: Sparkles,
  },
  {
    id: 'history',
    label: 'Version history',
    description: 'Review your drafts',
    icon: History,
  },
];

const sectionVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

type Usage = {
  plan: 'FREE' | 'PRO';
  resumeUploads: number;
  resumeUploadLimit: number;
  jobDescriptions: number;
  jobDescriptionLimit: number;
};

export default function DashboardClient() {
  const [activeSection, setActiveSection] =
    useState<Section>('overview');

  const { user, logout } = useAuth();

  const [usage, setUsage] = useState<Usage | null>(null);

  const activeNavigation = navigation.find(
    (item) => item.id === activeSection,
  );

  useEffect(() => {
      async function loadUsage() {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/usage`,
            {
              credentials: 'include',
              cache: 'no-store',
            },
          );

          if (response.ok) {
            setUsage(await response.json());
          }
        } catch {
          // Keep navigation usable if usage loading fails.
        }
      }

      void loadUsage();
  }, []);

  return (
    <main className="min-h-screen bg-[#070b16] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl lg:block">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
              R
            </div>
            <div>
              <p className="font-bold">ResumeForge</p>
              <p className="text-xs text-slate-500">
                Career intelligence
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const selected = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    selected
                      ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>
                    <span
                      className={`block text-xs ${
                        selected
                          ? 'text-slate-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
              <Link
                href="/billing"
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-cyan-400/10 bg-gradient-to-r from-cyan-400/[0.08] to-blue-500/[0.05] px-4 py-3 text-sm text-slate-300 transition-all duration-300 hover:border-cyan-400/30 hover:from-cyan-400/15 hover:to-blue-500/10 hover:text-white"
              >
                <span className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-gradient-to-b from-cyan-300 to-blue-500 opacity-70 transition group-hover:opacity-100" />

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 transition group-hover:scale-105 group-hover:bg-cyan-400/20">
                  <CreditCard size={18} />
                </span>

                <span className="flex-1">
                  {usage?.plan !== 'PRO' ? (
                  <>
                    <span className="block font-semibold">Upgrade plan</span>
                    <span className="block text-xs text-slate-500 group-hover:text-slate-400">
                      Unlock more usage
                    </span>
                  </>) :
                  <>
                  <span className="block font-semibold">View Usage</span>
                  </>}
                </span>

                <Sparkles
                  size={16}
                  className="text-cyan-300 opacity-70 transition group-hover:rotate-12 group-hover:opacity-100"
                />
              </Link>
          </nav>

          <div className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
            <Sparkles className="text-cyan-300" size={20} />
            <p className="mt-3 text-sm font-semibold">
              Build a stronger application
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Complete each stage to create a job-specific resume.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/75 px-5 py-4 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                  Workspace
                </p>

                <h1 className="mt-1 text-xl font-semibold">
                  {activeNavigation?.label}
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-white">
                    {user?.firstName} {user?.lastName}
                  </p>

                  <p className="text-xs text-slate-500">
                    {user?.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                {activeSection === 'overview' && (
                  <Overview onNavigate={setActiveSection} />
                )}

                {activeSection === 'resume' && (
                  <div>
                    <ResumeUpload />
                    <ResumeList />
                  </div>
                )}

                {activeSection === 'jobs' && <JobDescriptionForm />}

                {activeSection === 'matching' && <MatchResume />}

                {activeSection === 'generate' && <GenerateResume />}

                {activeSection === 'history' && <HistoryPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}

function Overview({
  onNavigate,
}: {
  onNavigate: (section: Section) => void;
}) {
  return (
    <div>
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
          Good to see you
        </p>

        <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Your application workspace.
        </h2>

        <p className="mt-5 text-lg leading-8 text-slate-400">
          Move through the workflow one stage at a time and create
          stronger, job-specific applications.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ['01', 'Resume', 'Upload and process your source resume.'],
          ['02', 'Target', 'Save the role you want to pursue.'],
          ['03', 'Tailor', 'Generate and download your application.'],
        ].map(([number, title, description]) => (
          <div
            key={number}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
          >
            <span className="text-sm font-bold text-cyan-300">
              {number}
            </span>
            <h3 className="mt-5 font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <ActionCard
          icon={UploadCloud}
          title="Upload a resume"
          description="Start by processing your latest PDF or DOCX."
          action="Open resume manager"
          onClick={() => onNavigate('resume')}
        />

        <ActionCard
          icon={Sparkles}
          title="Create a tailored version"
          description="Generate a focused resume for a saved job."
          action="Open generator"
          onClick={() => onNavigate('generate')}
        />
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: typeof UploadCloud;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-cyan-400/30">
      <Icon size={22} className="text-cyan-300" />
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
      >
        {action} →
      </button>
    </div>
  );
}

function HistoryPanel() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
      <FileCheck2 className="mx-auto text-cyan-300" size={32} />
      <h2 className="mt-5 text-2xl font-semibold">
        Version history
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
        Generated resume versions will appear here as you tailor
        applications for different opportunities.
      </p>
    </div>
  );
}