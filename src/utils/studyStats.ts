import type { StudyRecord } from "../types";
import { toDateKey } from "./date";

export type StudyStats = {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  totalMinutes: number;
};

const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

const calculateCurrentStreak = (studyDates: Set<string>) => {
  const today = new Date();
  const startDate = studyDates.has(toDateKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  let cursor = startDate;

  while (studyDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

const calculateLongestStreak = (studyDates: Set<string>) => {
  const sortedDates = [...studyDates].sort();
  let longest = 0;
  let current = 0;
  let previousTime = 0;

  sortedDates.forEach((dateKey) => {
    const currentTime = new Date(`${dateKey}T00:00:00`).getTime();
    const isNextDay = previousTime > 0 && currentTime - previousTime === 24 * 60 * 60 * 1000;
    current = isNextDay ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousTime = currentTime;
  });

  return longest;
};

export const calculateStudyStats = (records: StudyRecord[]): StudyStats => {
  const studyDates = new Set(records.filter((record) => record.durationMinutes > 0).map((record) => record.date));
  const totalMinutes = records.reduce((sum, record) => sum + record.durationMinutes, 0);

  return {
    currentStreak: calculateCurrentStreak(studyDates),
    longestStreak: calculateLongestStreak(studyDates),
    totalStudyDays: studyDates.size,
    totalMinutes,
  };
};
