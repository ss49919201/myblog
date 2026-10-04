const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Tokyo",
});

export function formatDate(iso: string | null): string {
  return iso ? dateFormatter.format(new Date(iso)) : "";
}
