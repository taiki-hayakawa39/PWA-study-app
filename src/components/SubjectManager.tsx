import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Subject } from "../types";
import { getSubjectColor, getSubjectIcon, subjectColorOptions, subjectIconOptions } from "../utils/subjectVisuals";

type SubjectManagerProps = {
  subjects: Subject[];
  recordCounts: Map<string, number>;
  onAddSubject: (name: string, icon: string, color: string) => void;
  onUpdateSubject: (id: string, name: string, icon: string, color: string) => void;
  onDeleteSubject: (id: string) => void;
};

export function SubjectManager({
  subjects,
  recordCounts,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
}: SubjectManagerProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(subjectIconOptions[0]);
  const [color, setColor] = useState(subjectColorOptions[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (editingId) {
      onUpdateSubject(editingId, trimmed, icon, color);
    } else {
      onAddSubject(trimmed, icon, color);
    }

    setName("");
    setIcon(subjectIconOptions[0]);
    setColor(subjectColorOptions[0]);
    setEditingId(null);
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setName(subject.name);
    setIcon(getSubjectIcon(subject));
    setColor(getSubjectColor(subject));
  };

  const cancel = () => {
    setEditingId(null);
    setName("");
    setIcon(subjectIconOptions[0]);
    setColor(subjectColorOptions[0]);
  };

  return (
    <section className="panel" aria-label="教材・科目管理">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Subjects</p>
          <h2>教材・科目管理</h2>
        </div>
      </div>

      <form className="subject-form" onSubmit={submit}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例：英単語帳、数学IA" />
        <div className="subject-visual-picker" aria-label="イラスト選択">
          {subjectIconOptions.map((option) => (
            <button
              key={option}
              className={`visual-option ${icon === option ? "is-selected" : ""}`}
              type="button"
              onClick={() => setIcon(option)}
              aria-label={`${option}を選択`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="subject-color-picker" aria-label="色選択">
          {subjectColorOptions.map((option) => (
            <button
              key={option}
              className={`color-option ${color === option ? "is-selected" : ""}`}
              type="button"
              onClick={() => setColor(option)}
              style={{ background: option }}
              aria-label={`${option}を選択`}
            />
          ))}
        </div>
        {editingId && (
          <button className="icon-button subtle" type="button" onClick={cancel} aria-label="編集を取消">
            <X size={17} />
          </button>
        )}
        <button className="primary-button compact" type="submit">
          {editingId ? <Save size={17} /> : <Plus size={17} />}
          {editingId ? "保存" : "追加"}
        </button>
      </form>

      <div className="subject-list">
        {subjects.map((subject) => (
          <div key={subject.id} className="subject-row">
            <div className="subject-row-main">
              <span className="subject-row-icon" style={{ color: getSubjectColor(subject) }}>
                {getSubjectIcon(subject)}
              </span>
              <div>
                <strong>{subject.name}</strong>
                <p>{recordCounts.get(subject.id) ?? 0}件の記録</p>
              </div>
            </div>
            <div className="icon-actions">
              <button className="icon-button subtle" type="button" onClick={() => startEdit(subject)} aria-label="教材名を編集">
                <Edit3 size={17} />
              </button>
              <button className="icon-button danger" type="button" onClick={() => onDeleteSubject(subject.id)} aria-label="教材名を削除">
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
