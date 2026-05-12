export function scoreFromSignal(signal: string, delta: number): number {
  const baseBySignal: Record<string, number> = {
    solid: 78,
    partial: 58,
    gap: 32,
    unknown: 50
  };

  return Math.max(0, Math.min(100, (baseBySignal[signal] ?? 50) + delta));
}

export function updateIntegrityScore(current: number | null | undefined, delta: number, pasteSuspected: boolean): number {
  const base = Number.isFinite(Number(current)) ? Number(current) : 50;
  const pastePenalty = pasteSuspected ? 8 : 0;
  return Math.max(0, Math.min(100, base + delta - pastePenalty));
}
