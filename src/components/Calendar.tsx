import { ChevronLeft, ChevronRight } from "lucide-react";
import { createCalendarDays, getMonthLabel, toDateKey } from "../utils/date";
import { formatCompactHours } from "../utils/time";

type CalendarProps = {
  currentMonth: Date;
  selectedDate: string;
  todayKey: string;
  dailyTotals: Map<string, number>;
  onChangeMonth: (amount: number) => void;
  onSelectDate: (dateKey: string) => void;
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

export function Calendar({
  currentMonth,
  selectedDate,
  todayKey,
  dailyTotals,
  onChangeMonth,
  onSelectDate,
}: CalendarProps) {
  const days = createCalendarDays(currentMonth);

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
              onClick={() => onSelectDate(dateKey)}
            >
              <span className="day-number">{date.getDate()}</span>
              <span className="day-total">{formatCompactHours(total)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
