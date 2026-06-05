const UNITS: Array<{ limit: number; div: number; label: string }> = [
  { limit: 60, div: 1, label: "second" },
  { limit: 3600, div: 60, label: "minute" },
  { limit: 86400, div: 3600, label: "hour" },
  { limit: 604800, div: 86400, label: "day" },
  { limit: 2629800, div: 604800, label: "week" },
  { limit: 31557600, div: 2629800, label: "month" },
  { limit: Infinity, div: 31557600, label: "year" },
];

export function formatRelativeTime(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) {
    return "";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 30) {
    return "just now";
  }

  for (const unit of UNITS) {
    if (seconds < unit.limit) {
      const value = Math.floor(seconds / unit.div);
      return `${value} ${unit.label}${value === 1 ? "" : "s"} ago`;
    }
  }

  return "";
}
