import React, { useState } from 'react';
import { Habit, Identity, HabitType } from '../types/index.ts';
import { calculateStreak, getHabitScorecardStats, getTodayDateString } from '../utils/habitMath.ts';
import { sound } from '../utils/audio.ts';
import confetti from 'canvas-confetti';
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  Layers,
  Zap,
  BookmarkCheck,
  X,
  HelpCircle,
} from 'lucide-react';

interface HabitsTrackerViewProps {
  habits: Habit[];
  identities: Identity[];
  onToggleHabitToday: (habitId: string) => void;
  onAddHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitsTrackerView: React.FC<HabitsTrackerViewProps> = ({
  habits,
  identities,
  onToggleHabitToday,
  onAddHabit,
  onDeleteHabit,
}) => {
  const todayStr = getTodayDateString(0);
  const [activeFilter, setActiveFilter] = useState<'all' | HabitType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScorecardHelp, setShowScorecardHelp] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [identityId, setIdentityId] = useState(identities[0]?.id || '');
  const [type, setType] = useState<HabitType>('positive');
  const [twoMinuteVersion, setTwoMinuteVersion] = useState('');
  const [habitStackAfter, setHabitStackAfter] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [targetTime, setTargetTime] = useState('08:00');

  const scorecardStats = getHabitScorecardStats(habits);

  const filteredHabits = habits.filter((h) => {
    if (activeFilter === 'all') return true;
    return h.type === activeFilter;
  });

  const handleCheckHabit = (habit: Habit) => {
    const isCompleted = habit.completedDates.includes(todayStr);
    onToggleHabitToday(habit.id);
    if (!isCompleted) {
      sound.playSuccessChime();
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.65 },
      });
    }
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: title.trim(),
      identityId: identityId || (identities[0]?.id ?? 'athlete'),
      type,
      targetTime: targetTime || undefined,
      targetLocation: targetLocation.trim() || undefined,
      habitStackAfter: habitStackAfter.trim() || undefined,
      twoMinuteVersion: twoMinuteVersion.trim() || undefined,
      completedDates: [],
    };

    onAddHabit(newHabit);
    setTitle('');
    setTwoMinuteVersion('');
    setHabitStackAfter('');
    setShowAddModal(false);
    sound.playSuccessChime();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Atomic Habits Header Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-100">بررسی و پیگیری عادات کوچک</h2>
              <p className="text-[11px] text-indigo-300/80">کارت امتیاز عادت‌ها و قانون ۲ دقیقه</p>
            </div>
          </div>
          <button
            onClick={() => setShowScorecardHelp(!showScorecardHelp)}
            aria-label="راهنمای کارت امتیاز عادت‌ها"
            className="p-1.5 rounded-full text-slate-400 hover:text-indigo-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Scorecard explanation drop */}
        {showScorecardHelp && (
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-1.5 animate-in fade-in">
            <p className="font-bold text-amber-300">کارت امتیاز عادت‌ها (Habit Scorecard):</p>
            <p className="leading-relaxed text-[11px]">
              جیمز کلیر می‌گوید: «تا زمانی که عادات خود را نامگذاری نکنید، نمی‌توانید آن‌ها را تغییر دهید.»
              عادت‌های مثبت (+) به شما در جهت شخصیتی که می‌خواهید کمک می‌کنند؛ عادت‌های خنثی (=) روتین‌های روزمره‌اند و عادت‌های منفی (-) مانع پیشرفت شما هستند.
            </p>
          </div>
        )}

        {/* Scorecard Stats summary */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => setActiveFilter(activeFilter === 'positive' ? 'all' : 'positive')}
            className={`p-2 rounded-2xl border text-center transition-all ${
              activeFilter === 'positive'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            <span className="text-sm font-extrabold text-emerald-400 font-mono block">
              +{scorecardStats.positive}
            </span>
            <span className="text-[10px] font-medium">عادت مثبت (+)</span>
          </button>

          <button
            onClick={() => setActiveFilter(activeFilter === 'neutral' ? 'all' : 'neutral')}
            className={`p-2 rounded-2xl border text-center transition-all ${
              activeFilter === 'neutral'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            <span className="text-sm font-extrabold text-amber-400 font-mono block">
              ={scorecardStats.neutral}
            </span>
            <span className="text-[10px] font-medium">عادت خنثی (=)</span>
          </button>

          <button
            onClick={() => setActiveFilter(activeFilter === 'negative' ? 'all' : 'negative')}
            className={`p-2 rounded-2xl border text-center transition-all ${
              activeFilter === 'negative'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            <span className="text-sm font-extrabold text-rose-400 font-mono block">
              -{scorecardStats.negative}
            </span>
            <span className="text-[10px] font-medium">عادت منفی (-)</span>
          </button>
        </div>
      </div>

      {/* Habits Header & Add Button */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <BookmarkCheck className="w-4 h-4 text-emerald-400" />
          <span>لیست عادات ({filteredHabits.length})</span>
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-1 shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تعریف عادت جدید</span>
        </button>
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {filteredHabits.length === 0 ? (
          <div className="py-10 text-center rounded-3xl border border-dashed border-slate-800 text-slate-500 space-y-2">
            <p className="text-xs">عادت ثبت‌شده‌ای با این فیلتر یافت نشد.</p>
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const isCompletedToday = habit.completedDates.includes(todayStr);
            const { current: streak } = calculateStreak(habit.completedDates, todayStr);
            const identity = identities.find((i) => i.id === habit.identityId);

            return (
              <div
                key={habit.id}
                className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5 transition-all hover:border-slate-750"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {/* Checkbox button */}
                    <button
                      onClick={() => handleCheckHabit(habit)}
                      aria-label={isCompletedToday ? 'علامت‌گذاری به عنوان انجام نشده امروز' : 'انجام این عادت برای امروز'}
                      className="mt-0.5 p-1 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {isCompletedToday ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-500 hover:text-emerald-400" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-1.5 py-0.2 rounded-md ${
                            habit.type === 'positive'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : habit.type === 'neutral'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {habit.type === 'positive' ? '+ مثبت' : habit.type === 'neutral' ? '= خنثی' : '- منفی'}
                        </span>
                        <h4
                          className={`text-sm font-bold text-slate-100 ${
                            isCompletedToday ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {habit.title}
                        </h4>
                      </div>

                      {/* Identity tag */}
                      <div className="text-[11px] text-indigo-300 font-medium flex items-center gap-1 mt-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>تقویت هویت: {identity?.name || 'عمومی'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Streak Flame Badge */}
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-xl border border-amber-400/30">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{streak} روز</span>
                  </div>
                </div>

                {/* Habit Stacking (انباشت عادت‌ها) */}
                {habit.habitStackAfter && (
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-1.5 text-xs text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-[10px] text-slate-400">انباشت عادت:</span>
                    <span className="text-[11px] font-medium text-indigo-200">
                      «{habit.habitStackAfter}»
                    </span>
                  </div>
                )}

                {/* 2-Minute Rule (قانون ۲ دقیقه) */}
                {habit.twoMinuteVersion && (
                  <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-1.5 text-xs text-emerald-200">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[10px] text-emerald-400 font-semibold">شروع ۲ دقیقه‌ای:</span>
                    <span className="text-[11px]">{habit.twoMinuteVersion}</span>
                  </div>
                )}

                {/* Footer with delete button */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500">
                  <span>تعداد دفعات انجام تا امروز: {habit.completedDates.length} بار</span>
                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    className="text-rose-400/70 hover:text-rose-300 underline"
                  >
                    حذف عادت
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-[440px] max-h-[90vh] bg-slate-900 border border-slate-800 rounded-t-[32px] sm:rounded-[32px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                تعریف عادت جدید بر مبنای کتاب عادت‌های اتمی
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="p-5 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان عادت</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: مطالعه ۱۰ صفحه کتاب، ورزش صبحگاهی"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Scorecard type (+, =, -) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نوع در کارت امتیاز عادت‌ها:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('positive')}
                    className={`py-2 rounded-xl border font-bold ${
                      type === 'positive'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    + مثبت
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('neutral')}
                    className={`py-2 rounded-xl border font-bold ${
                      type === 'neutral'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    = خنثی
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('negative')}
                    className={`py-2 rounded-xl border font-bold ${
                      type === 'negative'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    - منفی
                  </button>
                </div>
              </div>

              {/* Identity */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  برای تثبیت چه هویتی؟
                </label>
                <select
                  value={identityId}
                  onChange={(e) => setIdentityId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none"
                >
                  {identities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Habit Stacking */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  انباشت عادت (بعد از چه رفتاری انجام شود؟):
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: بعد از مسواک زدن شبانه"
                  value={habitStackAfter}
                  onChange={(e) => setHabitStackAfter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none"
                />
              </div>

              {/* 2-Minute Rule version */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  نسخه ۲ دقیقه‌ای (شروع بی‌نهایت آسان):
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: فقط پوشیدن کفش ورزشی یا خواندن یک پاراگراف"
                  value={twoMinuteVersion}
                  onChange={(e) => setTwoMinuteVersion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
              >
                ثبت عادت
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
