import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Subject } from "../types";

type SubjectManagerProps = {
  subjects: Subject[];
  recordCounts: Map<string, number>;
  onAddSubject: (name: string) => void;
  onUpdateSubject: (id: string, name: string) => void;
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (editingId) {
      onUpdateSubject(editingId, trimmed);
    } else {
      onAddSubject(trimmed);
    }

    setName("");
    setEditingId(null);
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setName(subject.name);
  };

  const cancel = () => {
    setEditingId(null);
    setName("");
  };

  return (
    <section className="panel" aria-label="教材・科目管理">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Subjects</p>
          <h2>教材・科目管理</h2>
        </div>
      </div>

      <form className="inline-form" onSubmit={submit}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例：英単語帳、数学IA" />
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
            <div>
              <strong>{subject.name}</strong>
              <p>{recordCounts.get(subject.id) ?? 0}件の記録</p>
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
