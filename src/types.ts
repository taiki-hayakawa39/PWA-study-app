export type Subject = {
  id: string;
  name: string;
  createdAt: string;
};

export type StudyRecord = {
  id: string;
  date: string;
  subjectId: string;
  durationMinutes: number;
  memo: string;
  createdAt: string;
  updatedAt: string;
};

export type StudyData = {
  subjects: Subject[];
  studyRecords: StudyRecord[];
};
