// Pure clock logic: no Cloudflare or network dependencies, so it can be unit-tested directly.

export const DEFAULT_SETTINGS = Object.freeze({ timezone: "UTC", format: "24h" });

export const FORMATS = Object.freeze(["12h", "24h"]);

export function isValidTimezone(name) {
  if (typeof name !== "string" || name.length === 0 || name.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: name });
    return true;
  } catch {
    return false;
  }
}

export function normalizeSettings(raw) {
  const timezone = isValidTimezone(raw?.timezone) ? raw.timezone : DEFAULT_SETTINGS.timezone;
  const format = FORMATS.includes(raw?.format) ? raw.format : DEFAULT_SETTINGS.format;
  return { timezone, format };
}

export function formatClock(date, settings) {
  const { timezone, format } = normalizeSettings(settings);
  const hour12 = format === "12h";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12,
  }).format(date);
  const dateText = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return { time: parts, date: dateText, timezone, format, iso: date.toISOString() };
}
