import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import { Camera, Flame, Target, UserRound } from "lucide-react";
import type { StudyRecord, UserProfile } from "../types";
import { toDateKey } from "../utils/date";
import { formatMinutes } from "../utils/time";

type MyPageProps = {
  username: string;
  profile?: UserProfile;
  records: StudyRecord[];
  monthlyTotal: number;
  todayTotal: number;
  onSaveProfile: (profile: UserProfile) => void;
};

const nowIso = () => new Date().toISOString();

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

export function MyPage({ username, profile, records, monthlyTotal, todayTotal, onSaveProfile }: MyPageProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName || username);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [longTermGoal, setLongTermGoal] = useState(profile?.longTermGoal ?? "");
  const [avatarDataUrl, setAvatarDataUrl] = useState(profile?.avatarDataUrl ?? "");
  const [savedMessage, setSavedMessage] = useState("");

  const stats = useMemo(() => {
    const studyDates = new Set(records.filter((record) => record.durationMinutes > 0).map((record) => record.date));
    const totalMinutes = records.reduce((sum, record) => sum + record.durationMinutes, 0);

    return {
      currentStreak: calculateCurrentStreak(studyDates),
      longestStreak: calculateLongestStreak(studyDates),
      totalStudyDays: studyDates.size,
      totalMinutes,
    };
  }, [records]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setAvatarDataUrl(reader.result);
      }
    });
    reader.readAsDataURL(file);
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveProfile({
      displayName: displayName.trim() || username,
      bio: bio.trim(),
      longTermGoal: longTermGoal.trim(),
      avatarDataUrl,
      updatedAt: nowIso(),
    });
    setSavedMessage("プロフィールを保存しました");
    window.setTimeout(() => setSavedMessage(""), 2200);
  };

  return (
    <section className="panel my-page-panel" aria-label="マイページ">
      <div className="panel-header">
        <div>
          <p className="eyebrow">My Page</p>
          <h2>マイページ</h2>
        </div>
      </div>

      <div className="profile-hero">
        <label className="avatar-picker">
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
          <span className="avatar-preview">
            {avatarDataUrl ? <img src={avatarDataUrl} alt="" /> : <UserRound size={48} />}
          </span>
          <span className="avatar-action">
            <Camera size={17} />
            画像を選択
          </span>
        </label>

        <div className="profile-headline">
          <strong>{displayName || username}</strong>
          <span>{stats.currentStreak > 0 ? `${stats.currentStreak}日連続で学習中` : "今日の学習を記録して開始"}</span>
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="profile-stat-card highlight">
          <Flame size={24} />
          <span>連続学習</span>
          <strong>{stats.currentStreak}日</strong>
        </div>
        <div className="profile-stat-card">
          <span>最長記録</span>
          <strong>{stats.longestStreak}日</strong>
        </div>
        <div className="profile-stat-card">
          <span>学習した日数</span>
          <strong>{stats.totalStudyDays}日</strong>
        </div>
        <div className="profile-stat-card">
          <span>累計時間</span>
          <strong>{formatMinutes(stats.totalMinutes)}</strong>
        </div>
        <div className="profile-stat-card">
          <span>今月</span>
          <strong>{formatMinutes(monthlyTotal)}</strong>
        </div>
        <div className="profile-stat-card">
          <span>今日</span>
          <strong>{formatMinutes(todayTotal)}</strong>
        </div>
      </div>

      <form className="profile-form" onSubmit={saveProfile}>
        <label>
          表示名
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="表示名" />
        </label>
        <label>
          自己紹介
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="例：資格取得に向けて毎日少しずつ進めています。" />
        </label>
        <label>
          長期的な目標
          <textarea
            value={longTermGoal}
            onChange={(event) => setLongTermGoal(event.target.value)}
            placeholder="例：半年後にTOEIC 800点、1年後に簿記2級合格"
          />
        </label>

        <div className="goal-preview">
          <Target size={20} />
          <span>{longTermGoal.trim() || "長期目標を入力するとここに表示されます"}</span>
        </div>

        <div className="profile-form-actions">
          {savedMessage && <span>{savedMessage}</span>}
          <button className="primary-button" type="submit">
            保存する
          </button>
        </div>
      </form>
    </section>
  );
}
