import type { Subject } from "../types";
import { formatMinutes } from "../utils/time";

type SummaryProps = {
  monthlyTotal: number;
  todayTotal: number;
  subjectTotals: Array<{ subjectId: string; minutes: number }>;
  subjects: Subject[];
};

export function Summary({ monthlyTotal, todayTotal, subjectTotals, subjects }: SummaryProps) {
  const getSubjectName = (id: string) => subjects.find((subject) => subject.id === id)?.name ?? "削除済み教材";

  return (
    <aside className="summary-stack">
      <section className="metric-band" aria-label="主要サマリー">
        <div>
          <p>今月の合計</p>
          <strong>{formatMinutes(monthlyTotal)}</strong>
        </div>
        <div>
          <p>今日の合計</p>
          <strong>{formatMinutes(todayTotal)}</strong>
        </div>
      </section>

      <section className="panel" aria-label="月間サマリー">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Monthly</p>
            <h2>教材別サマリー</h2>
          </div>
        </div>
        <div className="summary-list">
          {subjectTotals.length === 0 ? (
            <p className="empty-text">今月の記録はまだありません。</p>
          ) : (
            subjectTotals.map((item) => (
              <div key={item.subjectId} className="summary-row">
                <span>{getSubjectName(item.subjectId)}</span>
                <strong>{formatMinutes(item.minutes)}</strong>
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
