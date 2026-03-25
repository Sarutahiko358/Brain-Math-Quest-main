// Lightweight RNG abstraction
// - If no seed is set, falls back to Math.random (preserves existing behavior)
// - If seed provided via setSeed(), uses a simple xorshift32 PRNG for reproducibility

let useSeeded = false;
let state = 0;

/** Set a deterministic seed. Passing undefined/null disables deterministic mode. */
export function setSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    state = (seed >>> 0) || 1;
    if (state === 0) state = 1;
    useSeeded = true;
  } else {
    useSeeded = false;
  }
}

function nextFloat() {
  if (!useSeeded) return Math.random();
  // xorshift32
  let x = state;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state = x >>> 0;
  return (state >>> 0) / 0xFFFFFFFF;
}

/** Inclusive integer random between a and b. */
export function R(a, b) {
  return Math.floor(nextFloat() * (b - a + 1)) + a;
}

export function pick(arr) {
  return arr[Math.floor(nextFloat() * arr.length)];
}

export function shuffle(arr) {
  return arr.map(v => ({ v, r: nextFloat() })).sort((a, b) => a.r - b.r).map(o => o.v);
}

// Convenience for tests / debugging: read current internal state (optional usage)
export function __rngDebugState() {
  return { useSeeded, state };
}
