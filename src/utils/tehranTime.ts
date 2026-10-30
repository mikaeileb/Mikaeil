/**
 * Tehran (Asia/Tehran) Time and Persian Solar Hijri (Shamsi) Date Utilities.
 */

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const FARSI_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(val: number | string): string {
  return String(val).replace(/[0-9]/g, (w) => FARSI_DIGITS[+w]);
}

/**
 * Returns Tehran local time formatted as HH:mm (24-hour).
 */
export function getTehranTime(date: Date = new Date()): { hours: string; minutes: string; time24: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hours = parts.find((p) => p.type === 'hour')?.value || '00';
  const minutes = parts.find((p) => p.type === 'minute')?.value || '00';

  return {
    hours,
    minutes,
    time24: `${hours}:${minutes}`,
  };
}

/**
 * Returns Tehran Persian Solar Date info with optional offset in days.
 */
export function getTehranSolarDate(offsetDays = 0): {
  year: number;
  month: number;
  day: number;
  dateKey: string; // YYYY-MM-DD in Shamsi (e.g. 1405-08-08)
  persianDateKey: string; // ۱۴۰۵-۰۸-۰۸
  monthName: string;
  weekdayName: string;
  fullDateLabel: string; // e.g. "جمعه، ۸ آبان ۱۴۰۵"
} {
  const targetDate = new Date();
  if (offsetDays !== 0) {
    targetDate.setDate(targetDate.getDate() + offsetDays);
  }

  // Extract Solar Hijri parts
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
  }).formatToParts(targetDate);

  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1405', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);

  const weekdayPart = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    weekday: 'long',
  }).format(targetDate);

  const monthName = PERSIAN_MONTHS[month - 1] || 'آبان';
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  const dateKey = `${year}-${monthStr}-${dayStr}`;
  const persianDateKey = toPersianDigits(dateKey);

  const fullDateLabel = `${weekdayPart}، ${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;

  return {
    year,
    month,
    day,
    dateKey,
    persianDateKey,
    monthName,
    weekdayName: weekdayPart,
    fullDateLabel,
  };
}

/**
 * Returns formatted label for dateKey (e.g. "امروز: جمعه، ۸ آبان" or "فردا: شنبه، ۹ آبان")
 */
export function formatTehranDateKey(dateKey: string): string {
  const todayInfo = getTehranSolarDate(0);
  const tomorrowInfo = getTehranSolarDate(1);
  const yesterdayInfo = getTehranSolarDate(-1);

  if (dateKey === todayInfo.dateKey) {
    return `امروز (${todayInfo.fullDateLabel})`;
  }
  if (dateKey === tomorrowInfo.dateKey) {
    return `فردا (${tomorrowInfo.fullDateLabel})`;
  }
  if (dateKey === yesterdayInfo.dateKey) {
    return `دیروز (${yesterdayInfo.fullDateLabel})`;
  }

  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const monthName = PERSIAN_MONTHS[m - 1] || '';
  return `${toPersianDigits(d)} ${monthName} ${toPersianDigits(y)}`;
}
