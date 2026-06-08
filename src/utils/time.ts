export const formatMinutes = (minutes: number): string => {
  if (minutes <= 0) return "0分";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest}分`;
  if (rest === 0) return `${hours}時間`;
  return `${hours}時間${rest}分`;
};

export const formatCompactMinutes = (minutes: number): string => {
  if (minutes <= 0) return "";
  return `${minutes}分`;
};

export const formatCompactHours = formatCompactMinutes;

export const parseDurationToMinutes = (value: string): number => {
  const normalized = value.trim().replace(/[０-９．]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  );
  if (!normalized) return 0;

  // Explicit hour/minute text is still accepted, but plain numbers are stored as minutes.
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(時間|h|hour|hours)/i);
  const minuteMatch = normalized.match(/(\d+)\s*(分|m|min|mins|minute|minutes)/i);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    return Math.round(hours * 60 + minutes);
  }

  const plainNumber = Number(normalized);
  if (Number.isNaN(plainNumber)) return 0;
  return Math.round(plainNumber);
};
