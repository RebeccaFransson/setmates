export function formatKg(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} kg`;
}

export function formatDurationSeconds(
  totalSeconds: number | null | undefined,
): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return '—';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function formatDistanceMeters(
  distanceMeters: number | null | undefined,
): string {
  if (distanceMeters == null || Number.isNaN(distanceMeters)) return '—';
  if (distanceMeters >= 1000) return `${(distanceMeters / 1000).toFixed(1)} km`;
  return `${distanceMeters.toFixed(0)} m`;
}
