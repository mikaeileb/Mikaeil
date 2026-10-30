export interface Identity {
  id: string;
  name: string;
  description: string;
  color: string; // e.g., 'emerald', 'indigo', 'amber', 'rose', 'sky', 'teal'
  icon: string; // Lucide icon name
  targetVotes: number;
  motto?: string; // شعار هویتی
  createdAt?: string;
}

export type HabitType = 'positive' | 'neutral' | 'negative';

export interface Habit {
  id: string;
  title: string;
  identityId: string;
  type: HabitType; // Atomic habits scorecard: +, =, -
  targetTime?: string;
  targetLocation?: string;
  durationMinutes?: number;
  habitStackAfter?: string; // e.g., "بعد از مسواک زدن"
  twoMinuteVersion?: string; // e.g., "خواندن فقط ۱ صفحه"
  completedDates: string[]; // ['2026-10-28', '2026-10-29', '2026-10-30']
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string;
  durationMinutes: number; // e.g. 45 or 90
  location: string; // e.g. "اتاق کار", "باشگاه", "کتابخانه"
  identityId: string; // Who does this action make you?
  completed: boolean;
  completedAt?: string;
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
  remindMinutesBefore?: number; // 0, 10, 15, 30 min reminder
}

export type NotificationChannel =
  | 'browser_notification'
  | 'sound'
  | 'vibration'
  | 'in_app_modal';

export interface EveningReminderConfig {
  enabled: boolean;
  time: string; // HH:mm, default "21:30"
  notificationChannels: NotificationChannel[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  browserNotificationEnabled: boolean;
  inAppModalEnabled: boolean;
  taskAdvanceReminderMinutes: number; // 0, 10, 15, 30
  lastCompletedDate?: string;
  reviewStreak: number;
}

export type AmbientSoundType =
  | 'rain'
  | 'cafe'
  | 'forest'
  | 'waves'
  | 'fireplace'
  | 'brown_noise';

export interface AmbientSoundConfig {
  enabled: boolean;
  activeSound: AmbientSoundType;
  volume: number; // 0 to 1
  autoPlayOnTask: boolean;
}

export interface UserProfile {
  name: string;
  title?: string;
  avatar: string;
  bio: string;
  joinedDate: string;
  primaryIdentityId?: string;
  ambientSoundConfig?: AmbientSoundConfig;
}

export interface ChallengeBadge {
  id: string;
  challengeId: string;
  title: string;
  subtitle: string;
  icon: string; // e.g. 'Award', 'Trophy', 'Crown', 'Flame'
  unlockedAt: string; // ISO date
  unlockedDateSolar: string; // Tehran solar date string
  habitTitle: string;
  identityName: string;
  quote: string;
}

export interface ThirtyDayChallenge {
  id: string;
  title: string;
  habitId: string;
  identityId: string;
  startDate: string; // YYYY-MM-DD
  targetDays: number; // 30
  completedDates: string[]; // ['2026-10-28', ...]
  status: 'active' | 'completed' | 'abandoned';
  notes?: string;
  badge?: ChallengeBadge;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  type: 'reminder' | 'identity_vote' | 'task_alert';
  read: boolean;
}

