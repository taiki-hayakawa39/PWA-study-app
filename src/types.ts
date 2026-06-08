export type Subject = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: string;
};

export type StudyEntry = {
  id: string;
  date: string;
  subjectId: string;
  durationMinutes: number;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type StudyRecord = StudyEntry;

export type StudyGoal = StudyEntry;

export type StudyData = {
  subjects: Subject[];
  studyRecords: StudyRecord[];
  studyGoals: StudyGoal[];
};
