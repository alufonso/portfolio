const KEY = 'lofi-volume';
const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function readVolume(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? clamp(n) : 0.5;
  } catch {
    return 0.5;
  }
}

export function writeVolume(v: number): void {
  try {
    localStorage.setItem(KEY, String(clamp(v)));
  } catch {
    // storage unavailable: the volume just is not remembered
  }
}
