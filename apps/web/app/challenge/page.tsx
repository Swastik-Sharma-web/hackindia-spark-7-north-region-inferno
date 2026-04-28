'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSkillChallenge, useSkillGrading } from '@/lib/api-hooks';
import { addStoredScoreEntry, getStoredUserScore, setStoredUserScore } from '@/lib/score-store';
import { useAccount } from 'wagmi';

const skills = ['React', 'Node.js', 'Solidity', 'Python'];

export default function ChallengePage() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
  const [submission, setSubmission] = useState('');
  const [gradeResult, setGradeResult] = useState<any>(null);
  const [userScore, setUserScore] = useState(84);
  const [testActive, setTestActive] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [testStartedAt, setTestStartedAt] = useState<string | null>(null);
  const [testCompletedAt, setTestCompletedAt] = useState<string | null>(null);
  const { challenge, loading, error, generateChallenge } = useSkillChallenge();
  const { loading: grading, error: gradeError, gradeSubmission } = useSkillGrading();
  const requestIdRef = useRef<string | null>(null);
  const { address } = useAccount();

  useEffect(() => {
    setUserScore(getStoredUserScore());
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setFullscreenActive(active);

      if (testActive && !active && !gradeResult) {
        setTabViolations((value) => value + 1);
        setLockReason('You left fullscreen. This test attempt is locked.');
        setTestActive(false);
      }
    };

    const handleVisibilityChange = () => {
      if (testActive && document.hidden && !gradeResult) {
        setTabViolations((value) => value + 1);
        setLockReason('You switched tabs or minimized the window. The test attempt is locked.');
        setTestActive(false);
      }
    };

    const handleBlur = () => {
      if (testActive && !gradeResult) {
        setTabViolations((value) => value + 1);
        setLockReason('Focus left the test window. The test attempt is locked.');
        setTestActive(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gradeResult, testActive]);

  const resetTest = async (keepFullscreen = false) => {
    if (!keepFullscreen && document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore fullscreen exit errors in browsers that block scripted exit.
      }
    }

    requestIdRef.current = null;
    setTestSessionId(null);
    setSubmission('');
    setGradeResult(null);
    setTabViolations(0);
    setLockReason(null);
    setTestStartedAt(null);
    setTestCompletedAt(null);
    setTestActive(false);
  };

  const handleSelectSkill = async (skill: string) => {
    setSelectedSkill(skill);
    setSubmission('');
    setGradeResult(null);
    setLockReason(null);
    setTabViolations(0);
    setTestStartedAt(null);
    setTestCompletedAt(null);
    setTestSessionId(null);
    setTestActive(false);
  };

  const startTest = async () => {
    if (!selectedSkill) {
      alert('Select a skill first');
      return;
    }

    await resetTest(true);

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    requestIdRef.current = sessionId;
    setTestSessionId(sessionId);
    setTestStartedAt(new Date().toISOString());
    setTestActive(true);
    setLockReason(null);

    if (document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => {
        setLockReason('Fullscreen was blocked by the browser, but the test can still continue.');
      });
    }

    void generateChallenge(selectedSkill, sessionId, apiKey);
    setSubmission('');
    setGradeResult(null);
  };

  const handleSubmitSolution = async () => {
    if (!submission.trim() || !challenge || !selectedSkill) {
      alert('Please write a solution and generate a challenge first');
      return;
    }

    if (lockReason) {
      alert('This test attempt is locked. Start a new test to continue.');
      return;
    }

    try {
      const response = await gradeSubmission(
        selectedSkill, 
        challenge, 
        submission, 
        address || '0x0000000000000000000000000000000000000000', // Fallback for demo
        apiKey
      );
      setGradeResult(response);
      setTestCompletedAt(new Date().toISOString());
      setTestActive(false);

      const updatedScore = Math.max(0, Math.min(100, Math.round(Number(response?.result?.score ?? 0))));
      setUserScore(updatedScore);
      setStoredUserScore(updatedScore);
      addStoredScoreEntry({ score: updatedScore, skill: selectedSkill });
    } catch (err) {
      console.error('Grading failed:', err);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12 text-white">
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Skill Verification</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">AI Skill Challenge</h1>
        </div>
        <Link href="/" className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300">
          Back Home
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-sm text-slate-400">Select a skill to generate a unique challenge.</p>
          <div className="mt-5 grid gap-3">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSelectSkill(skill)}
                disabled={loading}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  selectedSkill === skill
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                    : 'border-violet-500/20 bg-slate-950/60 text-slate-200 hover:border-cyan-400/40'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {skill}
              </button>
            ))}
          </div>
          
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-sm text-slate-400 mb-3">Optional: Provide your own Gemini API Key to bypass limits.</p>
            <input
              type="password"
              placeholder="Gemini API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/40 focus:outline-none"
            />
          </div>
        </aside>

        <article className="rounded-[24px] border border-cyan-400/15 bg-slate-950/70 p-6 shadow-2xl shadow-violet-950/40 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
              lockReason ? 'border-red-400/30 bg-red-400/10 text-red-300' : gradeResult ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : challenge && !gradeResult ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' : 'border-slate-400/30 bg-slate-400/10 text-slate-300'
            }`}>
              {lockReason ? 'Locked' : gradeResult ? 'Graded' : challenge && !gradeResult ? 'Challenge ready' : loading ? 'Generating...' : 'Ready'}
            </span>
            <span className="font-mono text-xs text-slate-400">Current score: {userScore}/100</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Test State</p>
              <p className="mt-2 text-sm font-medium text-slate-200">{testActive ? 'In progress' : gradeResult ? 'Completed' : 'Idle'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fullscreen</p>
              <p className="mt-2 text-sm font-medium text-slate-200">{fullscreenActive ? 'Enabled' : 'Off'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tab Violations</p>
              <p className="mt-2 text-sm font-medium text-slate-200">{tabViolations}</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {gradeError && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3">
              <p className="text-sm text-red-200">{gradeError}</p>
            </div>
          )}

          {lockReason && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3">
              <p className="text-sm text-red-200">{lockReason}</p>
            </div>
          )}

          {gradeResult ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Results</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-400">Overall Score</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-400">{gradeResult?.result?.score || '—'}/100</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    <p className={`mt-1 text-lg font-bold ${gradeResult?.result?.pass ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {gradeResult?.result?.pass ? '✓ PASSED' : '⊘ NEEDS WORK'}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  Recommendation: <span className="font-medium text-cyan-300">{gradeResult?.result?.recommendation || 'review'}</span>
                </p>
                {gradeResult?.mintTxHash && (
                  <div className="mt-3 border-t border-emerald-400/20 pt-3">
                    <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider">Soulbound Passport Minted!</p>
                    <a 
                      href={`https://mumbai.polygonscan.com/tx/${gradeResult.mintTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-xs text-cyan-400 underline hover:text-cyan-300 truncate"
                    >
                      View on Polygonscan: {gradeResult.mintTxHash}
                    </a>
                  </div>
                )}
              </div>

              {gradeResult?.result?.breakdown && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rubric Breakdown</p>
                  <div className="mt-3 space-y-2">
                    {gradeResult.result.breakdown.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{item.criterion}</span>
                        <span className={`font-mono text-sm font-bold ${item.score >= 70 ? 'text-emerald-400' : 'text-orange-400'}`}>
                          {item.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gradeResult?.result?.feedback && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Feedback</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{gradeResult.result.feedback}</p>
                </div>
              )}

              {testStartedAt && testCompletedAt && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Attempt</p>
                  <p className="mt-2 text-sm text-slate-300">Started: {new Date(testStartedAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-slate-300">Completed: {new Date(testCompletedAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-slate-300">Session ID: <span className="font-mono text-cyan-300">{testSessionId}</span></p>
                </div>
              )}

              <button
                onClick={resetTest}
                className="w-full rounded-full border border-slate-400/30 px-6 py-2 text-sm font-medium text-slate-300 hover:border-cyan-400/50 hover:text-cyan-300"
              >
                Go Back to Skills
              </button>
            </div>
          ) : challenge ? (
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Challenge</p>
                <h2 className="mt-2 text-xl font-semibold">{challenge.result?.title || `${selectedSkill} Challenge`}</h2>
              </div>
              <p className="text-sm leading-7 text-slate-300">{typeof challenge.result?.description === 'string' ? challenge.result.description : JSON.stringify(challenge.result?.description || 'Submit your implementation below.')}</p>
              {challenge.result?.expectedOutcome && (
                <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Expected Outcome</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{typeof challenge.result.expectedOutcome === 'string' ? challenge.result.expectedOutcome : JSON.stringify(challenge.result.expectedOutcome)}</p>
                </div>
              )}
              
              {challenge.result?.requirements && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Requirements:</p>
                  <ul className="mt-2 space-y-1">
                    {Array.isArray(challenge.result.requirements) && challenge.result.requirements.map((req: any, idx: number) => (
                      <li key={idx} className="text-sm text-slate-300">• {typeof req === 'string' ? req : req?.text || req?.description || JSON.stringify(req)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {challenge.result?.starterCode && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Starter Code</p>
                  <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-4 text-xs text-cyan-200">
                    {challenge.result.starterCode}
                  </pre>
                </div>
              )}

              <textarea
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                placeholder="Paste your solution here..."
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 font-mono text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/40 focus:outline-none"
                rows={6}
                disabled={Boolean(lockReason)}
              />
              <p className="text-xs text-slate-400">
                Fullscreen test is active. Switching tabs or leaving fullscreen locks this attempt.
              </p>
              <button
                onClick={handleSubmitSolution}
                disabled={grading || !submission.trim() || Boolean(lockReason)}
                className="w-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-medium text-white hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {grading ? 'Grading...' : 'Submit solution'}
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Rubric</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  <li>Functionality 40%</li>
                  <li>Code Quality 30%</li>
                  <li>Edge Cases 20%</li>
                  <li>Explanation 10%</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">API Routes</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  <li className="font-mono">POST /skills/challenge</li>
                  <li className="font-mono">POST /skills/grade</li>
                  <li>Powered by Google AI Studio</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">How This Test Works</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>1. Pick a skill.</li>
                  <li>2. Start a fresh test to get a new Gemini-generated question.</li>
                  <li>3. Stay in fullscreen for the attempt.</li>
                  <li>4. Leave the tab and the attempt locks.</li>
                  <li>5. Submit your solution to get a Gemini score and update your profile score.</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {!challenge && (
              <button
                onClick={startTest}
                disabled={!selectedSkill || loading}
                className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Generating Test...' : 'Start Test'}
              </button>
            )}
            {challenge && !gradeResult && (
              <button
                onClick={startTest}
                className="flex-1 rounded-full border border-white/15 px-6 py-3 font-medium text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
              >
                Reset Test
              </button>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
