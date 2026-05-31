export function money(value: number | string | null | undefined, currency = 'GHS') {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amount);
}

export function numberInput(value: FormDataEntryValue | null) {
  return Number(value ?? 0);
}
