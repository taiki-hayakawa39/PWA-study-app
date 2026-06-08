import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { StudyRecord, Subject } from "../types";
import { createCalendarDays, getMonthLabel, toDateKey } from "../utils/date";
import { getSubjectColor, getSubjectIcon } from "../utils/subjectVisuals";
import { formatCompactMinutes, formatMinutes } from "../utils/time";

type CalendarProps = {
  currentMonth: Date;
  selectedDate: string;
  todayKey: string;
  dailyTotals: Map<string, number>;
  records: StudyRecord[];
  subjects: Subject[];
  onChangeMonth: (amount: number) => void;
  onSelectDate: (dateKey: string) => void;
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

const dateLabel = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${year}年${month}月${day}日(${weekdays[date.getDay()]})`;
};

export function Calendar({
  currentMonth,
  selectedDate,
  todayKey,
  dailyTotals,
  records,
  subjects,
  onChangeMonth,
  onSelectDate,
}: CalendarProps) {
  const days = createCalendarDays(currentMonth);
  const [breakdownDate, setBreakdownDate] = useState("");
  const breakdownRecords = records.filter((record) => record.date === breakdownDate);
  const breakdownTotal = breakdownRecords.reduce((sum, record) => sum + record.durationMinutes, 0);

  return (
    <section className="panel calendar-panel" aria-label="月間カレンダー">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>{getMonthLabel(currentMonth)}</h2>
        </div>
        <div className="icon-actions">
          <button className="icon-button" type="button" onClick={() => onChangeMonth(-1)} aria-label="前の月">
            <ChevronLeft size={20} />
          </button>
          <button className="icon-button" type="button" onClick={() => onChangeMonth(1)} aria-label="次の月">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="calendar-grid weekday-row">
        {weekdays.map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid day-grid">
        {days.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} className="calendar-day is-blank" />;

          const dateKey = toDateKey(date);
          const total = dailyTotals.get(dateKey) ?? 0;
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;

          return (
            <button
              key={dateKey}
              type="button"
              className={`calendar-day ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`}
              onClick={() => {
                onSelectDate(dateKey);
                setBreakdownDate(total > 0 ? dateKey : "");
              }}
            >
              <span className="day-number">{date.getDate()}</span>
              <span className="day-total">{formatCompactMinutes(total)}</span>
            </button>
          );
        })}
      </div>

      {breakdownRecords.length > 0 && (
        <div className="day-breakdown">
          <h3>{dateLabel(breakdownDate)}の内訳</h3>
          <p className="breakdown-formula">
            {breakdownRecords.map((record) => formatMinutes(record.durationMinutes)).join(" + ")} = {formatMinutes(breakdownTotal)}
          </p>
          <div className="breakdown-list">
            {breakdownRecords.map((record) => {
              const subject = subjects.find((item) => item.id === record.subjectId);
              const subjectIndex = Math.max(
                0,
                subjects.findIndex((item) => item.id === record.subjectId),
              );

              return (
                <div className="breakdown-row" key={record.id}>
                  <span
                    className="breakdown-icon"
                    style={{ "--subject-color": getSubjectColor(subject, subjectIndex) } as CSSProperties}
                    aria-hidden="true"
                  >
                    {getSubjectIcon(subject, subjectIndex)}
                  </span>
                  <span>
                    {subject?.name ?? "削除済みサブジェクト"}
                    {record.memo ? `（${record.memo}）` : ""}
                  </span>
                  <strong>{formatMinutes(record.durationMinutes)}</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
