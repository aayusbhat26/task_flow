export function trackedMinutes(start: Date | string, end: Date | string) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const elapsed = endMs - startMs;
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
  return Math.max(1, Math.ceil(elapsed / 60000));
}
