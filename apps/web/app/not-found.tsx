import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 text-white">
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Route not found</h1>
        <p className="mt-3 text-sm text-slate-300">The page you requested does not exist in the TrustWork X control room.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2 text-sm font-medium text-white">
          Return home
        </Link>
      </div>
    </main>
  );
}
