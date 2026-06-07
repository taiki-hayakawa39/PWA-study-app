export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const getMonthLabel = (date: Date): string =>
  `${date.getFullYear()}年${date.getMonth() + 1}月`;

export const getDateLabel = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
};

export const createCalendarDays = (monthDate: Date): Array<Date | null> => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);
  const blanks = Array.from({ length: firstDate.getDay() }, () => null);
  const days = Array.from(
    { length: lastDate.getDate() },
    (_, index) => new Date(year, month, index + 1),
  );

  return [...blanks, ...days];
};

export const moveMonth = (date: Date, amount: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);
