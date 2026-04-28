'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobs, useDashboardActions } from '@/lib/api-hooks';
import { useAccount } from 'wagmi';

export default function UnifiedDashboard() {
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');
  const { jobs: allJobs, fetchJobs } = useJobs();
  const { submitWork, approveWork, dashboardDispute, deleteJob } = useDashboardActions();
  const { address } = useAccount();
  
  // Modals & Action States
  const [submittingJobId, setSubmittingJobId] = useState<string | null>(null);
  const [workDescription, setWorkDescription] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [disputingJobId, setDisputingJobId] = useState<string | null>(null);

  // Freelancer Actions
  const handleSubmitWork = async (jobId: string) => {
    if (!workDescription.trim()) return;
    
    setProcessingAction(`Submitting work for Job...`);
    try {
      await submitWork(jobId, workDescription);
      await fetchJobs();
      setSubmittingJobId(null);
      setWorkDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingAction(null);
    }
  };

  // Client Actions
  const handleApproveWork = async (jobId: string) => {
    setProcessingAction(`Processing Escrow Transaction...`);
    try {
      await approveWork(jobId);
      await fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRaiseDispute = async (jobId: string) => {
    setProcessingAction(`Raising AI Dispute...`);
    try {
      await dashboardDispute(jobId, 'Work does not meet requirements.');
      await fetchJobs();
      setDisputingJobId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    setProcessingAction(`Canceling Job...`);
    try {
      await deleteJob(jobId);
      await fetchJobs();
    } catch (err) {
      console.error(err);
      alert('Failed to delete job');
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'IN_PROGRESS': return <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">In Escrow</span>;
      case 'SUBMITTED': return <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">Submitted for Review</span>;
      case 'RELEASED': return <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Payment Released</span>;
      case 'DISPUTED': return <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-300">Disputed (AI Review)</span>;
      default: return <span className="rounded-full border border-slate-400/30 bg-slate-400/10 px-3 py-1 text-xs text-slate-300">{status}</span>;
    }
  };

  // Filter jobs based on role and wallet
  const displayedJobs = allJobs.filter((j: any) => {
    // Freelancers use the Job Board to find OPEN jobs, so hide them on their Dashboard
    if (role === 'freelancer' && j.status === 'OPEN') return false;
    
    // In a real app, we'd strict match address, but for demo flexibility:
    // If user is connected, filter by their role. If not, just show all to allow demo.
    if (address) {
      if (role === 'freelancer' && j.freelancer?.wallet !== address) return false;
      if (role === 'client' && j.client?.wallet !== address) return false;
    }
    return true;
  });

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12 text-white">
      {/* Header & Role Toggle */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Interactive Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 p-1">
          <button 
            onClick={() => setRole('freelancer')}
            className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
              role === 'freelancer' ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Freelancer View
          </button>
          <button 
            onClick={() => setRole('client')}
            className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
              role === 'client' ? 'bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Client View
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {processingAction && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500 mb-4"></div>
              <p className="text-lg font-medium text-white">{processingAction}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="grid gap-6">
        <h2 className="text-xl font-semibold text-slate-200">
          {role === 'freelancer' ? 'Your Active Jobs' : 'Active Escrow Contracts'}
        </h2>
        
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {displayedJobs.map((job) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={job.id} 
                className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-xl transition-colors hover:border-white/20"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">{job.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {role === 'freelancer' ? `Client: ${job.client?.wallet?.substring(0,6)}...` : `Freelancer: ${job.freelancer?.wallet?.substring(0,6) || 'Unknown'}...`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold text-cyan-300">{job.amount}</p>
                      {getStatusBadge(job.status)}
                    </div>
                  </div>

                  {/* Submitted Work Preview */}
                  {job.submittedWork && (
                    <div className="mt-6 rounded-xl border border-white/5 bg-slate-950/40 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Submitted Work</p>
                      <p className="text-sm leading-relaxed text-slate-300">{job.submittedWork}</p>
                    </div>
                  )}

                  {/* FREELANCER ACTIONS */}
                  {role === 'freelancer' && job.status === 'IN_PROGRESS' && (
                    <div className="mt-6 border-t border-white/5 pt-6">
                      {submittingJobId === job.id ? (
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            placeholder="Enter GitHub link, Figma link, or description..." 
                            value={workDescription}
                            onChange={(e) => setWorkDescription(e.target.value)}
                            className="flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm focus:border-cyan-400/40 focus:outline-none"
                          />
                          <button 
                            onClick={() => handleSubmitWork(job.id)}
                            className="rounded-xl bg-cyan-500 px-6 py-2 text-sm font-medium text-white hover:bg-cyan-600"
                          >
                            Submit
                          </button>
                          <button 
                            onClick={() => setSubmittingJobId(null)}
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setSubmittingJobId(job.id)}
                          className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-6 py-2.5 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                        >
                          Submit Work
                        </button>
                      )}
                    </div>
                  )}

                  {/* CLIENT ACTIONS */}
                  {role === 'client' && job.status === 'SUBMITTED' && (
                    <div className="mt-6 flex gap-3 border-t border-white/5 pt-6">
                      <button 
                        onClick={() => handleApproveWork(job.id)}
                        className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-600 transition-all"
                      >
                        Approve Work & Release Escrow
                      </button>
                      
                      {disputingJobId === job.id ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleRaiseDispute(job.id)}
                            className="rounded-xl border border-red-500 bg-red-500/20 px-6 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/30"
                          >
                            Confirm Dispute
                          </button>
                          <button 
                            onClick={() => setDisputingJobId(null)}
                            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setDisputingJobId(job.id)}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Raise Dispute
                        </button>
                      )}
                    </div>
                  )}

                  {/* CLIENT ACTIONS - OPEN JOBS */}
                  {role === 'client' && job.status === 'OPEN' && (
                    <div className="mt-6 border-t border-white/5 pt-6">
                      <button 
                        onClick={() => handleDeleteJob(job.id)}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Cancel Job & Delete
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {displayedJobs.length === 0 && (
             <div className="flex h-32 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-xl">
               <p className="text-slate-400">No active jobs found in this view.</p>
             </div>
          )}
        </div>
      </section>
    </main>
  );
}
