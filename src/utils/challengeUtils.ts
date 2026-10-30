import { ThirtyDayChallenge, ChallengeBadge, Habit, Identity } from '../types/index.ts';

export interface ChallengeProgressResult {
  percent: number;
  completedCount: number;
  remainingDays: number;
  isCompleted: boolean;
  compoundMultiplier: string; // e.g. "1.35x"
}

export interface DayNode {
  dayNumber: number; // 1 to 30
  dateKey: string; // YYYY-MM-DD
  isCompleted: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface ChallengeMilestone {
  day: number;
  title: string;
  description: string;
  achieved: boolean;
  icon: string;
}

/**
 * Calculates challenge completion progress and stats.
 */
export function calculateChallengeProgress(
  completedCount: number,
  targetDays: number = 30
): ChallengeProgressResult {
  const safeTarget = Math.max(1, targetDays);
  const count = Math.max(0, completedCount);
  const percent = Math.min(100, Math.round((count / safeTarget) * 100));
  const remainingDays = Math.max(0, safeTarget - count);
  const isCompleted = count >= safeTarget;

  // Atomic Habits compound formula: (1.01)^days
  const compound = Math.pow(1.01, count).toFixed(2);

  return {
    percent,
    completedCount: count,
    remainingDays,
    isCompleted,
    compoundMultiplier: `${compound}x`,
  };
}

/**
 * Add days to a YYYY-MM-DD date string using pure date math
 */
export function addDaysToDateKey(dateKey: string, daysToAdd: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generates the full 30-day node grid for visual presentation.
 */
export function generateChallengeDays(
  challenge: ThirtyDayChallenge,
  todayDateKey: string
): DayNode[] {
  const nodes: DayNode[] = [];
  const target = challenge.targetDays || 30;

  for (let i = 0; i < target; i++) {
    const dayNumber = i + 1;
    const dateKey = addDaysToDateKey(challenge.startDate, i);
    const isCompleted = challenge.completedDates.includes(dateKey);
    const isToday = dateKey === todayDateKey;
    const isPast = dateKey < todayDateKey;
    const isFuture = dateKey > todayDateKey;

    nodes.push({
      dayNumber,
      dateKey,
      isCompleted,
      isToday,
      isPast,
      isFuture,
    });
  }

  return nodes;
}

/**
 * Milestone breakdown along the 30-day journey based on James Clear's Atomic Habits.
 */
export function getChallengeMilestones(completedCount: number): ChallengeMilestone[] {
  return [
    {
      day: 7,
      title: 'شکست مقاومت اولیه',
      description: 'گذر از ۷ روز نخست و شروع تشکیل شیار عصبی در مغز',
      achieved: completedCount >= 7,
      icon: 'Zap',
    },
    {
      day: 14,
      title: 'تثبیت ریتم روزانه',
      description: 'کاهش اصطکاک رفتاری و سازگار شدن با زمان و مکان اجرای عادت',
      achieved: completedCount >= 14,
      icon: 'Flame',
    },
    {
      day: 21,
      title: 'پایه‌ریزی ناخودآگاه',
      description: 'تبدیل کنش ارادی به الگوی ناخودآگاه و اتوماتیک روزمره',
      achieved: completedCount >= 21,
      icon: 'ShieldCheck',
    },
    {
      day: 30,
      title: 'تثبیت هویت و فتح افتخار',
      description: '۳۰ رای قاطع به هویت جدید و دریافت نشان افتخار دگرگونی اتمی',
      achieved: completedCount >= 30,
      icon: 'Award',
    },
  ];
}

/**
 * Creates a unique Badge of Honor when a challenge reaches 30 days.
 */
export function createHonorBadge(
  challenge: ThirtyDayChallenge,
  habitTitle: string,
  identityName: string,
  solarDateStr: string = 'امروز'
): ChallengeBadge {
  return {
    id: `badge-${challenge.id}-${Date.now()}`,
    challengeId: challenge.id,
    title: 'نشان افتخار دگرگونی اتمی',
    subtitle: `فاتح ۳۰ روز پیوستگی در «${habitTitle}»`,
    icon: 'Trophy',
    unlockedAt: new Date().toISOString(),
    unlockedDateSolar: solarDateStr,
    habitTitle,
    identityName,
    quote: 'هر اقدامی که انجام می‌دهید، رایی است به هویتی که می‌خواهید بسازید.',
  };
}

/**
 * Toggles a date completion in a challenge.
 * If 30 days are reached, automatically marks completed and grants badge.
 * If toggled down from 30, resets completed status.
 */
export function toggleChallengeDate(
  challenge: ThirtyDayChallenge,
  targetDateKey: string,
  habitTitle: string = 'عادت هدف',
  identityName: string = 'هویت من',
  solarDateStr: string = 'امروز'
): { updatedChallenge: ThirtyDayChallenge; newlyCompleted: boolean } {
  const isAlreadyCompleted = challenge.completedDates.includes(targetDateKey);
  const updatedDates = isAlreadyCompleted
    ? challenge.completedDates.filter((d) => d !== targetDateKey)
    : [...challenge.completedDates, targetDateKey];

  const target = challenge.targetDays || 30;
  const isNowCompleted = updatedDates.length >= target;
  const wasAlreadyCompleted = challenge.status === 'completed';

  const newlyCompleted = !wasAlreadyCompleted && isNowCompleted;

  let badge = challenge.badge;
  if (isNowCompleted && !badge) {
    badge = createHonorBadge(challenge, habitTitle, identityName, solarDateStr);
  }

  const updatedChallenge: ThirtyDayChallenge = {
    ...challenge,
    completedDates: updatedDates,
    status: isNowCompleted ? 'completed' : 'active',
    badge: isNowCompleted ? badge : challenge.badge,
  };

  return {
    updatedChallenge,
    newlyCompleted,
  };
}

/**
 * Generates an initial 30-day challenge if none exists.
 */
export function createInitialChallenge(
  habit: Habit,
  identity: Identity,
  startDateKey: string
): ThirtyDayChallenge {
  return {
    id: `challenge-${Date.now()}`,
    title: `چالش ۳۰ روزه ${habit.title}`,
    habitId: habit.id,
    identityId: identity.id,
    startDate: startDateKey,
    targetDays: 30,
    completedDates: habit.completedDates.slice(0, 14), // Seed with past progress
    status: 'active',
    notes: `هدف: تثبیت هویت «${identity.name}» با اجرای روزانه «${habit.title}» به مدت ۳۰ روز پیوسته.`,
    createdAt: new Date().toISOString(),
  };
}
