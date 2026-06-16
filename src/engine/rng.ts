// Seeded RNG — SPEC §7.4. Pure: no globals, no Date, no Math.random.

/** Deterministic 32-bit string hash (FNV-1a variant). Maps any seed string to a
 *  uint32 suitable for seeding mulberry32. */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // h *= 16777619, kept in uint32 via the shift-add decomposition
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: a tiny, fast, well-distributed PRNG. Returns a function yielding
 *  floats in [0, 1). Same seed → same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convenience: build an RNG directly from a seed string. */
export function rngFromString(seed: string): () => number {
  return mulberry32(hashString(seed));
}

/** Integer in [min, max] inclusive, drawn from rng. */
export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Uniform pick from a non-empty array. */
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  // Callers pass non-empty arrays; index is always in range.
  return arr[Math.floor(rng() * arr.length)] as T;
}

/** In-place-free Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(rng: () => number, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}
