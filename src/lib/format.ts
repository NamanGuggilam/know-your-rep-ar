export function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `tel:+${digits.length === 10 ? "1" + digits : digits}`;
}

export function formatUpdated(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  });
}

const NAME_SUFFIX = /^(jr\.?|sr\.?|ii|iii|iv)$/i;

export function lastName(full: string) {
  const parts = full.replace(/"[^"]*"/g, "").trim().split(/\s+/);
  const last = parts.at(-1) ?? full;
  if (NAME_SUFFIX.test(last) && parts.length > 1) return parts.at(-2)!.replace(/,$/, "");
  return last;
}
