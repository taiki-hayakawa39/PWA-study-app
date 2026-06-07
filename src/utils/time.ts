export const formatMinutes = (minutes: number): string => {
  if (minutes <= 0) return "0分";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest}分`;
  if (rest === 0) return `${hours}時間`;
  return `${hours}時間${rest}分`;
};

export const formatCompactHours = (minutes: number): string => {
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)}h`;
};

export const parseDurationToMinutes = (value: string): number => {
  const normalized = value.trim().replace(/[０-９．]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  );
  if (!normalized) return 0;

  // "1.5", "1.5h", "1時間30分", "90分" のような入力を分に寄せる。
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(時間|h|hour|hours)/i);
  const minuteMatch = normalized.match(/(\d+)\s*(分|m|min|mins|minute|minutes)/i);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    return Math.round(hours * 60 + minutes);
  }

  const plainNumber = Number(normalized);
  if (Number.isNaN(plainNumber)) return 0;
  return Math.round(plainNumber * 60);
};
