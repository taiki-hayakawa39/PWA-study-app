import type { Subject } from "../types";
import { getSubjectColor, getSubjectIcon } from "../utils/subjectVisuals";
import { formatMinutes } from "../utils/time";

type ReportPanelProps = {
  monthlyTotal: number;
  subjectTotals: Array<{ subjectId: string; minutes: number }>;
  subjects: Subject[];
};

export function ReportPanel({ monthlyTotal, subjectTotals, subjects }: ReportPanelProps) {
  const getSubjectName = (id: string) => subjects.find((subject) => subject.id === id)?.name ?? "削除済み教材";
  const getSubject = (id: string) => subjects.find((subject) => subject.id === id);
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section className="panel report-panel" aria-label="月間レポート">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Report</p>
          <h2>月間レポート</h2>
        </div>
        <div className="total-chip">{formatMinutes(monthlyTotal)}</div>
      </div>

      <div className="report-content">
        <div className="pie-chart-wrap" aria-label="サブジェクト別の勉強時間割合">
          {monthlyTotal > 0 ? (
            <svg className="pie-chart" viewBox="0 0 220 220" role="img">
              <circle className="pie-bg" cx="110" cy="110" r={radius} />
              {subjectTotals.map((item, index) => {
                const dash = (item.minutes / monthlyTotal) * circumference;
                const strokeDasharray = `${dash} ${circumference - dash}`;
                const strokeDashoffset = -offset;
                offset += dash;

                return (
                  <circle
                    key={item.subjectId}
                    className="pie-segment"
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke={getSubjectColor(getSubject(item.subjectId), index)}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                  />
                );
              })}
            </svg>
          ) : (
            <div className="empty-pie">0%</div>
          )}
          <div className="pie-center">
            <span>合計</span>
            <strong>{formatMinutes(monthlyTotal)}</strong>
          </div>
        </div>

        <div className="report-list">
          {subjectTotals.length === 0 ? (
            <p className="empty-text">今月の記録はまだありません。</p>
          ) : (
            subjectTotals.map((item, index) => {
              const percent = Math.round((item.minutes / monthlyTotal) * 100);

              return (
                <div key={item.subjectId} className="report-row">
                  <span className="report-dot" style={{ background: getSubjectColor(getSubject(item.subjectId), index) }}>
                    {getSubjectIcon(getSubject(item.subjectId), index)}
                  </span>
                  <div>
                    <strong>{getSubjectName(item.subjectId)}</strong>
                    <p>{percent}%</p>
                  </div>
                  <span>{formatMinutes(item.minutes)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
