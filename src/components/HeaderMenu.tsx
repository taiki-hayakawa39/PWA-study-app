import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Eye, LogOut, Menu, Save, UserRound, X } from "lucide-react";
import type { UserProfile } from "../types";

type HeaderMenuProps = {
  username: string;
  profile?: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onLogout: () => void;
};

const nowIso = () => new Date().toISOString();

export function HeaderMenu({ username, profile, onSaveProfile, onLogout }: HeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || username);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [longTermGoal, setLongTermGoal] = useState(profile?.longTermGoal ?? "");
  const [avatarDataUrl, setAvatarDataUrl] = useState(profile?.avatarDataUrl ?? "");
  const [publicProfile, setPublicProfile] = useState(profile?.publicSettings?.profile ?? false);
  const [publicStudyStats, setPublicStudyStats] = useState(profile?.publicSettings?.studyStats ?? false);
  const [publicLearningContent, setPublicLearningContent] = useState(profile?.publicSettings?.learningContent ?? false);

  useEffect(() => {
    if (!isOpen) return;

    setDisplayName(profile?.displayName || username);
    setBio(profile?.bio ?? "");
    setLongTermGoal(profile?.longTermGoal ?? "");
    setAvatarDataUrl(profile?.avatarDataUrl ?? "");
    setPublicProfile(profile?.publicSettings?.profile ?? false);
    setPublicStudyStats(profile?.publicSettings?.studyStats ?? false);
    setPublicLearningContent(profile?.publicSettings?.learningContent ?? false);
  }, [isOpen, profile, username]);

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

  const saveMenuProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSaveProfile({
      displayName: displayName.trim() || username,
      bio: bio.trim(),
      longTermGoal: longTermGoal.trim(),
      avatarDataUrl,
      publicSettings: {
        profile: publicProfile,
        studyStats: publicStudyStats,
        learningContent: publicLearningContent,
      },
      updatedAt: nowIso(),
    });
    setIsOpen(false);
  };

  const logoutFromMenu = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="header-menu">
      <button
        className="icon-button subtle hamburger-menu-button"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="メニューを開く"
        aria-expanded={isOpen}
      >
        <Menu size={22} />
      </button>

      {isOpen && <button className="header-menu-backdrop" type="button" aria-label="メニューを閉じる" onClick={() => setIsOpen(false)} />}

      {isOpen && (
        <aside className="header-menu-popover" aria-label="アカウントメニュー">
          <div className="header-menu-title">
            <div>
              <span>MENU</span>
              <strong>アカウント設定</strong>
            </div>
            <button className="icon-button subtle" type="button" onClick={() => setIsOpen(false)} aria-label="閉じる">
              <X size={18} />
            </button>
          </div>

          <form className="header-profile-form" onSubmit={saveMenuProfile}>
            <label className="header-avatar-picker">
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
              <span className="header-avatar-preview">
                {avatarDataUrl ? <img src={avatarDataUrl} alt="" /> : <UserRound size={34} />}
              </span>
              <span className="avatar-action">
                <Camera size={17} />
                画像を選択
              </span>
            </label>

            <label>
              表示名
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="表示名" />
            </label>

            <label>
              自己紹介
              <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} placeholder="今取り組んでいることなど" />
            </label>

            <label>
              長期的な目標
              <textarea
                value={longTermGoal}
                onChange={(event) => setLongTermGoal(event.target.value)}
                rows={3}
                placeholder="達成したい学習目標"
              />
            </label>

            <section className="header-public-settings" aria-label="公開設定">
              <div className="header-menu-section-title">
                <Eye size={18} />
                <strong>公開設定</strong>
              </div>
              <label className="toggle-row">
                <input type="checkbox" checked={publicProfile} onChange={(event) => setPublicProfile(event.target.checked)} />
                <span>表示名・自己紹介・長期目標を公開</span>
              </label>
              <label className="toggle-row">
                <input type="checkbox" checked={publicStudyStats} onChange={(event) => setPublicStudyStats(event.target.checked)} />
                <span>学習日数関連を公開</span>
              </label>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={publicLearningContent}
                  onChange={(event) => setPublicLearningContent(event.target.checked)}
                />
                <span>学習内容を公開</span>
              </label>
            </section>

            <div className="header-menu-actions">
              <button className="primary-button" type="submit">
                <Save size={18} />
                保存
              </button>
              <button className="secondary-button logout-menu-button" type="button" onClick={logoutFromMenu}>
                <LogOut size={18} />
                ログアウト
              </button>
            </div>
          </form>
        </aside>
      )}
    </div>
  );
}
