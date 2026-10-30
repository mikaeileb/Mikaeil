import { Identity, Habit, Task, EveningReminderConfig, UserProfile } from '../types/index.ts';
import { getTodayDateString } from '../utils/habitMath.ts';
import { getTehranSolarDate } from '../utils/tehranTime.ts';

export const ATOMIC_HABITS_QUOTES = [
  {
    quote: 'هر کاری که انجام می‌دهید، یک رأی به نفع نوع شخصیتی است که می‌خواهید به آن تبدیل شوید.',
    author: 'جیمز کلیر - کتاب عادت‌های اتمی',
  },
  {
    quote: 'شما به سطح اهداف خود صعود نمی‌کنید؛ بلکه به سطح سیستم‌های خود سقوط می‌کنید.',
    author: 'جیمز کلیر',
  },
  {
    quote: 'تغییرات کوچک و ۱ درصدی در طول زمان نتایج خارق‌العاده‌ای رقم می‌زنند.',
    author: 'جیمز کلیر',
  },
  {
    quote: 'افرادی که برنامه‌ریزی دقیقی برای زمان و مکان یک رفتار جدید دارند، احتمال عمل به آن چندین برابر بیشتر است.',
    author: 'قانون قصد و نیت اجرا (Implementation Intentions)',
  },
  {
    quote: 'وقتی یک عادت جدید را شروع می‌کنید، اجرای آن باید کمتر از ۲ دقیقه زمان ببرد.',
    author: 'قانون ۲ دقیقه جیمز کلیر',
  },
];

export const DEFAULT_IDENTITIES: Identity[] = [
  {
    id: 'athlete',
    name: 'ورزشکار پرانرژی و متعهد',
    description: 'شخصی که به سلامتی، تناسب اندام و شادابی تن خود احترام می‌گذارد.',
    color: 'emerald',
    icon: 'Activity',
    targetVotes: 50,
  },
  {
    id: 'scholar',
    name: 'کتاب‌خوان و پژوهشگر دانا',
    description: 'انسانی جستجوگر که هر روز با مطالعه و تأمل، دانایی خود را عمق می‌بخشد.',
    color: 'indigo',
    icon: 'BookOpen',
    targetVotes: 50,
  },
  {
    id: 'organized',
    name: 'فرد منظم و دقیق در تعهدات',
    description: 'شخصی باانضباط که ارزش زمان را می‌داند و به قول‌هایش وفا می‌کند.',
    color: 'amber',
    icon: 'CalendarCheck',
    targetVotes: 50,
  },
  {
    id: 'focused_creator',
    name: 'خالق و متخصص با تمرکز عمیق',
    description: 'فردی که به جای حواس‌پرتی، ساعت‌های کار عمیق و اثرگذار می‌آفریند.',
    color: 'sky',
    icon: 'Sparkles',
    targetVotes: 50,
  },
  {
    id: 'mindful',
    name: 'فرد آرام، صبور و هوشیار',
    description: 'انسانی متصل به لحظه حال که با آرامش و خونسردی تصمیم می‌گیرد.',
    color: 'rose',
    icon: 'Heart',
    targetVotes: 50,
  },
];

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'h1',
    title: 'مطالعه ۱۰ صفحه از کتاب عادت‌های اتمی',
    identityId: 'scholar',
    type: 'positive',
    targetTime: '16:30',
    targetLocation: 'میز مطالعه یا کافه کتاب',
    habitStackAfter: 'بعد از نوشیدن چای عصرانه',
    twoMinuteVersion: 'فقط باز کردن کتاب و خواندن ۲ پاراگراف',
    completedDates: [
      getTodayDateString(-3),
      getTodayDateString(-2),
      getTodayDateString(-1),
      getTodayDateString(0),
    ],
    notes: 'نشانه‌گذاری نکات جذاب در حاشیه کتاب',
  },
  {
    id: 'h2',
    title: '۲۰ دقیقه پیاده‌روی سریع و نرمش کششی',
    identityId: 'athlete',
    type: 'positive',
    targetTime: '07:30',
    targetLocation: 'پارک نزدیک منزل',
    habitStackAfter: 'بعد از بیدار شدن و نوشیدن یک لیوان آب',
    twoMinuteVersion: 'پوشیدن کفش ورزشی و ۵ حرکت کششی پایه‌ای',
    completedDates: [
      getTodayDateString(-2),
      getTodayDateString(-1),
      getTodayDateString(0),
    ],
  },
  {
    id: 'h3',
    title: 'تنظیم برنامه فردا در یادآوری شبانه',
    identityId: 'organized',
    type: 'positive',
    targetTime: '21:30',
    targetLocation: 'پشت میز اتاق خواب',
    habitStackAfter: 'بعد از مسواک زدن شبانه',
    twoMinuteVersion: 'مشخص کردن مهم‌ترین کار فردا در اپلیکیشن',
    completedDates: [
      getTodayDateString(-4),
      getTodayDateString(-3),
      getTodayDateString(-2),
      getTodayDateString(-1),
    ],
  },
  {
    id: 'h4',
    title: 'پیمایش بی‌هدف در شبکه‌های اجتماعی قبل از خواب',
    identityId: 'mindful',
    type: 'negative',
    targetTime: '23:00',
    targetLocation: 'تخت‌خواب',
    twoMinuteVersion: 'گذاشتن گوشی در حالت پرواز خارج از اتاق خواب',
    completedDates: [],
    notes: 'عادت منفی که باید سخت و نامرئی شود (قانون معکوس عادت‌ها)',
  },
];

export const getDefaultTasks = (): Task[] => {
  const today = getTehranSolarDate(0).dateKey;
  const tomorrow = getTehranSolarDate(1).dateKey;

  return [
    {
      id: 'task-1',
      title: 'پیاده‌روی و تمرین تنفس صبحگاهی',
      date: today,
      startTime: '07:30',
      endTime: '08:15',
      durationMinutes: 45,
      location: 'پارک محله',
      identityId: 'athlete',
      completed: true,
      completedAt: `${today}T08:15:00`,
      priority: 'high',
      notes: 'تنفس عمیق و دریافت نور خورشید اول صبح',
    },
    {
      id: 'task-2',
      title: 'جلسه بازبینی پیشرفت و کار عمیق روی پروژه',
      date: today,
      startTime: '10:00',
      endTime: '12:00',
      durationMinutes: 120,
      location: 'میز کار در شرکت',
      identityId: 'focused_creator',
      completed: true,
      completedAt: `${today}T12:05:00`,
      priority: 'high',
      notes: 'بستن تمام اعلان‌ها و تمرکز ۹۰ دقیقه‌ای بدون توقف',
    },
    {
      id: 'task-3',
      title: 'مطالعه فصل چهارم کتاب عادت‌های اتمی',
      date: today,
      startTime: '16:30',
      endTime: '17:15',
      durationMinutes: 45,
      location: 'میز مطالعه خانه',
      identityId: 'scholar',
      completed: false,
      priority: 'medium',
      notes: 'بررسی قانون دوم: آن را جذاب کنید',
    },
    {
      id: 'task-4',
      title: 'بررسی شبانه روز و تنظیم برنامه دقیق فردا',
      date: today,
      startTime: '21:30',
      endTime: '21:50',
      durationMinutes: 20,
      location: 'اتاق خواب / پشت میز',
      identityId: 'organized',
      completed: false,
      priority: 'high',
      notes: 'مرور آرای شخصیتی امروز و نیت‌های اجرایی فردا',
    },
    // Tomorrow tasks
    {
      id: 'task-5',
      title: 'تمرین قدرتی و بالاتنه',
      date: tomorrow,
      startTime: '07:00',
      endTime: '08:00',
      durationMinutes: 60,
      location: 'باشگاه ورزشی سلامت',
      identityId: 'athlete',
      completed: false,
      priority: 'high',
      notes: 'آماده کردن ساک ورزشی از شب قبل',
    },
    {
      id: 'task-6',
      title: 'طراحی معماری فیچر جدید نرم‌افزار',
      date: tomorrow,
      startTime: '09:30',
      endTime: '11:30',
      durationMinutes: 120,
      location: 'دفتر کار',
      identityId: 'focused_creator',
      completed: false,
      priority: 'high',
    },
    {
      id: 'task-7',
      title: 'خلاصه نویسی یادداشت‌های کتاب عادت‌های اتمی',
      date: tomorrow,
      startTime: '18:00',
      endTime: '18:45',
      durationMinutes: 45,
      location: 'کافه کتاب',
      identityId: 'scholar',
      completed: false,
      priority: 'medium',
    },
  ];
};

export const DEFAULT_EVENING_CONFIG: EveningReminderConfig = {
  enabled: true,
  time: '21:30',
  notificationChannels: ['browser_notification', 'sound', 'vibration', 'in_app_modal'],
  soundEnabled: true,
  vibrationEnabled: true,
  browserNotificationEnabled: true,
  inAppModalEnabled: true,
  taskAdvanceReminderMinutes: 15,
  reviewStreak: 5,
};

import { DEFAULT_AMBIENT_CONFIG } from '../utils/ambientSounds.ts';

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'علی کریمی',
  title: 'خواننده کتاب عادت‌های اتمی و سازنده سیستم شخصی',
  bio: 'هر روز با هر انتخاب کوچک، ۱ رأی به شخصیتی که می‌خواهم باشم می‌دهم.',
  avatar: '🌱',
  joinedDate: '۱۴۰۳/۰۸/۰۱',
  primaryIdentityId: 'scholar',
  ambientSoundConfig: DEFAULT_AMBIENT_CONFIG,
};

import { ThirtyDayChallenge } from '../types/index.ts';
import { addDaysToDateKey } from '../utils/challengeUtils.ts';

export const getDefaultChallenges = (): ThirtyDayChallenge[] => {
  const todayKey = getTehranSolarDate(0).dateKey;
  const startDayActive = addDaysToDateKey(todayKey, -16);
  const startDayCompleted = addDaysToDateKey(todayKey, -32);

  // 16 days completed for active challenge
  const activeCompletedDates = Array.from({ length: 16 }, (_, i) =>
    addDaysToDateKey(startDayActive, i)
  );

  // 30 days completed for completed challenge
  const finishedCompletedDates = Array.from({ length: 30 }, (_, i) =>
    addDaysToDateKey(startDayCompleted, i)
  );

  return [
    {
      id: 'challenge-reading',
      title: 'چالش ۳۰ روزه مطالعه کتاب پیش از خواب',
      habitId: 'h1',
      identityId: 'scholar',
      startDate: startDayActive,
      targetDays: 30,
      completedDates: activeCompletedDates,
      status: 'active',
      notes: 'هدف: تثبیت هویت «پژوهشگر عمیق» از طریق مطالعه روزانه ۲۰ صفحه از کتاب عادت‌های اتمی.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'challenge-fitness',
      title: 'چالش ۳۰ روزه ورزش و پیاده‌روی صبحگاهی',
      habitId: 'h2',
      identityId: 'athlete',
      startDate: startDayCompleted,
      targetDays: 30,
      completedDates: finishedCompletedDates,
      status: 'completed',
      badge: {
        id: 'badge-fitness-mastery',
        challengeId: 'challenge-fitness',
        title: 'نشان افتخار دگرگونی اتمی',
        subtitle: 'فاتح ۳۰ روز پیوستگی در «۲۰ دقیقه پیاده‌روی سریع و نرمش کششی»',
        icon: 'Trophy',
        unlockedAt: new Date().toISOString(),
        unlockedDateSolar: '۹ آبان ۱۴۰۵',
        habitTitle: '۲۰ دقیقه پیاده‌روی سریع و نرمش کششی',
        identityName: 'ورزشکار پرانرژی و متناسب',
        quote: 'هر اقدامی که انجام می‌دهید، رایی است به هویتی که می‌خواهید بسازید.',
      },
      notes: 'با موفقیت به پایان رسید و به عادت خودکار صبحگاهی تبدیل شد.',
      createdAt: new Date().toISOString(),
    },
  ];
};



