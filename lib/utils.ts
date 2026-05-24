import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime12h(timeStr: string | null | undefined): string {
  if (!timeStr) return "09:00 AM";
  const str = String(timeStr).trim();
  
  // If it already contains AM or PM (case-insensitive)
  if (/am|pm/i.test(str)) {
    const match = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (match) {
      const hh = parseInt(match[1], 10);
      const mm = match[2];
      const ampm = match[3].toUpperCase();
      const hhStr = String(hh).padStart(2, "0");
      return `${hhStr}:${mm} ${ampm}`;
    }
    return str.toUpperCase();
  }
  
  // Handle HH:MM:SS or HH:MM
  const parts = str.split(':');
  if (parts.length >= 2) {
    let hh = parseInt(parts[0], 10);
    const mm = parts[1].slice(0, 2);
    if (!isNaN(hh)) {
      const ampm = hh >= 12 ? 'PM' : 'AM';
      hh = hh % 12;
      if (hh === 0) hh = 12;
      const hhStr = String(hh).padStart(2, '0');
      return `${hhStr}:${mm} ${ampm}`;
    }
  }
  return str;
}
