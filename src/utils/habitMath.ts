import { Task, Habit, Identity } from '../types/index.ts';
import { getTehranSolarDate } from './tehranTime.ts';

/**
 * Converts a date string (YYYY-MM-DD) into continuous day index.
 * Supports both Solar Hijri (Shamsi) and Gregorian dates.
 */
function parseDateToDays(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 0;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  if (y < 1900) {
    // Solar Hijri (Shamsi)
    let daysInYear = 0;
    if (m <= 6) {
      daysInYear = (m - 1) * 31 + d;
    } else {
      daysInYear = 6 * 31 + (m - 7) * 30 + d;
    }
    const leapYears = Math.floor((y * 8 + 29) / 33);
    return y * 365 + leapYears + daysInYear;
  }

  // Gregorian fallback
  return Math.floor(new Date(dateStr + 'T00:00:00Z').getTime() / (1000 * 60 * 60 * 24));
}

/**
 * Calculates current streak and longest streak from completed date strings (YYYY-MM-DD).
 */
export function calculateStreak(dates: string[], referenceDateStr: string): { current: number; longest: number } {
  if (!dates || dates.length === 0) return { current: 0, longest: 0 };

  const uniqueSortedDates = Array.from(new Set(dates)).sort();
  if (uniqueSortedDates.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let tempStreak = 1;

  for (let i = 1; i < uniqueSortedDates.length; i++) {
    const prevDays = parseDateToDays(uniqueSortedDates[i - 1]);
    const currDays = parseDateToDays(uniqueSortedDates[i]);
    const diffDays = currDays - prevDays;

    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > longest) longest = tempStreak;
    } else if (diffDays > 1) {
      tempStreak = 1;
    }
  }

  // Calculate current streak relative to reference date (today or yesterday)
  const refDays = parseDateToDays(referenceDateStr);
  const lastDays = parseDateToDays(uniqueSortedDates[uniqueSortedDates.length - 1]);
  const daysSinceLast = refDays - lastDays;

  let current = 0;
  // If completed today (0) or yesterday (1), streak is alive
  if (daysSinceLast === 0 || daysSinceLast === 1) {
    current = 1;
    let checkDays = lastDays;
    for (let i = uniqueSortedDates.length - 2; i >= 0; i--) {
      const prevDays = parseDateToDays(uniqueSortedDates[i]);
      const diff = checkDays - prevDays;
      if (diff === 1) {
        current++;
        checkDays = prevDays;
      } else {
        break;
      }
    }
  }

  return { current, longest: Math.max(longest, current) };
}

/**
 * Calculates total identity votes for a given identity from both completed tasks and completed habits.
 * "Every action is a vote for the type of person you wish to become."
 */
export function calculateIdentityVotes(identityId: string, tasks: Task[], habits: Habit[]): number {
  let votes = 0;

  for (const t of tasks) {
    if (t.identityId === identityId && t.completed) {
      votes++;
    }
  }

  for (const h of habits) {
    if (h.identityId === identityId) {
      votes += h.completedDates.length;
    }
  }

  return votes;
}

/**
 * Calculates votes for all identities.
 */
export function calculateAllIdentityVotes(
  identities: Identity[],
  tasks: Task[],
  habits: Habit[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const identity of identities) {
    result[identity.id] = calculateIdentityVotes(identity.id, tasks, habits);
  }
  return result;
}

export function toPersianDigits(val: number | string): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(val).replace(/[0-9]/g, (w) => farsiDigits[+w]);
}

/**
 * Formats duration minutes into pleasant Persian string (e.g. ۴۵ دقیقه or ۱ ساعت و ۳۰ دقیقه)
 */
export function formatDurationPersian(minutes: number): string {
  if (!minutes || minutes <= 0) return '۳۰ دقیقه';
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) return `${toPersianDigits(hours)} ساعت`;
  return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(remainingMins)} دقیقه`;
}

/**
 * Exact Implementation Intention formula requested:
 * «من [فلان کار] را در ساعت [فلان تایم] و در [فلان جا] به مدت [فلان ساعت] انجام خواهم داد.»
 */
export function getImplementationFormula(
  title: string,
  time: string,
  location: string,
  durationMinutes: number,
  identityName?: string
): string {
  const taskPart = title ? `«${title}»` : '[کار مورد نظر]';
  const timePart = time || '[ساعت مشخص]';
  const locationPart = location ? `«${location}»` : '[مکان مشخص]';
  const durationPart = formatDurationPersian(durationMinutes);
  const identityPart = identityName
    ? ` برای ساختن شخصیت «${identityName}»`
    : '';

  return `من ${taskPart} را در ساعت ${timePart} و در ${locationPart} به مدت ${durationPart} انجام خواهم داد${identityPart}.`;
}

/**
 * Compound 1% growth over N days.
 * (1 + 0.01)^days
 */
export function calculateCompound1Percent(days: number): { improvementPct: number; multiplier: number } {
  const multiplier = Math.pow(1.01, days);
  const improvementPct = Math.round((multiplier - 1) * 100);
  return {
    multiplier: parseFloat(multiplier.toFixed(2)),
    improvementPct,
  };
}

/**
 * Returns formatted date string YYYY-MM-DD in Tehran Solar Hijri calendar with optional offset in days.
 */
export function getTodayDateString(offsetDays = 0): string {
  return getTehranSolarDate(offsetDays).dateKey;
}

/**
 * Filters and sorts tasks by date and start time.
 */
export function filterTasksByDate(tasks: Task[], dateStr: string): Task[] {
  return tasks
    .filter((t) => t.date === dateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Habit Scorecard stats
 */
export function getHabitScorecardStats(habits: Habit[]): { positive: number; neutral: number; negative: number } {
  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const h of habits) {
    if (h.type === 'positive') positive++;
    else if (h.type === 'neutral') neutral++;
    else if (h.type === 'negative') negative++;
  }

  return { positive, neutral, negative };
}
