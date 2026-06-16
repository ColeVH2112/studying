// Pure date helpers operating on ISO `yyyy-mm-dd` strings. No clock access here
// (engines stay pure); the app supplies "today" from the system clock.

const DAY_MS = 86_400_000;

/** Parse `yyyy-mm-dd` to a UTC-midnight epoch ms. */
export function parseISODate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y as number, (m as number) - 1, d as number);
}

/** Format a UTC-midnight epoch ms back to `yyyy-mm-dd`. */
export function toISODate(ms: number): string {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add (possibly negative) whole days to an ISO date. */
export function addDays(iso: string, n: number): string {
  return toISODate(parseISODate(iso) + n * DAY_MS);
}

/** Whole days from `a` to `b` (b − a). Positive when b is later. */
export function diffDays(a: string, b: string): number {
  return Math.round((parseISODate(b) - parseISODate(a)) / DAY_MS);
}
