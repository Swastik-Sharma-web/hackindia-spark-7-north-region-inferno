import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useSkillChallenge() {
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateChallenge = async (skill: string, sessionId: string, apiKey?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/skills/challenge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ skill, sessionId, apiKey })
      });
      if (!response.ok) throw new Error('Failed to generate challenge');
      const data = await response.json();
      setChallenge(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { challenge, loading, error, generateChallenge };
}

export function useSkillGrading() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const gradeSubmission = async (skill: string, challenge: any, submission: string, address: string, apiKey?: string) => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds
      
      const response = await fetch(`${API_BASE}/skills/grade`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ skill, challenge, submission, address, apiKey }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || 'Failed to grade submission');
      }
      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Unknown error';
      if (err instanceof Error && err.name === 'AbortError') {
        message = 'Request timed out. The AI service is currently experiencing high load. Please try again.';
      }
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, gradeSubmission };
}

export function useStorageUpload() {
  const [loading, setLoading] = useState(false);
  const [cid, setCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMetadata = async (metadata: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/storage/pinata`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(metadata)
      });
      if (!response.ok) throw new Error('Failed to upload to IPFS');
      const data = await response.json();
      setCid(data.cid);
      return data.cid;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { cid, loading, error, uploadMetadata };
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getNonce = async (address: string) => {
    const response = await fetch(`${API_BASE}/auth/nonce`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address })
    });
    const data = await response.json();
    return data.nonce;
  };

  const verify = async (message: string, signature: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, signature })
      });
      if (!response.ok) throw new Error('Verification failed');
      const data = await response.json();
      setToken(data.token);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { token, loading, error, getNonce, verify };
}

export function useEscrowDispute() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ clientReasonValid: boolean; explanation: string; resolveTxHash?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const raiseDispute = async (reason: string, jobId?: number, apiKey?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(`${API_BASE}/escrow/dispute`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason, jobId, apiKey }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || 'Failed to process dispute');
      }
      const data = await response.json();
      setResult(data.result);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, raiseDispute };
}

export function useJobs() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/jobs`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
      return data.jobs || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return { jobs, loading, error, fetchJobs };
}

export function useJobGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateJob = async (prompt: string, wallet?: string, apiKey?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/jobs/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, wallet, apiKey })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || 'Failed to generate job');
      }
      const data = await response.json();
      return { ...data.result, id: data.dbId || Date.now() };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateJob, loading, error };
}
