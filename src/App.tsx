import { useMemo, useState } from "react";
import { BookOpen, CalendarDays, LogOut, Pencil, PieChart, Timer } from "lucide-react";
import { AuthPanel } from "./components/AuthPanel";
import type { AuthUser } from "./components/AuthPanel";
import { Calendar } from "./components/Calendar";
import { CalendarRecordList } from "./components/CalendarRecordList";
import { ReportPanel } from "./components/ReportPanel";
import { RecordPanel } from "./components/RecordPanel";
import { SubjectManager } from "./components/SubjectManager";
import { Summary } from "./components/Summary";
import { TimerPanel } from "./components/TimerPanel";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { StudyData, StudyGoal, StudyRecord, Subject } from "./types";
import { getMonthKey, moveMonth, toDateKey } from "./utils/date";
import { subjectColorOptions, subjectIconOptions } from "./utils/subjectVisuals";

const sessionKey = "study-ledger-current-user-v1";

const nowIso = () => new Date().toISOString();
const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialData: StudyData = {
  subjects: [
    { id: "subject-english", name: "英単語帳", icon: "📘", color: "#2354b8", createdAt: nowIso() },
    { id: "subject-math", name: "数学IA", icon: "⭐", color: "#f39a12", createdAt: nowIso() },
    { id: "subject-bookkeeping", name: "簿記", icon: "📊", color: "#17bf4b", createdAt: nowIso() },
    { id: "subject-toeic", name: "TOEIC", icon: "🎧", color: "#a047b8", createdAt: nowIso() },
  ],
  studyRecords: [],
  studyGoals: [],
};

type AppView = "input" | "calendar" | "timer" | "report";

const loadSessionUser = (): AuthUser | null => {
  try {
    const savedUserId = localStorage.getItem(sessionKey);
    if (!savedUserId) return null;
    const users = JSON.parse(localStorage.getItem("study-ledger-users-v1") || "[]") as AuthUser[];
    return users.find((user) => user.id === savedUserId) ?? null;
  } catch {
    return null;
  }
};

function App() {
  const todayKey = toDateKey(new Date());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => loadSessionUser());
  const dataKey = currentUser ? `study-ledger-data-v1:${currentUser.id}` : "study-ledger-data-v1:locked";
  const [data, setData] = useLocalStorage<StudyData>(dataKey, initialData);
  const safeData = { ...data, studyGoals: data.studyGoals ?? [] };
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [activeView, setActiveView] = useState<AppView>("input");
  const [editRecordRequest, setEditRecordRequest] = useState<StudyRecord | null>(null);

  const monthKey = getMonthKey(currentMonth);

  const monthlyRecords = useMemo(
    () => safeData.studyRecords.filter((record) => record.date.startsWith(monthKey)),
    [safeData.studyRecords, monthKey],
  );

  const dailyTotals = useMemo(() => {
    const totals = new Map<string, number>();
    safeData.studyRecords.forEach((record) => {
      totals.set(record.date, (totals.get(record.date) ?? 0) + record.durationMinutes);
    });
    return totals;
  }, [safeData.studyRecords]);

  const dailyGoalTotals = useMemo(() => {
    const totals = new Map<string, number>();
    safeData.studyGoals.forEach((goal) => {
      totals.set(goal.date, (totals.get(goal.date) ?? 0) + goal.durationMinutes);
    });
    return totals;
  }, [safeData.studyGoals]);

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
    safeData.studyRecords.forEach((record) => {
      counts.set(record.subjectId, (counts.get(record.subjectId) ?? 0) + 1);
    });
    safeData.studyGoals.forEach((goal) => {
      counts.set(goal.subjectId, (counts.get(goal.subjectId) ?? 0) + 1);
    });
    return counts;
  }, [safeData.studyRecords, safeData.studyGoals]);

  const monthlyTotal = monthlyRecords.reduce((sum, record) => sum + record.durationMinutes, 0);
  const todayTotal = dailyTotals.get(todayKey) ?? 0;

  const login = (user: AuthUser) => {
    localStorage.setItem(sessionKey, user.id);
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem(sessionKey);
    setCurrentUser(null);
    setActiveView("input");
    setEditRecordRequest(null);
  };

  const updateData = (recipe: (current: StudyData) => StudyData) => {
    setData((current) => recipe({ ...current, studyGoals: current.studyGoals ?? [] }));
  };

  const addSubject = (name: string, icon = subjectIconOptions[0], color = subjectColorOptions[0]) => {
    const subject: Subject = { id: createId(), name, icon, color, createdAt: nowIso() };
    updateData((current) => ({ ...current, subjects: [...current.subjects, subject] }));
  };

  const updateSubject = (id: string, name: string, icon?: string, color?: string) => {
    updateData((current) => ({
      ...current,
      subjects: current.subjects.map((subject) =>
        subject.id === id ? { ...subject, name, icon: icon ?? subject.icon, color: color ?? subject.color } : subject,
      ),
    }));
  };

  const deleteSubject = (id: string) => {
    updateData((current) => {
      const remainingSubjects = current.subjects.filter((subject) => subject.id !== id);
      const fallbackSubjectId = remainingSubjects[0]?.id;

      return {
        subjects: remainingSubjects,
        studyRecords: fallbackSubjectId
          ? current.studyRecords.map((record) =>
              record.subjectId === id ? { ...record, subjectId: fallbackSubjectId, updatedAt: nowIso() } : record,
            )
          : current.studyRecords.filter((record) => record.subjectId !== id),
        studyGoals: fallbackSubjectId
          ? current.studyGoals.map((goal) =>
              goal.subjectId === id ? { ...goal, subjectId: fallbackSubjectId, updatedAt: nowIso() } : goal,
            )
          : current.studyGoals.filter((goal) => goal.subjectId !== id),
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

  const addGoal = (goal: Omit<StudyGoal, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = nowIso();
    updateData((current) => ({
      ...current,
      studyGoals: [...current.studyGoals, { ...goal, id: createId(), createdAt: timestamp, updatedAt: timestamp }],
    }));
  };

  const updateGoal = (id: string, goal: Pick<StudyGoal, "subjectId" | "durationMinutes" | "memo">) => {
    updateData((current) => ({
      ...current,
      studyGoals: current.studyGoals.map((item) => (item.id === id ? { ...item, ...goal, updatedAt: nowIso() } : item)),
    }));
  };

  const deleteGoal = (id: string) => {
    updateData((current) => ({
      ...current,
      studyGoals: current.studyGoals.filter((goal) => goal.id !== id),
    }));
  };

  const selectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    const [year, month] = dateKey.split("-").map(Number);
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const editRecordFromCalendar = (record: StudyRecord) => {
    selectDate(record.date);
    setEditRecordRequest(record);
    setActiveView("input");
  };

  const changeMonth = (amount: number) => {
    const nextMonth = moveMonth(currentMonth, amount);
    setCurrentMonth(nextMonth);
    setSelectedDate(toDateKey(nextMonth));
  };

  if (!currentUser) {
    return <AuthPanel onLogin={login} />;
  }

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
        <div className="user-menu">
          <span>{currentUser.username}</span>
          <button className="icon-button subtle" type="button" onClick={logout} aria-label="ログアウト">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="mobile-app-layout">
        {activeView === "input" && (
          <div className="view-stack">
            <RecordPanel
              selectedDate={selectedDate}
              subjects={safeData.subjects}
              records={safeData.studyRecords}
              goals={safeData.studyGoals}
              editRecordRequest={editRecordRequest}
              onEditRecordLoaded={() => setEditRecordRequest(null)}
              onSelectDate={selectDate}
              onAddRecord={addRecord}
              onUpdateRecord={updateRecord}
              onDeleteRecord={deleteRecord}
              onAddGoal={addGoal}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
            />
            <div id="subject-manager">
              <SubjectManager
                subjects={safeData.subjects}
                recordCounts={recordCounts}
                onAddSubject={addSubject}
                onUpdateSubject={updateSubject}
                onDeleteSubject={deleteSubject}
              />
            </div>
          </div>
        )}

        {activeView === "calendar" && (
          <div className="view-stack">
            <Summary monthlyTotal={monthlyTotal} todayTotal={todayTotal} subjectTotals={subjectTotals} subjects={safeData.subjects} />
            <Calendar
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              todayKey={todayKey}
              dailyTotals={dailyTotals}
              dailyGoalTotals={dailyGoalTotals}
              records={safeData.studyRecords}
              goals={safeData.studyGoals}
              subjects={safeData.subjects}
              onChangeMonth={changeMonth}
              onSelectDate={selectDate}
            />
            <CalendarRecordList
              records={monthlyRecords}
              subjects={safeData.subjects}
              onEditRecord={editRecordFromCalendar}
              onDeleteRecord={deleteRecord}
            />
          </div>
        )}

        {activeView === "timer" && (
          <div className="view-stack">
            <TimerPanel selectedDate={selectedDate} subjects={safeData.subjects} onAddRecord={addRecord} />
          </div>
        )}

        {activeView === "report" && (
          <div className="view-stack">
            <Summary monthlyTotal={monthlyTotal} todayTotal={todayTotal} subjectTotals={subjectTotals} subjects={safeData.subjects} />
            <ReportPanel monthlyTotal={monthlyTotal} subjectTotals={subjectTotals} subjects={safeData.subjects} />
          </div>
        )}
      </main>

      <nav className="bottom-nav" aria-label="メインメニュー">
        <button className={activeView === "input" ? "is-active" : ""} type="button" onClick={() => setActiveView("input")}>
          <Pencil size={25} />
          <span>入力</span>
        </button>
        <button className={activeView === "calendar" ? "is-active" : ""} type="button" onClick={() => setActiveView("calendar")}>
          <CalendarDays size={25} />
          <span>カレンダー</span>
        </button>
        <button className={activeView === "timer" ? "is-active" : ""} type="button" onClick={() => setActiveView("timer")}>
          <Timer size={25} />
          <span>タイマー</span>
        </button>
        <button className={activeView === "report" ? "is-active" : ""} type="button" onClick={() => setActiveView("report")}>
          <PieChart size={25} />
          <span>レポート</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
