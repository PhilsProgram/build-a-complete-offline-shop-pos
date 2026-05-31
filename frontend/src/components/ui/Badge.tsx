export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    good: 'bg-emerald-100 text-emerald-800',
    warn: 'bg-amber-100 text-amber-800',
    bad: 'bg-rose-100 text-rose-800',
    info: 'bg-indigo-100 text-indigo-800'
  };

  return <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
