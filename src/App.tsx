import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Pencil, PieChart, Timer, UserRound } from "lucide-react";
import { AuthPanel } from "./components/AuthPanel";
import type { AuthUser } from "./components/AuthPanel";
import { Calendar } from "./components/Calendar";
import { CalendarRecordList } from "./components/CalendarRecordList";
import { HeaderMenu } from "./components/HeaderMenu";
import { MyPage } from "./components/MyPage";
import type { FriendSummary, PublicLearningRecord, PublicProfileSummary } from "./components/MyPage";
import { ReportPanel } from "./components/ReportPanel";
import { RecordPanel } from "./components/RecordPanel";
import { SubjectManager } from "./components/SubjectManager";
import { Summary } from "./components/Summary";
import { TimerPanel } from "./components/TimerPanel";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { StudyData, StudyGoal, StudyRecord, Subject, UserProfile } from "./types";
import { getMonthKey, moveMonth, toDateKey } from "./utils/date";
import { calculateStudyStats } from "./utils/studyStats";
import { subjectColorOptions, subjectIconOptions } from "./utils/subjectVisuals";

const sessionKey = "study-ledger-current-user-v1";
const usersKey = "study-ledger-users-v1";

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
  profile: undefined,
};

type AppView = "input" | "calendar" | "timer" | "report" | "mypage";
type PendingAppUpdate = {
  registration?: ServiceWorkerRegistration;
  source: "service-worker" | "version";
};

const loadSessionUser = (): AuthUser | null => {
  try {
    const savedUserId = localStorage.getItem(sessionKey);
    if (!savedUserId) return null;
    const users = normalizeUsers(JSON.parse(localStorage.getItem(usersKey) || "[]") as Partial<AuthUser>[]);
    saveUsers(users);
    return users.find((user) => user.id === savedUserId) ?? null;
  } catch {
    return null;
  }
};

const loadAllUsers = (): AuthUser[] => {
  try {
    const users = JSON.parse(localStorage.getItem(usersKey) || "[]") as Partial<AuthUser>[];
    if (!Array.isArray(users)) return [];
    const normalizedUsers = normalizeUsers(users);
    saveUsers(normalizedUsers);
    return normalizedUsers;
  } catch {
    return [];
  }
};

const saveUsers = (users: AuthUser[]) => {
  localStorage.setItem(usersKey, JSON.stringify(users));
};

const createFriendCode = (users: Partial<AuthUser>[]) => {
  const usedCodes = new Set(users.map((user) => user.friendCode).filter(Boolean));

  for (let index = 0; index < 10000; index += 1) {
    const code = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    if (!usedCodes.has(code)) return code;
  }

  return Date.now().toString().slice(-4);
};

const normalizeUsers = (users: Partial<AuthUser>[]): AuthUser[] => {
  const normalizedUsers: AuthUser[] = [];

  users.forEach((user) => {
    if (!user.id || !user.username || !user.passwordHash || !user.createdAt) return;
    normalizedUsers.push({
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      friendCode: user.friendCode ?? createFriendCode([...normalizedUsers, ...users]),
      friendIds: Array.isArray(user.friendIds) ? user.friendIds : [],
      createdAt: user.createdAt,
    });
  });

  return normalizedUsers;
};

const getDisplayName = (user: AuthUser) => {
  try {
    const savedData = JSON.parse(localStorage.getItem(`study-ledger-data-v1:${user.id}`) || "null") as StudyData | null;
    return savedData?.profile?.displayName || user.username;
  } catch {
    return user.username;
  }
};

const loadFriendSummaries = (currentUser: AuthUser): FriendSummary[] => {
  const friendIds = new Set(currentUser.friendIds ?? []);
  return loadAllUsers()
    .filter((user) => friendIds.has(user.id))
    .map((user) => ({
      id: user.id,
      username: user.username,
      displayName: getDisplayName(user),
      friendCode: user.friendCode,
    }));
};

const loadPublicProfiles = (currentUser: AuthUser): PublicProfileSummary[] => {
  const friendIds = new Set(currentUser.friendIds ?? []);

  return loadAllUsers()
    .filter((user) => user.id !== currentUser.id && friendIds.has(user.id))
    .flatMap((user) => {
      try {
        const savedData = JSON.parse(localStorage.getItem(`study-ledger-data-v1:${user.id}`) || "null") as StudyData | null;
        const profile = savedData?.profile;
        const publicSettings = profile?.publicSettings;
        const hasPublicContent = publicSettings?.profile || publicSettings?.studyStats || publicSettings?.learningContent;

        if (!savedData || !profile || !hasPublicContent) return [];

        const summary: PublicProfileSummary = {
          userId: user.id,
          username: user.username,
          friendCode: user.friendCode,
          displayName: publicSettings.profile ? profile.displayName || user.username : user.username,
          bio: publicSettings.profile ? profile.bio : "",
          longTermGoal: publicSettings.profile ? profile.longTermGoal : "",
          avatarDataUrl: publicSettings.profile ? profile.avatarDataUrl : "",
        };

        if (publicSettings.studyStats) {
          summary.stats = calculateStudyStats(savedData.studyRecords ?? []);
        }

        if (publicSettings.learningContent) {
          summary.learningRecords = [...(savedData.studyRecords ?? [])]
            .sort((a, b) => `${b.date}${b.updatedAt}`.localeCompare(`${a.date}${a.updatedAt}`))
            .slice(0, 5)
            .map<PublicLearningRecord>((record) => ({
              id: record.id,
              date: record.date,
              subjectName: savedData.subjects.find((subject) => subject.id === record.subjectId)?.name ?? "削除済み教材",
              durationMinutes: record.durationMinutes,
              memo: record.memo,
            }));
        }

        return [summary];
      } catch {
        return [];
      }
    });
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
  const [pendingAppUpdate, setPendingAppUpdate] = useState<PendingAppUpdate | null>(null);

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
  const publicProfiles = useMemo(
    () => (currentUser ? loadPublicProfiles(currentUser) : []),
    [currentUser, safeData.profile, safeData.studyRecords],
  );
  const friends = useMemo(() => (currentUser ? loadFriendSummaries(currentUser) : []), [currentUser, safeData.profile]);

  useEffect(() => {
    const handleUpdateAvailable = (event: Event) => {
      setPendingAppUpdate((event as CustomEvent<PendingAppUpdate>).detail);
    };

    window.addEventListener("study-ledger-update-available", handleUpdateAvailable);
    return () => window.removeEventListener("study-ledger-update-available", handleUpdateAvailable);
  }, []);

  const applyAppUpdate = () => {
    const waitingWorker = pendingAppUpdate?.registration?.waiting;
    if (!waitingWorker || !("serviceWorker" in navigator)) {
      window.location.reload();
      return;
    }

    let hasRefreshed = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hasRefreshed) return;
      hasRefreshed = true;
      window.location.reload();
    });

    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

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

  const addFriend = (friendCode: string) => {
    if (!currentUser) return "ログインし直してください";
    const cleanCode = friendCode.trim();
    if (!/^\d{4}$/.test(cleanCode)) return "4桁の数字を入力してください";

    const users = loadAllUsers();
    const current = users.find((user) => user.id === currentUser.id);
    const target = users.find((user) => user.friendCode === cleanCode);

    if (!current) return "ユーザー情報を確認できませんでした";
    if (!target) return "このフレンドコードのユーザーは見つかりません";
    if (target.id === current.id) return "自分のコードは追加できません";
    if ((current.friendIds ?? []).includes(target.id)) return "すでにフレンドです";

    const updatedUsers = users.map((user) => {
      if (user.id === current.id) {
        return { ...user, friendIds: [...new Set([...(user.friendIds ?? []), target.id])] };
      }
      if (user.id === target.id) {
        return { ...user, friendIds: [...new Set([...(user.friendIds ?? []), current.id])] };
      }
      return user;
    });
    saveUsers(updatedUsers);

    const updatedCurrentUser = updatedUsers.find((user) => user.id === current.id);
    if (updatedCurrentUser) {
      setCurrentUser(updatedCurrentUser);
    }

    return `${getDisplayName(target)}をフレンドに追加しました`;
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

  const saveProfile = (profile: UserProfile) => {
    updateData((current) => ({ ...current, profile }));
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
          <p className="eyebrow">TimeVest</p>
          <h1>TimeVest</h1>
        </div>
        <div className="user-menu">
          <span>{safeData.profile?.displayName || currentUser.username}</span>
          <HeaderMenu username={currentUser.username} profile={safeData.profile} onSaveProfile={saveProfile} onLogout={logout} />
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

        {activeView === "mypage" && (
          <div className="view-stack">
            <MyPage
              username={currentUser.username}
              profile={safeData.profile}
              records={safeData.studyRecords}
              monthlyTotal={monthlyTotal}
              todayTotal={todayTotal}
              friendCode={currentUser.friendCode}
              friends={friends}
              publicProfiles={publicProfiles}
              onAddFriend={addFriend}
            />
          </div>
        )}
      </main>

      {pendingAppUpdate && (
        <div className="update-toast" role="status" aria-live="polite">
          <div>
            <strong>新しいバージョンがあります</strong>
            <span>更新すると最新の画面に切り替わります。</span>
          </div>
          <button className="primary-button" type="button" onClick={applyAppUpdate}>
            更新する
          </button>
        </div>
      )}

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
        <button className={activeView === "mypage" ? "is-active" : ""} type="button" onClick={() => setActiveView("mypage")}>
          <UserRound size={25} />
          <span>マイページ</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
