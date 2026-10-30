import { AmbientSoundType, AmbientSoundConfig } from '../types/index.ts';

export interface AmbientSoundMeta {
  id: AmbientSoundType;
  persianName: string;
  subtitle: string;
  description: string;
  iconName: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  benefit: string;
}

export const AMBIENT_SOUNDS_CATALOG: AmbientSoundMeta[] = [
  {
    id: 'rain',
    persianName: 'باران ملایم و دلنشین',
    subtitle: 'قطرات باران روی شیشه',
    description: 'صدای ممتد و آرامش‌بخش بارش باران برای پوشاندن صداهای مزاحم محیط و ایجاد تمرکز پایدار.',
    iconName: 'CloudRain',
    emoji: '🌧️',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    benefit: 'مناسب برای مطالعه کتاب و نوشتن برنامه',
  },
  {
    id: 'cafe',
    persianName: 'کافه دنج و پرانرژی',
    subtitle: 'زمزمه دلنشین و فنجان قهوه',
    description: 'فضای صمیمی یک کافه با همهمه دلپذیر در پس‌زمینه و صدای نرم فنجان‌های قهوه برای افزایش خلاقیت.',
    iconName: 'Coffee',
    emoji: '☕',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    benefit: 'مناسب برای کارهای فکری، ایده‌پردازی و طراحی',
  },
  {
    id: 'forest',
    persianName: 'جنگل، نسیم و پرندگان',
    subtitle: 'آوای طبیعت و خش‌خش برگ‌ها',
    description: 'ترکیب نسیم ملایم در میان درختان و آواز دوردست پرندگان برای کاهش استرس و ذهن‌آگاهی.',
    iconName: 'Trees',
    emoji: '🌲',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    benefit: 'ایده‌آل برای کاهش اضطراب و شروع پرانرژی روز',
  },
  {
    id: 'waves',
    persianName: 'امواج آرام‌بخش ساحل',
    subtitle: 'جزر و مد ریتمیک دریا',
    description: 'ریتم متناوب و آرام‌بخش برخورد موج‌های دریا با ساحل شنی که تنفس و ضربان قلب را منظم می‌کند.',
    iconName: 'Waves',
    emoji: '🌊',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    benefit: 'مناسب برای تفکر عمیق و مرور شبانه عملکرد',
  },
  {
    id: 'fireplace',
    persianName: 'آتش هیزمی و شومینه',
    subtitle: 'گرما و ترق‌ترق چوب بلوط',
    description: 'صدای سوختن چوب در آتش شومینه با جرقه‌های گاه‌به‌گاه، ایجاد حس امنیت، گرما و تمرکز در خلوت.',
    iconName: 'Flame',
    emoji: '🔥',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    benefit: 'ایجاد انگیزه در شب‌ها و هنگام کار در سکوت',
  },
  {
    id: 'brown_noise',
    persianName: 'نویز قهوه‌ای عمیق',
    subtitle: 'فرکانس بم متراکم (Deep Focus)',
    description: 'صدای نویز ملایم و عمیق فرکانس پایین، برترین صدای علمی اثبات‌شده برای مسدود کردن کامل حواس‌پرتی.',
    iconName: 'Headphones',
    emoji: '🎧',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    benefit: 'حداکثر تمرکز برای کارهای دشوار تحلیلی و برنامه‌نویسی',
  },
];

export const DEFAULT_AMBIENT_CONFIG: AmbientSoundConfig = {
  enabled: true,
  activeSound: 'rain',
  volume: 0.65,
  autoPlayOnTask: true,
};

export function clampVolume(volume: number): number {
  if (isNaN(volume)) return 0.5;
  return Math.max(0, Math.min(1, Math.round(volume * 100) / 100));
}

export function formatVolumePercent(volume: number): string {
  const percent = Math.round(clampVolume(volume) * 100);
  return `${percent}٪`;
}

export function isValidSoundType(type: string): type is AmbientSoundType {
  return AMBIENT_SOUNDS_CATALOG.some((s) => s.id === type);
}

export function getSoundMeta(type: AmbientSoundType): AmbientSoundMeta {
  const found = AMBIENT_SOUNDS_CATALOG.find((s) => s.id === type);
  return found || AMBIENT_SOUNDS_CATALOG[0];
}
