import { BookOpen, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

export type AuthUser = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

type AuthPanelProps = {
  onLogin: (user: AuthUser) => void;
};

const usersKey = "study-ledger-users-v1";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const loadUsers = (): AuthUser[] => {
  try {
    const users = JSON.parse(localStorage.getItem(usersKey) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
};

const saveUsers = (users: AuthUser[]) => {
  localStorage.setItem(usersKey, JSON.stringify(users));
};

const hashPassword = async (password: string) => {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export function AuthPanel({ onLogin }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setMessage("ユーザー名とパスワードを入力してください");
      return;
    }

    const users = loadUsers();
    const passwordHash = await hashPassword(password);

    if (mode === "signup") {
      if (users.some((user) => user.username === cleanUsername)) {
        setMessage("このユーザー名はすでに使われています");
        return;
      }
      const user: AuthUser = { id: createId(), username: cleanUsername, passwordHash, createdAt: new Date().toISOString() };
      saveUsers([...users, user]);
      onLogin(user);
      return;
    }

    const user = users.find((item) => item.username === cleanUsername && item.passwordHash === passwordHash);
    if (!user) {
      setMessage("ユーザー名またはパスワードが違います");
      return;
    }
    onLogin(user);
  };

  return (
    <main className="auth-shell">
      <section className="panel auth-panel">
        <div className="auth-brand">
          <div className="brand-mark">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="eyebrow">Study Ledger</p>
            <h1>勉強時間管理</h1>
          </div>
        </div>

        <div className="input-mode-tabs auth-tabs" aria-label="ログインモード">
          <button className={`mode-tab ${mode === "login" ? "is-active" : ""}`} type="button" onClick={() => setMode("login")}>
            ログイン
          </button>
          <button className={`mode-tab ${mode === "signup" ? "is-active" : ""}`} type="button" onClick={() => setMode("signup")}>
            新規登録
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {message && <p className="auth-message">{message}</p>}
          <label>
            <span>ユーザー名</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            <span>パスワード</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          <button className="primary-button auth-submit" type="submit">
            {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {mode === "login" ? "ログインする" : "登録して始める"}
          </button>
        </form>
      </section>
    </main>
  );
}
