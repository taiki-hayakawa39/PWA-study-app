import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Edit3,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { StudyRecord, Subject } from "../types";
import { getSubjectColor, getSubjectIcon } from "../utils/subjectVisuals";
import { formatMinutes, parseDurationToMinutes } from "../utils/time";

type RecordPanelProps = {
  selectedDate: string;
  subjects: Subject[];
  records: StudyRecord[];
  editRecordRequest: StudyRecord | null;
  onEditRecordLoaded: () => void;
  onSelectDate: (dateKey: string) => void;
  onAddRecord: (record: Omit<StudyRecord, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateRecord: (id: string, record: Pick<StudyRecord, "subjectId" | "durationMinutes" | "memo">) => void;
  onDeleteRecord: (id: string) => void;
};

const toLocalDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInputDateLabel = (dateKey: string) => {
  const date = toLocalDate(dateKey);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${weekdays[date.getDay()]})`;
};

export function RecordPanel({
  selectedDate,
  subjects,
  records,
  editRecordRequest,
  onEditRecordLoaded,
  onSelectDate,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}: RecordPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [duration, setDuration] = useState("");
  const [memo, setMemo] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedRecords = useMemo(
    () => records.filter((record) => record.date === selectedDate),
    [records, selectedDate],
  );
  const dailyTotal = selectedRecords.reduce((sum, record) => sum + record.durationMinutes, 0);

  useEffect(() => {
    setEditingId(null);
    setSubjectId(subjects[0]?.id ?? "");
    setDuration("");
    setMemo("");
    setSuccessMessage("");
  }, [selectedDate, subjects]);

  useEffect(() => {
    if (!editRecordRequest) return;
    setEditingId(editRecordRequest.id);
    setSubjectId(editRecordRequest.subjectId);
    setDuration(String(editRecordRequest.durationMinutes));
    setMemo(editRecordRequest.memo);
    setSuccessMessage("");
    onEditRecordLoaded();
  }, [editRecordRequest, onEditRecordLoaded]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const resetForm = () => {
    setEditingId(null);
    setSubjectId(subjects[0]?.id ?? "");
    setDuration("");
    setMemo("");
  };

  const startEdit = (record: StudyRecord) => {
    setEditingId(record.id);
    setSubjectId(record.subjectId);
    setDuration(String(record.durationMinutes));
    setMemo(record.memo);
  };

  const moveSelectedDate = (amount: number) => {
    const nextDate = toLocalDate(selectedDate);
    nextDate.setDate(nextDate.getDate() + amount);
    onSelectDate(toDateKey(nextDate));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const durationMinutes = parseDurationToMinutes(duration);
    const selectedSubjectId = subjectId || subjects[0]?.id || "";
    setSuccessMessage("");
    if (!selectedSubjectId || durationMinutes <= 0) return;

    if (editingId) {
      onUpdateRecord(editingId, { subjectId: selectedSubjectId, durationMinutes, memo: memo.trim() });
      setSuccessMessage("データが更新されました");
    } else {
      onAddRecord({ date: selectedDate, subjectId: selectedSubjectId, durationMinutes, memo: memo.trim() });
      setSuccessMessage("データが入力されました");
    }

    resetForm();
  };

  const getSubjectName = (id: string) => subjects.find((subject) => subject.id === id)?.name ?? "削除済み教材";

  return (
    <section className="panel detail-panel ledger-input-panel" aria-label="勉強時間入力">
      <div className="input-mode-tabs" aria-label="入力モード">
        <button className="mode-tab is-active" type="button">
          勉強
        </button>
        <button className="mode-tab" type="button">
          目標
        </button>
      </div>

      <form className="ledger-entry-form" onSubmit={handleSubmit}>
        {successMessage && (
          <div className="success-message" role="status">
            <CheckCircle2 size={21} />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="ledger-row">
          <span className="ledger-label">日付</span>
          <button className="plain-arrow" type="button" onClick={() => moveSelectedDate(-1)} aria-label="前の日">
            <ChevronLeft size={23} />
          </button>
          <div className="ledger-date-value">{getInputDateLabel(selectedDate)}</div>
          <button className="plain-arrow" type="button" onClick={() => moveSelectedDate(1)} aria-label="次の日">
            <ChevronRight size={23} />
          </button>
        </div>

        <label className="ledger-row ledger-text-row">
          <span className="ledger-label">メモ</span>
          <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="未入力" />
        </label>

        <label className="ledger-row ledger-duration-row">
          <span className="ledger-label">時間</span>
          <input
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            placeholder="30"
            inputMode="numeric"
          />
          <span className="ledger-unit">分</span>
        </label>

        <div className="subject-picker-header">
          <span>サブジェクト</span>
          <div className="total-chip">{formatMinutes(dailyTotal)}</div>
        </div>

        <div className="subject-tile-grid" role="radiogroup" aria-label="サブジェクト選択">
          {subjects.map((subject, index) => {
            const subjectColor = getSubjectColor(subject, index);
            return (
              <button
                key={subject.id}
                className={`subject-tile ${subject.id === subjectId ? "is-selected" : ""}`}
                type="button"
                role="radio"
                aria-checked={subject.id === subjectId}
                onClick={() => setSubjectId(subject.id)}
                style={{ "--subject-color": subjectColor } as CSSProperties}
              >
                <span className="subject-illustration" aria-hidden="true">
                  {getSubjectIcon(subject, index)}
                </span>
                <span>{subject.name}</span>
              </button>
            );
          })}
          <a className="subject-tile manage-tile" href="#subject-manager">
            <Plus size={28} />
            <span>編集・追加</span>
          </a>
        </div>

        <div className="form-actions ledger-form-actions">
          {editingId && (
            <button className="secondary-button" type="button" onClick={resetForm}>
              <X size={17} />
              取消
            </button>
          )}
          <button className="primary-button ledger-submit" type="submit" disabled={subjects.length === 0}>
            {editingId ? <Save size={18} /> : <Plus size={18} />}
            {editingId ? "記録を更新する" : "勉強を記録する"}
          </button>
        </div>
      </form>

      <div className="daily-record-section">
        <div className="section-title-row">
          <h3>この日の記録</h3>
          <span>{formatMinutes(dailyTotal)}</span>
        </div>

        <div className="record-list">
          {selectedRecords.length === 0 ? (
            <p className="empty-text">この日の記録はまだありません。</p>
          ) : (
            selectedRecords.map((record) => (
              <article key={record.id} className="record-item">
                <div className="record-main">
                  <span className="record-icon">
                    {getSubjectIcon(subjects.find((subject) => subject.id === record.subjectId))}
                  </span>
                  <div>
                    <strong>{getSubjectName(record.subjectId)}</strong>
                    <p>{record.memo || "メモなし"}</p>
                  </div>
                </div>
                <div className="record-actions">
                  <span>{formatMinutes(record.durationMinutes)}</span>
                  <button className="icon-button subtle" type="button" onClick={() => startEdit(record)} aria-label="記録を編集">
                    <Edit3 size={17} />
                  </button>
                  <button className="icon-button danger" type="button" onClick={() => onDeleteRecord(record.id)} aria-label="記録を削除">
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
