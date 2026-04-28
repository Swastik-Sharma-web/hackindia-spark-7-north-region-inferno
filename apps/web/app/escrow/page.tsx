'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useEscrowDispute } from '@/lib/api-hooks';

const activeJobs = [
  { id: 101, title: 'Build onboarding dashboard', status: 'Finished', paymentStatus: 'Due', amount: '2.5 MATIC', description: 'Dashboard is completed but client has not released the final payment milestone.' },
  { id: 102, title: 'Design reputation passport UI', status: 'In Progress', paymentStatus: 'Locked', amount: '1.8 MATIC', description: 'Currently working on the dark mode designs.' },
  { id: 103, title: 'Smart Contract Audit', status: 'Finished', paymentStatus: 'Paid', amount: '4.0 MATIC', description: 'Audit completed and funds successfully released.' }
];

export default function EscrowPage() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [apiKey, setApiKey] = useState('');
  const { result, loading, error, raiseDispute } = useEscrowDispute();

  const handleDisputeSubmit = async () => {
    if (!disputeReason.trim() || !selectedJobId) return;
    await raiseDispute(`Job ID: ${selectedJobId} - ${disputeReason}`, selectedJobId, apiKey);
  };

  const selectedJob = activeJobs.find(j => j.id === selectedJobId);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12 text-white">
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Escrow Flow</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Funds Locked in Code</h1>
        </div>
        <Link href="/" className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300">
          Back Home
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">Your Active Contracts</h2>
          <p className="mt-2 text-sm text-slate-400">Manage your ongoing and completed freelance jobs.</p>
          <div className="mt-5 space-y-3">
            {activeJobs.map((job) => (
              <div 
                key={job.id} 
                onClick={() => {
                  setSelectedJobId(job.id);
                  setIsDisputing(false);
                }}
                className={`cursor-pointer flex items-center justify-between rounded-2xl border px-4 py-4 transition-colors ${
                  selectedJobId === job.id 
                    ? 'border-cyan-400/50 bg-cyan-400/10' 
                    : 'border-white/10 bg-slate-950/60 hover:border-cyan-400/30 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <p className="font-medium text-slate-200">{job.title}</p>
                  <p className="text-sm text-slate-400">{job.amount}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                    job.status === 'Finished' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300'
                  }`}>
                    {job.status}
                  </span>
                  <span className={`text-xs uppercase tracking-[0.1em] ${job.paymentStatus === 'Due' ? 'text-red-400' : job.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    Payment: {job.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="grid gap-4">
          {selectedJob ? (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-xl font-bold text-slate-200">{selectedJob.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{selectedJob.description}</p>
              
              <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Escrow</p>
                  <p className="mt-1 text-lg font-bold text-cyan-300">{selectedJob.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                  <p className={`mt-1 font-medium ${selectedJob.paymentStatus === 'Due' ? 'text-red-400' : selectedJob.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedJob.paymentStatus}
                  </p>
                </div>
              </div>

              {selectedJob.status === 'Finished' && selectedJob.paymentStatus === 'Due' && (
                <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-red-300">Payment Overdue</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    You have marked this job as finished, but the client has not released the funds. You can raise a dispute to have an AI Arbiter evaluate the work and force-release the payment.
                  </p>
                  
                  {!isDisputing && !result && (
                    <button
                      onClick={() => setIsDisputing(true)}
                      className="mt-4 w-full rounded-full border border-red-400/30 bg-red-400/10 px-6 py-3 font-medium text-red-300 transition-colors hover:bg-red-400/20"
                    >
                      Raise a Dispute
                    </button>
                  )}

                  {isDisputing && !result && (
                    <div className="mt-5 space-y-4 border-t border-red-400/20 pt-5">
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Optional: Gemini API Key</label>
                        <input
                          type="password"
                          placeholder="Provide your own key to bypass limits"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 font-mono text-sm text-slate-200 placeholder-slate-500 focus:border-red-400/40 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">Client's Stated Reason for Non-Payment</label>
                        <textarea
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          placeholder="Paste the exact reason the client gave for withholding payment..."
                          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-red-400/40 focus:outline-none"
                          rows={4}
                          disabled={loading}
                        />
                      </div>
                      
                      {error && (
                        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3">
                          <p className="text-sm text-red-200">{error}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={handleDisputeSubmit}
                          disabled={loading || !disputeReason.trim()}
                          className="flex-1 rounded-full bg-red-500 px-6 py-3 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                        >
                          {loading ? 'Evaluating...' : 'Submit Dispute'}
                        </button>
                        <button
                          onClick={() => setIsDisputing(false)}
                          disabled={loading}
                          className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-slate-300 hover:border-white/30"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {result && (
                    <div className={`mt-5 space-y-4 border-t ${!result.clientReasonValid ? 'border-emerald-400/20' : 'border-amber-400/20'} pt-5`}>
                      <div className={`rounded-xl border p-4 ${!result.clientReasonValid ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-amber-400/30 bg-amber-400/10'}`}>
                        <p className={`text-xs uppercase tracking-[0.2em] ${!result.clientReasonValid ? 'text-emerald-300' : 'text-amber-300'}`}>AI Verdict</p>
                        <p className={`mt-2 text-xl font-bold ${!result.clientReasonValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {!result.clientReasonValid ? 'Client Reason Invalid: Force-Releasing Funds' : 'Client Reason Valid: Claim Rejected'}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{(result as any).explanation}</p>
                        
                        {(result as any).resolveTxHash && (
                          <div className={`mt-3 border-t pt-3 ${!(result as any).clientReasonValid ? 'border-emerald-400/20' : 'border-amber-400/20'}`}>
                            <p className={`text-xs font-medium uppercase tracking-wider ${!(result as any).clientReasonValid ? 'text-emerald-300' : 'text-amber-300'}`}>On-Chain Transaction Executed</p>
                            <a 
                              href={`https://mumbai.polygonscan.com/tx/${(result as any).resolveTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 block text-xs text-cyan-400 underline hover:text-cyan-300 truncate"
                            >
                              View on Polygonscan: {(result as any).resolveTxHash}
                            </a>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setIsDisputing(false);
                          setDisputeReason('');
                        }}
                        className="w-full rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-slate-300 hover:border-white/30"
                      >
                        Close Case
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-center text-sm text-slate-400">Select a contract from the list to view details or raise a dispute.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
