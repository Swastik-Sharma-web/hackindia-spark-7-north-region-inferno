'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredUserScore } from '@/lib/score-store';
import { useJobs, useDashboardActions } from '@/lib/api-hooks';
import { useAccount } from 'wagmi';



export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [userScore, setUserScore] = useState(0);
  const { jobs: dbJobs, loading: jobsLoading, fetchJobs } = useJobs();
  const { applyForJob } = useDashboardActions();
  const { address } = useAccount();
  const [allJobs, setAllJobs] = useState<any[]>([]);

  useEffect(() => {
    setUserScore(getStoredUserScore());
  }, []);

  useEffect(() => {
    // Show only DB jobs
    setAllJobs(dbJobs);
  }, [dbJobs]);

  const fallbackAddress = '0xDemoFreelancer0987654321';
  const effectiveAddress = address || fallbackAddress;

  const isApplied = (job: any) => {
    if (appliedJobs.includes(String(job.id))) return true;
    if (job.freelancer?.wallet === effectiveAddress) return true;
    return false;
  };

  const isClaimedByOther = (job: any) => {
    if (job.status === 'OPEN') return false;
    return !isApplied(job);
  };

  const handleApply = async (jobId: string | number) => {
    if (!isApplied({ id: jobId })) {
      try {
        if (typeof jobId === 'string') {
          // It's a DB job
          await applyForJob(jobId, effectiveAddress);
          await fetchJobs(); // Refresh DB jobs to show it's no longer OPEN
        }
        setAppliedJobs([...appliedJobs, String(jobId)]);
        alert('✓ Application submitted with your Reputation Passport!');
        setSelectedJob(null);
      } catch (err) {
        alert('Failed to apply. Make sure you are connected.');
      }
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12 text-white">
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-violet-300">Job Board</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Verified Freelance Work</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/client" className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-400/20 transition-colors">
            Post a Job
          </Link>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 font-mono text-sm text-cyan-300">
            Your Score: {userScore}/100
          </div>
          <Link href="/" className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:border-white/30">
            Back Home
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid gap-4">
          {allJobs.map((job) => (
            <article
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className={`cursor-pointer rounded-[24px] border transition-all ${
                selectedJob?.id === job.id
                  ? 'border-cyan-400/50 bg-cyan-400/10 shadow-lg shadow-cyan-400/20'
                  : 'border-white/10 bg-white/5 hover:border-cyan-400/30 hover:bg-white/7'
              } backdrop-blur-xl p-5`}
            >
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{job.title}</h2>
                  <p className="mt-2 text-sm text-slate-300">Required skill: {job.skill}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1">{job.budget}</span>
                  <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1">{job.score}</span>
                  {isApplied(job) && (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-300">Applied ✓</span>
                  )}
                  {isClaimedByOther(job) && (
                    <span className="rounded-full border border-slate-400/30 bg-slate-400/10 px-3 py-1 text-slate-300">Claimed</span>
                  )}
                  {'escrowStatus' in job && job.escrowStatus === 'LOCKED' && (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-300">🔒 Escrow</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {selectedJob ? (
          <div className="rounded-[24px] border border-cyan-400/30 bg-cyan-400/5 p-6 backdrop-blur-xl">
            <div className="mb-6 border-b border-cyan-400/20 pb-4">
              <h2 className="text-2xl font-bold">{selectedJob.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{selectedJob.description}</p>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Budget</p>
                <p className="mt-2 text-2xl font-bold text-cyan-300">{selectedJob.budget}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Min. Score Required</p>
                <p className="mt-2 text-2xl font-bold text-violet-300">{selectedJob.score}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Timeline</p>
                <p className="mt-2 text-lg font-bold text-slate-200">{selectedJob.timeline}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Skill Required</p>
                <p className="mt-2 text-lg font-bold text-slate-200">{selectedJob.skill}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">What we're looking for:</p>
              <ul className="space-y-2">
                {selectedJob.details.map((detail, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-300">
                    <span className="text-cyan-400">✓</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApply(selectedJob.id)}
                disabled={isApplied(selectedJob) || isClaimedByOther(selectedJob) || userScore < parseInt(selectedJob.score)}
                className={`flex-1 rounded-full px-6 py-3 font-medium transition-all ${
                  isApplied(selectedJob)
                    ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : isClaimedByOther(selectedJob)
                    ? 'border border-slate-400/30 bg-slate-400/10 text-slate-300 cursor-not-allowed'
                    : userScore < parseInt(selectedJob.score)
                    ? 'border border-red-400/30 bg-red-400/10 text-red-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:shadow-glow'
                }`}
              >
                {isApplied(selectedJob)
                  ? '✓ Applied with Passport'
                  : isClaimedByOther(selectedJob)
                  ? 'Claimed by Another'
                  : userScore < parseInt(selectedJob.score)
                  ? `Requires Score ${selectedJob.score}`
                  : 'Apply with Passport'}
              </button>
              <button
                onClick={() => setSelectedJob(null)}
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-slate-300 hover:border-white/30"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-center">
              <p className="text-slate-400">Select a job to view details</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
