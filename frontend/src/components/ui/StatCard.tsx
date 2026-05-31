export function StatCard({ label, value, accent = 'bg-till' }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 h-1 w-12 rounded ${accent}`} />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <strong className="mt-1 block text-2xl font-bold text-ink">{value}</strong>
    </section>
  );
}
