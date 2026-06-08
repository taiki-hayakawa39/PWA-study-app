import type { CSSProperties } from "react";
import type { StudyRecord, Subject } from "../types";
import { getSubjectColor, getSubjectIcon } from "../utils/subjectVisuals";
import { formatMinutes } from "../utils/time";

type CalendarRecordListProps = {
  records: StudyRecord[];
  subjects: Subject[];
};

const dateLabel = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${year}年${month}月${day}日(${weekdays[date.getDay()]})`;
};

export function CalendarRecordList({ records, subjects }: CalendarRecordListProps) {
  const groupedRecords = records
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
    .reduce<Map<string, StudyRecord[]>>((groups, record) => {
      groups.set(record.date, [...(groups.get(record.date) ?? []), record]);
      return groups;
    }, new Map());

  return (
    <section className="panel calendar-record-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Records</p>
          <h2>入力した記録</h2>
        </div>
      </div>

      <div className="calendar-record-list">
        {groupedRecords.size === 0 ? (
          <p className="empty-text">今月の記録はまだありません。</p>
        ) : (
          [...groupedRecords.entries()].map(([date, dateRecords]) => {
            const dailyTotal = dateRecords.reduce((sum, record) => sum + record.durationMinutes, 0);

            return (
              <div className="calendar-record-group" key={date}>
                <div className="calendar-record-date">
                  <strong>{dateLabel(date)}</strong>
                  <span>{formatMinutes(dailyTotal)}</span>
                </div>

                {dateRecords.map((record) => {
                  const subject = subjects.find((item) => item.id === record.subjectId);
                  const subjectIndex = Math.max(
                    0,
                    subjects.findIndex((item) => item.id === record.subjectId),
                  );

                  return (
                    <article className="calendar-record-row" key={record.id}>
                      <span
                        className="calendar-record-icon"
                        style={{ "--subject-color": getSubjectColor(subject, subjectIndex) } as CSSProperties}
                        aria-hidden="true"
                      >
                        {getSubjectIcon(subject, subjectIndex)}
                      </span>
                      <div>
                        <strong>{subject?.name ?? "削除済みサブジェクト"}</strong>
                        <p>{record.memo || "メモなし"}</p>
                      </div>
                      <span>{formatMinutes(record.durationMinutes)}</span>
                    </article>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
