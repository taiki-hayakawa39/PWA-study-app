import { BookOpen, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

export type AuthUser = {
  id: string;
  username: string;
  passwordHash: string;
  friendCode: string;
  friendIds: string[];
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
  const normalized: AuthUser[] = [];

  users.forEach((user) => {
    if (!user.id || !user.username || !user.passwordHash || !user.createdAt) return;
    normalized.push({
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      friendCode: user.friendCode ?? createFriendCode([...normalized, ...users]),
      friendIds: Array.isArray(user.friendIds) ? user.friendIds : [],
      createdAt: user.createdAt,
    });
  });

  return normalized;
};

const fallbackHashPassword = (password: string) => {
  let hash = 2166136261;
  for (let index = 0; index < password.length; index += 1) {
    hash ^= password.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `local:${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const hashPassword = async (password: string) => {
  if (!crypto?.subtle) {
    return fallbackHashPassword(password);
  }

  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return `sha256:${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
};

const verifyPassword = async (password: string, savedHash: string) => {
  if (savedHash.startsWith("local:")) {
    return fallbackHashPassword(password) === savedHash;
  }

  const hashedPassword = await hashPassword(password);
  if (savedHash.startsWith("sha256:")) {
    return hashedPassword === savedHash;
  }

  // 以前に作ったユーザーは接頭辞なしのSHA-256で保存されています。
  if (!crypto?.subtle) return false;
  return hashedPassword.replace("sha256:", "") === savedHash;
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

    const users = normalizeUsers(loadUsers());
    saveUsers(users);
    const passwordHash = await hashPassword(password);

    if (mode === "signup") {
      if (users.some((user) => user.username === cleanUsername)) {
        setMessage("このユーザー名はすでに使われています");
        return;
      }
      const user: AuthUser = {
        id: createId(),
        username: cleanUsername,
        passwordHash,
        friendCode: createFriendCode(users),
        friendIds: [],
        createdAt: new Date().toISOString(),
      };
      saveUsers([...users, user]);
      onLogin(user);
      return;
    }

    const userCandidates = users.filter((item) => item.username === cleanUsername);
    const userMatches = await Promise.all(userCandidates.map(async (item) => verifyPassword(password, item.passwordHash)));
    const user = userCandidates.find((_, index) => userMatches[index]);
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
            <p className="eyebrow">TimeVest</p>
            <h1>TimeVest</h1>
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
