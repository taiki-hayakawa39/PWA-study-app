import { useMemo, useState, type FormEvent } from "react";
import { Flame, Target, UserPlus, UserRound, UsersRound } from "lucide-react";
import type { StudyRecord, UserProfile } from "../types";
import { getDateLabel } from "../utils/date";
import { calculateStudyStats } from "../utils/studyStats";
import type { StudyStats } from "../utils/studyStats";
import { formatMinutes } from "../utils/time";

export type PublicLearningRecord = {
  id: string;
  date: string;
  subjectName: string;
  durationMinutes: number;
  memo: string;
};

export type PublicProfileSummary = {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  longTermGoal: string;
  avatarDataUrl: string;
  friendCode: string;
  stats?: StudyStats;
  learningRecords?: PublicLearningRecord[];
};

export type FriendSummary = {
  id: string;
  username: string;
  displayName: string;
  friendCode: string;
};

type MyPageProps = {
  username: string;
  profile?: UserProfile;
  records: StudyRecord[];
  monthlyTotal: number;
  todayTotal: number;
  friendCode: string;
  friends: FriendSummary[];
  publicProfiles: PublicProfileSummary[];
  onAddFriend: (friendCode: string) => string;
};

const getStreakTone = (days: number) => {
  if (days >= 100) return "milestone-gradient";
  if (days >= 50) return "milestone-gold";
  if (days >= 30) return "milestone-purple";
  if (days >= 14) return "milestone-red";
  if (days >= 7) return "milestone-blue";
  if (days >= 3) return "milestone-green";
  return "milestone-default";
};

const getTotalDaysTone = (days: number) => {
  if (days >= 300) return "milestone-gradient";
  if (days >= 200) return "milestone-gold";
  if (days >= 100) return "milestone-purple";
  if (days >= 60) return "milestone-red";
  if (days >= 30) return "milestone-blue";
  if (days >= 10) return "milestone-green";
  return "milestone-default";
};

export function MyPage({
  username,
  profile,
  records,
  monthlyTotal,
  todayTotal,
  friendCode,
  friends,
  publicProfiles,
  onAddFriend,
}: MyPageProps) {
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [friendMessage, setFriendMessage] = useState("");
  const [isFriendCodeVisible, setIsFriendCodeVisible] = useState(false);
  const stats = useMemo(() => calculateStudyStats(records), [records]);
  const displayName = profile?.displayName || username;
  const bio = profile?.bio?.trim() || "自己紹介はまだ設定されていません。右上のメニューから追加できます。";
  const longTermGoal = profile?.longTermGoal?.trim() || "長期的な目標はまだ設定されていません。右上のメニューから追加できます。";
  const avatarDataUrl = profile?.avatarDataUrl ?? "";

  const addFriend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = onAddFriend(friendCodeInput);
    setFriendMessage(message);
    if (message.includes("追加")) {
      setFriendCodeInput("");
    }
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
        <div className="avatar-display">
          <span className="avatar-preview">
            {avatarDataUrl ? <img src={avatarDataUrl} alt="" /> : <UserRound size={48} />}
          </span>
        </div>

        <div className="profile-headline">
          <strong>{displayName || username}</strong>
          <span>{stats.currentStreak > 0 ? `${stats.currentStreak}日連続で学習中` : "今日の学習を記録して開始"}</span>
          <div className="profile-inline-details">
            <article className="profile-readonly-card">
              <span>自己紹介</span>
              <p>{bio}</p>
            </article>
            <article className="profile-readonly-card">
              <span>長期的な目標</span>
              <div className="goal-preview">
                <Target size={20} />
                <p>{longTermGoal}</p>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="profile-stat-card highlight">
          <Flame size={24} />
          <span>連続学習</span>
          <strong className={getStreakTone(stats.currentStreak)}>{stats.currentStreak}日</strong>
        </div>
        <div className="profile-stat-card">
          <span>最長記録</span>
          <strong className={getStreakTone(stats.longestStreak)}>{stats.longestStreak}日</strong>
        </div>
        <div className="profile-stat-card">
          <span>学習した日数</span>
          <strong className={getTotalDaysTone(stats.totalStudyDays)}>{stats.totalStudyDays}日</strong>
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

      <section className="friend-panel" aria-label="フレンド">
        <div className="section-title-row">
          <h3>
            <UsersRound size={20} />
            フレンド
          </h3>
          <span>{friends.length}人</span>
        </div>

        <div className="friend-code-card">
          <div>
            <span>あなたのフレンドコード</span>
            <strong>{isFriendCodeVisible ? friendCode : "••••"}</strong>
          </div>
          <button className="secondary-button" type="button" onClick={() => setIsFriendCodeVisible((current) => !current)}>
            {isFriendCodeVisible ? "隠す" : "表示"}
          </button>
        </div>

        <form className="friend-add-form" onSubmit={addFriend}>
          <label>
            4桁のフレンドコード
            <input
              value={friendCodeInput}
              onChange={(event) => setFriendCodeInput(event.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              placeholder="例：1234"
            />
          </label>
          <button className="primary-button" type="submit">
            <UserPlus size={18} />
            追加
          </button>
        </form>
        {friendMessage && <p className="friend-message">{friendMessage}</p>}

        {friends.length > 0 && (
          <div className="friend-list">
            {friends.map((friend) => (
              <div className="friend-row" key={friend.id}>
                <div>
                  <strong>{friend.displayName}</strong>
                  <span>@{friend.username}</span>
                </div>
                <b>{friend.friendCode}</b>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="public-profiles-section" aria-label="公開プロフィール">
        <div className="section-title-row">
          <h3>
            <UsersRound size={20} />
            フレンドのTimeVest
          </h3>
          <span>{publicProfiles.length}人公開中</span>
        </div>

        {publicProfiles.length === 0 ? (
          <p className="empty-text">公開中のフレンド情報はまだありません。</p>
        ) : (
          <div className="public-profile-list">
            {publicProfiles.map((item) => (
              <article className="public-profile-card" key={item.userId}>
                <div className="public-profile-header">
                  <span className="public-avatar">
                    {item.avatarDataUrl ? <img src={item.avatarDataUrl} alt="" /> : <UserRound size={30} />}
                  </span>
                  <div>
                    <strong>{item.displayName}</strong>
                    <span className="public-friend-code">コード {item.friendCode}</span>
                    {item.bio && <p>{item.bio}</p>}
                  </div>
                </div>

                {item.longTermGoal && (
                  <div className="public-goal">
                    <Target size={17} />
                    <span>{item.longTermGoal}</span>
                  </div>
                )}

                {item.stats && (
                  <div className="public-stats-grid">
                    <span>
                      連続 <strong className={getStreakTone(item.stats.currentStreak)}>{item.stats.currentStreak}日</strong>
                    </span>
                    <span>
                      最長 <strong className={getStreakTone(item.stats.longestStreak)}>{item.stats.longestStreak}日</strong>
                    </span>
                    <span>
                      総日数 <strong className={getTotalDaysTone(item.stats.totalStudyDays)}>{item.stats.totalStudyDays}日</strong>
                    </span>
                  </div>
                )}

                {item.learningRecords && item.learningRecords.length > 0 && (
                  <div className="public-learning-list">
                    {item.learningRecords.map((record) => (
                      <div className="public-learning-row" key={record.id}>
                        <div>
                          <strong>{record.subjectName}</strong>
                          <span>{getDateLabel(record.date)}</span>
                          {record.memo && <p>{record.memo}</p>}
                        </div>
                        <b>{formatMinutes(record.durationMinutes)}</b>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
