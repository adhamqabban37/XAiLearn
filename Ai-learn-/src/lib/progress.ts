/**
 * Progress calculation utilities
 * Ensures no negative values, no overflow, and correct display strings
 */

export interface ProgressState {
  completed: number;
  total: number;
  remaining: number;
  pct: number;
  isComplete: boolean;
}

/**
 * Clamp progress values to valid ranges
 * - total >= 0
 * - completed in [0, total]
 * - remaining = max(total - completed, 0)
 * - pct = 0 if total=0, else round((completed/total)*100)
 */
export function clampProgress(completed: number, total: number): ProgressState {
  const t = Math.max(total, 0);
  const c = Math.min(Math.max(completed, 0), t);
  const remaining = Math.max(t - c, 0);
  const pct = t === 0 ? 0 : Math.round((c / t) * 100);
  const isComplete = t > 0 && c >= t;

  return { completed: c, total: t, remaining, pct, isComplete };
}

/**
 * Format header progress string
 * e.g., "Session Progress: 2 of 5 steps completed"
 */
export function formatProgressHeader(state: ProgressState): string {
  return `Session Progress: ${state.completed} of ${state.total} steps completed`;
}

/**
 * Format footer progress string
 * e.g., "2/5 — 3 lessons remaining"
 * When complete: "5/5 — Session complete"
 */
export function formatProgressFooter(state: ProgressState): string {
  if (state.isComplete) {
    return `${state.completed}/${state.total} — Session complete`;
  }
  const plural = state.remaining === 1 ? 'lesson' : 'lessons';
  return `${state.completed}/${state.total} — ${state.remaining} ${plural} remaining`;
}

/**
 * Format simple progress fraction
 * e.g., "2/5"
 */
export function formatProgressFraction(state: ProgressState): string {
  return `${state.completed}/${state.total}`;
}

/**
 * Format percentage string
 * e.g., "40%"
 */
export function formatProgressPercentage(state: ProgressState): string {
  return `${state.pct}%`;
}
