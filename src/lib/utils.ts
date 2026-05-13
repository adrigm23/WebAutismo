import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(valueInCents: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valueInCents / 100);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid"
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid"
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string) {
  const target = new Date(date).getTime();
  const now = Date.now();
  const diffInSeconds = Math.round((target - now) / 1000);
  const absSeconds = Math.abs(diffInSeconds);
  const formatter = new Intl.RelativeTimeFormat("es-ES", {
    numeric: "auto"
  });

  if (absSeconds < 60) {
    return formatter.format(diffInSeconds, "second");
  }

  const diffInMinutes = Math.round(diffInSeconds / 60);

  if (Math.abs(diffInMinutes) < 60) {
    return formatter.format(diffInMinutes, "minute");
  }

  const diffInHours = Math.round(diffInMinutes / 60);

  if (Math.abs(diffInHours) < 24) {
    return formatter.format(diffInHours, "hour");
  }

  const diffInDays = Math.round(diffInHours / 24);

  if (Math.abs(diffInDays) < 30) {
    return formatter.format(diffInDays, "day");
  }

  const diffInMonths = Math.round(diffInDays / 30);

  if (Math.abs(diffInMonths) < 12) {
    return formatter.format(diffInMonths, "month");
  }

  const diffInYears = Math.round(diffInMonths / 12);
  return formatter.format(diffInYears, "year");
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("es-ES", {
    notation: "compact",
    maximumFractionDigits: value < 1000 ? 0 : 1
  }).format(value);
}

export function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
