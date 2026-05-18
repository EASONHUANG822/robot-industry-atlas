export const DETAIL_SCROLL_STEP_THRESHOLDS = [0.18, 0.48, 0.72] as const;

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function getActiveDetailStepIndex(
  progress: number,
  thresholds: readonly number[] = DETAIL_SCROLL_STEP_THRESHOLDS,
) {
  const clampedProgress = clampProgress(progress);
  const nextStepIndex = thresholds.findIndex((threshold) => clampedProgress < threshold);

  return nextStepIndex === -1 ? thresholds.length : nextStepIndex;
}
