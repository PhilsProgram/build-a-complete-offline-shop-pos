export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table>
    </div>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">{children}</th>;
}

export function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-middle text-slate-700">{children}</td>;
}
