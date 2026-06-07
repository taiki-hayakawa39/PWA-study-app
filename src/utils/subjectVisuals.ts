import type { Subject } from "../types";

export const subjectIconOptions = ["🍀", "⭐", "🌸", "📘", "✏️", "🧠", "🎧", "📊", "🧪", "🏆"];

export const subjectColorOptions = ["#18c834", "#f39a12", "#2354b8", "#e64f92", "#62d7b8", "#a047b8", "#806a4d"];

export const getSubjectIcon = (subject?: Subject, index = 0) =>
  subject?.icon ?? subjectIconOptions[index % subjectIconOptions.length];

export const getSubjectColor = (subject?: Subject, index = 0) =>
  subject?.color ?? subjectColorOptions[index % subjectColorOptions.length];
