export interface Job {
  id: number;
  title: string;
  skill: string;
  budget: string;
  score: string;
  description: string;
  details: string[];
  timeline: string;
  isCustom?: boolean;
  escrowStatus?: 'locked' | 'released' | 'disputed';
  jobStatus?: 'open' | 'in_progress' | 'finished';
  postedBy?: string; // Google user email or wallet
  postedAt?: number; // timestamp
}

const STORAGE_KEY = 'trustwork_jobs';

export function getStoredJobs(): Job[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse jobs from localStorage', err);
    return [];
  }
}

export function addStoredJob(jobData: Omit<Job, 'id' | 'isCustom'>): Job {
  const jobs = getStoredJobs();
  const newJob: Job = {
    ...jobData,
    id: Date.now(),
    isCustom: true,
    escrowStatus: 'locked',
    jobStatus: 'open',
    postedAt: Date.now()
  };
  
  const updatedJobs = [newJob, ...jobs];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
  }
  
  return newJob;
}

export function updateJobStatus(jobId: number, updates: Partial<Pick<Job, 'escrowStatus' | 'jobStatus'>>) {
  const jobs = getStoredJobs();
  const updated = jobs.map(j => j.id === jobId ? { ...j, ...updates } : j);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}
