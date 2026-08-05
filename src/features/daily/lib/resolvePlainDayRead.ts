import type { DailyPlainGuidancePayload } from './dailyGuidanceFingerprint';
import type { DayForecast } from './dailyForecastEngine';

/** Match Gemini day read to forecast day — date, label, then index. */
export function resolvePlainDayRead(
  guidance: DailyPlainGuidancePayload,
  day: DayForecast,
  dayIndex: number,
): string {
  const byDate = guidance.weekDays.find((d) => d.date === day.date);
  if (byDate?.read) return byDate.read;

  const byLabel = guidance.weekDays.find((d) => d.label === day.label);
  if (byLabel?.read) return byLabel.read;

  const byIndex = guidance.weekDays[dayIndex];
  if (byIndex?.read) return byIndex.read;

  if (day.isToday || dayIndex === 0) return guidance.todayRead;
  return guidance.todayRead;
}
