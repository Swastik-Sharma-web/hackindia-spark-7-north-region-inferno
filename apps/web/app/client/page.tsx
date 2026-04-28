'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJobGenerator } from '@/lib/api-hooks';
import { useAccount } from 'wagmi';

const techOptions = [
  'React', 'Next.js', 'Solidity', 'Rust', 'TypeScript', 'Node.js',
  'Python', 'UI/UX', 'Go', 'Move', 'Flutter'
];

const timelineOptions = [
  '1 week', '2 weeks', '3 weeks', '1 month', '2 months', '3+ months'
];

export default function PostJobPage() {
  const [description, setDescription] = useState('');
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [customTech, setCustomTech] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [postedJob, setPostedJob] = useState<Job | null>(null);
  const { generateJob, loading, error } = useJobGenerator();
  const { address } = useAccount();
  const router = useRouter();

  const toggleTech = (t: string) => {
    setSelectedTechs(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const addCustomTech = () => {
    const trimmed = customTech.trim();
    if (trimmed && !selectedTechs.includes(trimmed)) {
      setSelectedTechs(prev => [...prev, trimmed]);
      setCustomTech('');
    }
  };

  const allTechs = selectedTechs.join(', ');
  const isFormValid = description.trim() && selectedTechs.length > 0 && budget.trim() && timeline;

  const handleGenerate = async () => {
    if (!isFormValid) return;

    const combinedPrompt = `I need a developer skilled in ${allTechs}. Here is the job: ${description}. My budget is ${budget} MATIC and I need it done in ${timeline}.`;
    
    try {
      const generatedJob = await generateJob(combinedPrompt, address, apiKey);
      if (generatedJob) {
        setPostedJob(generatedJob);
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  // Escrow lock confirmation screen
  if (postedJob) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-6 py-12 text-white">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Escrow Locked</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Job Posted Successfully</h1>
          </div>
        </div>

        <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/5 p-8 backdrop-blur-xl">
          {/* Lock animation */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-emerald-400/40 bg-emerald-400/10 text-5xl animate-pulse">
              🔒
            </div>
          </div>

          <h2 className="text-center text-2xl font-bold text-emerald-400">Funds Locked in Escrow</h2>
          <p className="mt-3 text-center text-sm text-slate-300">
            Your budget of <span className="font-bold text-cyan-300">{postedJob.budget}</span> has been locked in a smart contract escrow.
            The freelancer will only receive payment after you approve the work, or if an AI arbiter rules in their favor during a dispute.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Job Title</p>
                  <p className="mt-1 text-lg font-semibold text-slate-200">{postedJob.title}</p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                  Escrow Locked
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Budget Locked</p>
                <p className="mt-1 text-xl font-bold text-cyan-300">{postedJob.budget}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Min. Score</p>
                <p className="mt-1 text-xl font-bold text-violet-300">{postedJob.score}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Timeline</p>
                <p className="mt-1 text-xl font-bold text-slate-200">{postedJob.timeline}</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300 mb-2">How Escrow Works</p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex gap-2"><span className="text-emerald-400">1.</span> Funds are locked when you post the job — you can&apos;t withdraw them.</li>
                <li className="flex gap-2"><span className="text-emerald-400">2.</span> A freelancer accepts and delivers the work.</li>
                <li className="flex gap-2"><span className="text-emerald-400">3.</span> You approve the work → funds are released to the freelancer.</li>
                <li className="flex gap-2"><span className="text-amber-400">⚠</span> If you refuse to pay, the freelancer can raise a dispute. An AI Arbiter will evaluate your reason and may force-release the funds.</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => router.push('/jobs')}
              className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-4 font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
            >
              View Job Board
            </button>
            <button
              onClick={() => router.push('/escrow')}
              className="rounded-full border border-white/15 px-6 py-4 text-sm font-medium text-slate-300 hover:border-white/30"
            >
              Manage Escrow
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12 text-white">
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Client Mode</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Post a New Job</h1>
        </div>
        <Link href="/jobs" className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:border-white/30">
          Back to Jobs
        </Link>
      </div>

      <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-400/5 p-8 backdrop-blur-xl">
        <h2 className="text-2xl font-semibold">AI Job Generator</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Fill in the details below and our AI will generate a professional, structured job listing for your project.
        </p>

        <div className="mt-8 grid gap-6">
          {/* Row 1: Tech + Budget */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Technology / Skills Required <span className="text-cyan-400">(multi-select)</span></label>
              <div className="grid grid-cols-3 gap-2">
                {techOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTech(t)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                      selectedTechs.includes(t)
                        ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300 shadow-sm shadow-cyan-400/10'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-cyan-400/30 hover:text-slate-200'
                    }`}
                  >
                    {selectedTechs.includes(t) ? `✓ ${t}` : t}
                  </button>
                ))}
              </div>
              {/* Custom tech input */}
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={customTech}
                  onChange={(e) => setCustomTech(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTech(); } }}
                  placeholder="Add a custom technology..."
                  className="flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/40 focus:outline-none"
                />
                <button
                  onClick={addCustomTech}
                  disabled={!customTech.trim()}
                  className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-400/20 disabled:opacity-40"
                >
                  + Add
                </button>
              </div>
              {/* Show custom techs as removable chips */}
              {selectedTechs.filter(t => !techOptions.includes(t)).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTechs.filter(t => !techOptions.includes(t)).map((t) => (
                    <span
                      key={t}
                      onClick={() => toggleTech(t)}
                      className="cursor-pointer rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-red-400/10 hover:border-red-400/40 hover:text-red-300"
                    >
                      {t} ✕
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Budget (MATIC)</label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 5.0"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/40 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Timeline</label>
                <div className="grid grid-cols-3 gap-2">
                  {timelineOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeline(t)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        timeline === t
                          ? 'border-violet-400/50 bg-violet-400/15 text-violet-300 shadow-sm shadow-violet-400/10'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-violet-400/30 hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">What do you need built?</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project in detail. E.g. Build a responsive NFT marketplace dashboard with wallet connection, listing/buying functionality, and real-time price updates."
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm leading-6 text-slate-200 placeholder-slate-500 focus:border-cyan-400/40 focus:outline-none"
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Optional API Key */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Optional: Gemini API Key</label>
            <input
              type="password"
              placeholder="Provide your own key if you face rate limits"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/40 focus:outline-none"
            />
          </div>
          
          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Summary Preview */}
          {isFormValid && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Preview Summary</p>
              <p className="text-sm text-slate-300">
                Looking for a <span className="text-cyan-300 font-medium">{allTechs}</span> developer to work on: <span className="text-slate-200">{description.substring(0, 100)}{description.length > 100 ? '...' : ''}</span>
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Budget: <span className="text-cyan-300 font-medium">{budget} MATIC</span> · Timeline: <span className="text-violet-300 font-medium">{timeline}</span>
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleGenerate}
              disabled={loading || !isFormValid}
              className="w-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-4 font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50"
            >
              {loading ? 'AI is formatting your job post...' : 'Generate & Post Job'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
