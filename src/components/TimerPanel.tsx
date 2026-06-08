import { Pause, Play, Plus, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { StudyRecord, Subject } from "../types";
import { getSubjectColor, getSubjectIcon } from "../utils/subjectVisuals";
import { formatMinutes } from "../utils/time";

type TimerPanelProps = {
  selectedDate: string;
  subjects: Subject[];
  onAddRecord: (record: Omit<StudyRecord, "id" | "createdAt" | "updatedAt">) => void;
};

const formatElapsed = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
};

export function TimerPanel({ selectedDate, subjects, onAddRecord }: TimerPanelProps) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [memo, setMemo] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [pendingMinutes, setPendingMinutes] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const isRunning = startedAt !== null;
  const recordedMinutes = useMemo(() => Math.max(1, Math.round(elapsedMs / 60000)), [elapsedMs]);

  useEffect(() => {
    if (!subjects.some((subject) => subject.id === subjectId)) {
      setSubjectId(subjects[0]?.id ?? "");
    }
  }, [subjectId, subjects]);

  useEffect(() => {
    if (startedAt === null) return;
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 500);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const startTimer = () => {
    setSuccessMessage("");
    setPendingMinutes(null);
    setElapsedMs(0);
    setStartedAt(Date.now());
  };

  const stopTimer = () => {
    if (startedAt === null) return;
    const finalElapsed = Date.now() - startedAt;
    setElapsedMs(finalElapsed);
    setPendingMinutes(Math.max(1, Math.round(finalElapsed / 60000)));
    setStartedAt(null);
  };

  const resetTimer = () => {
    setStartedAt(null);
    setElapsedMs(0);
    setPendingMinutes(null);
    setSuccessMessage("");
  };

  const saveRecord = () => {
    const durationMinutes = pendingMinutes ?? recordedMinutes;
    const selectedSubjectId = subjectId || subjects[0]?.id || "";
    if (!selectedSubjectId || durationMinutes <= 0) return;
    onAddRecord({ date: selectedDate, subjectId: selectedSubjectId, durationMinutes, memo: memo.trim() });
    setMemo("");
    setElapsedMs(0);
    setPendingMinutes(null);
    setSuccessMessage("タイマーの時間を記録しました");
  };

  return (
    <section className="panel timer-panel" aria-label="タイマー">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Timer</p>
          <h2>タイマー</h2>
        </div>
        <div className="timer-date">{selectedDate}</div>
      </div>

      {successMessage && (
        <div className="success-message" role="status">
          <span>{successMessage}</span>
        </div>
      )}

      <div className="timer-display" aria-live="polite">
        {formatElapsed(elapsedMs)}
      </div>

      <div className="timer-actions">
        {!isRunning ? (
          <button className="primary-button timer-main-button" type="button" onClick={startTimer} disabled={subjects.length === 0}>
            <Play size={20} />
            スタート
          </button>
        ) : (
          <button className="primary-button timer-main-button stop" type="button" onClick={stopTimer}>
            <Pause size={20} />
            ストップ
          </button>
        )}
        <button className="secondary-button timer-reset-button" type="button" onClick={resetTimer}>
          <RotateCcw size={18} />
          リセット
        </button>
      </div>

      <div className="timer-result">
        <span>記録予定</span>
        <strong>{pendingMinutes ? formatMinutes(pendingMinutes) : "停止後に表示"}</strong>
      </div>

      <label className="timer-memo">
        <span>メモ</span>
        <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="例：過去問、英単語100個" />
      </label>

      <div className="subject-picker-header timer-subject-header">
        <span>サブジェクト</span>
      </div>
      <div className="subject-tile-grid timer-subject-grid" role="radiogroup" aria-label="タイマーのサブジェクト選択">
        {subjects.map((subject, index) => {
          const color = getSubjectColor(subject, index);
          return (
            <button
              key={subject.id}
              className={`subject-tile ${subject.id === subjectId ? "is-selected" : ""}`}
              type="button"
              role="radio"
              aria-checked={subject.id === subjectId}
              onClick={() => setSubjectId(subject.id)}
              style={{ "--subject-color": color } as CSSProperties}
            >
              <span className="subject-illustration" aria-hidden="true">
                {getSubjectIcon(subject, index)}
              </span>
              <span>{subject.name}</span>
            </button>
          );
        })}
      </div>

      <div className="timer-save-actions">
        <button className="primary-button ledger-submit" type="button" onClick={saveRecord} disabled={!pendingMinutes || subjects.length === 0}>
          {pendingMinutes ? <Save size={18} /> : <Plus size={18} />}
          この時間を記録する
        </button>
        <button className="secondary-button" type="button" onClick={resetTimer} disabled={!pendingMinutes}>
          記録しない
        </button>
      </div>
    </section>
  );
}
