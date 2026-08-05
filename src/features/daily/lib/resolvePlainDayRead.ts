import type { DailyPlainEnergyProfile, DailyPlainGuidancePayload } from './dailyGuidanceFingerprint';
import type { DayForecast } from './dailyForecastEngine';

function matchWeekDay(
  guidance: DailyPlainGuidancePayload,
  day: DayForecast,
  dayIndex: number,
) {
  return (
    guidance.weekDays.find((d) => d.date === day.date) ??
    guidance.weekDays.find((d) => d.label === day.label) ??
    guidance.weekDays[dayIndex]
  );
}

/** Match Gemini day read to forecast day — date, label, then index. */
export function resolvePlainDayRead(
  guidance: DailyPlainGuidancePayload,
  day: DayForecast,
  dayIndex: number,
): string {
  const match = matchWeekDay(guidance, day, dayIndex);
  if (match?.read) return match.read;
  if (day.isToday || dayIndex === 0) return guidance.todayRead;
  return guidance.todayRead;
}

export function resolvePlainDayEnergy(
  guidance: DailyPlainGuidancePayload | null | undefined,
  day: DayForecast,
  dayIndex: number,
): DailyPlainEnergyProfile | null {
  if (!guidance) return null;
  return matchWeekDay(guidance, day, dayIndex)?.energy ?? null;
}
