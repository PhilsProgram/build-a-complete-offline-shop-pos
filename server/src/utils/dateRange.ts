export function resolveDateRange(query: Record<string, unknown>) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = typeof query.from === 'string' ? query.from : todayStart.toISOString();
  const to = typeof query.to === 'string' ? query.to : now.toISOString();

  return { from, to };
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
