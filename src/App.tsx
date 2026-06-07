import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { Calendar } from "./components/Calendar";
import { RecordPanel } from "./components/RecordPanel";
import { SubjectManager } from "./components/SubjectManager";
import { Summary } from "./components/Summary";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { StudyData, StudyRecord, Subject } from "./types";
import { getMonthKey, moveMonth, toDateKey } from "./utils/date";

const nowIso = () => new Date().toISOString();
const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialData: StudyData = {
  subjects: [
    { id: "subject-english", name: "英単語帳", createdAt: nowIso() },
    { id: "subject-math", name: "数学IA", createdAt: nowIso() },
    { id: "subject-bookkeeping", name: "簿記", createdAt: nowIso() },
    { id: "subject-toeic", name: "TOEIC", createdAt: nowIso() },
  ],
  studyRecords: [],
};

function App() {
  const todayKey = toDateKey(new Date());
  const [data, setData] = useLocalStorage<StudyData>("study-ledger-data-v1", initialData);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const monthKey = getMonthKey(currentMonth);

  const monthlyRecords = useMemo(
    () => data.studyRecords.filter((record) => record.date.startsWith(monthKey)),
    [data.studyRecords, monthKey],
  );

  const dailyTotals = useMemo(() => {
    const totals = new Map<string, number>();
    data.studyRecords.forEach((record) => {
      totals.set(record.date, (totals.get(record.date) ?? 0) + record.durationMinutes);
    });
    return totals;
  }, [data.studyRecords]);

  const subjectTotals = useMemo(() => {
    const totals = new Map<string, number>();
    monthlyRecords.forEach((record) => {
      totals.set(record.subjectId, (totals.get(record.subjectId) ?? 0) + record.durationMinutes);
    });

    // 集計結果はサマリーで読みやすいよう、勉強時間の多い順に並べます。
    return [...totals.entries()]
      .map(([subjectId, minutes]) => ({ subjectId, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [monthlyRecords]);

  const recordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    data.studyRecords.forEach((record) => {
      counts.set(record.subjectId, (counts.get(record.subjectId) ?? 0) + 1);
    });
    return counts;
  }, [data.studyRecords]);

  const monthlyTotal = monthlyRecords.reduce((sum, record) => sum + record.durationMinutes, 0);
  const todayTotal = dailyTotals.get(todayKey) ?? 0;

  const updateData = (recipe: (current: StudyData) => StudyData) => {
    setData((current) => recipe(current));
  };

  const addSubject = (name: string) => {
    const subject: Subject = { id: createId(), name, createdAt: nowIso() };
    updateData((current) => ({ ...current, subjects: [...current.subjects, subject] }));
  };

  const updateSubject = (id: string, name: string) => {
    updateData((current) => ({
      ...current,
      subjects: current.subjects.map((subject) => (subject.id === id ? { ...subject, name } : subject)),
    }));
  };

  const deleteSubject = (id: string) => {
    updateData((current) => {
      const remainingSubjects = current.subjects.filter((subject) => subject.id !== id);
      const fallbackSubjectId = remainingSubjects[0]?.id;

      return {
        subjects: remainingSubjects,
        // 教材削除時も過去の記録は残し、選択肢があれば先頭の教材へ付け替えます。
        studyRecords: fallbackSubjectId
          ? current.studyRecords.map((record) =>
              record.subjectId === id ? { ...record, subjectId: fallbackSubjectId, updatedAt: nowIso() } : record,
            )
          : current.studyRecords.filter((record) => record.subjectId !== id),
      };
    });
  };

  const addRecord = (record: Omit<StudyRecord, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = nowIso();
    updateData((current) => ({
      ...current,
      studyRecords: [...current.studyRecords, { ...record, id: createId(), createdAt: timestamp, updatedAt: timestamp }],
    }));
  };

  const updateRecord = (id: string, record: Pick<StudyRecord, "subjectId" | "durationMinutes" | "memo">) => {
    updateData((current) => ({
      ...current,
      studyRecords: current.studyRecords.map((item) =>
        item.id === id ? { ...item, ...record, updatedAt: nowIso() } : item,
      ),
    }));
  };

  const deleteRecord = (id: string) => {
    updateData((current) => ({
      ...current,
      studyRecords: current.studyRecords.filter((record) => record.id !== id),
    }));
  };

  const changeMonth = (amount: number) => {
    const nextMonth = moveMonth(currentMonth, amount);
    setCurrentMonth(nextMonth);
    setSelectedDate(toDateKey(nextMonth));
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark">
          <BookOpen size={24} />
        </div>
        <div>
          <p className="eyebrow">Study Ledger</p>
          <h1>勉強時間管理</h1>
        </div>
      </header>

      <main className="dashboard-layout">
        <div className="main-column">
          <Summary
            monthlyTotal={monthlyTotal}
            todayTotal={todayTotal}
            subjectTotals={subjectTotals}
            subjects={data.subjects}
          />
          <Calendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            todayKey={todayKey}
            dailyTotals={dailyTotals}
            onChangeMonth={changeMonth}
            onSelectDate={setSelectedDate}
          />
        </div>

        <div className="side-column">
          <RecordPanel
            selectedDate={selectedDate}
            subjects={data.subjects}
            records={data.studyRecords}
            onSelectDate={setSelectedDate}
            onAddRecord={addRecord}
            onUpdateRecord={updateRecord}
            onDeleteRecord={deleteRecord}
          />
          <div id="subject-manager">
            <SubjectManager
              subjects={data.subjects}
              recordCounts={recordCounts}
              onAddSubject={addSubject}
              onUpdateSubject={updateSubject}
              onDeleteSubject={deleteSubject}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
