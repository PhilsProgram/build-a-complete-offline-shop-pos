export function shortDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}
