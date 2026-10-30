import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  Calendar,
  Share2,
  Zap,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  X,
  Target,
  Repeat,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThirtyDayChallenge, ChallengeBadge, Habit, Identity, UserProfile } from '../types/index.ts';
import {
  calculateChallengeProgress,
  generateChallengeDays,
  getChallengeMilestones,
  toggleChallengeDate,
  addDaysToDateKey,
} from '../utils/challengeUtils.ts';
import { getTehranSolarDate } from '../utils/tehranTime.ts';
import { sound } from '../utils/audio.ts';

interface ThirtyDayChallengeViewProps {
  challenges: ThirtyDayChallenge[];
  habits: Habit[];
  identities: Identity[];
  userProfile: UserProfile;
  onUpdateChallenges: (challenges: ThirtyDayChallenge[]) => void;
  onOpenCreateHabit?: () => void;
}

export const ThirtyDayChallengeView: React.FC<ThirtyDayChallengeViewProps> = ({
  challenges,
  habits,
  identities,
  userProfile,
  onUpdateChallenges,
}) => {
  const tehranToday = getTehranSolarDate(0);
  const todayKey = tehranToday.dateKey;

  // Selected active challenge
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(() => {
    return challenges.length > 0 ? challenges[0].id : '';
  });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<ChallengeBadge | null>(null);

  // New challenge form state
  const [newHabitId, setNewHabitId] = useState<string>(() => habits[0]?.id || '');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newStartDate, setNewStartDate] = useState<string>(todayKey);

  const currentChallenge =
    challenges.find((c) => c.id === selectedChallengeId) || challenges[0] || null;

  const currentHabit = currentChallenge
    ? habits.find((h) => h.id === currentChallenge.habitId)
    : null;
  const currentIdentity = currentChallenge
    ? identities.find((i) => i.id === currentChallenge.identityId)
    : null;

  const progress = currentChallenge
    ? calculateChallengeProgress(
        currentChallenge.completedDates.length,
        currentChallenge.targetDays || 30
      )
    : null;

  const dayNodes = currentChallenge ? generateChallengeDays(currentChallenge, todayKey) : [];
  const milestones = currentChallenge
    ? getChallengeMilestones(currentChallenge.completedDates.length)
    : [];

  // Fire celebratory fireworks confetti
  const triggerConfettiExplosion = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // ignore
    }
  };

  // Day toggle handler
  const handleToggleDay = (dateKey: string) => {
    if (!currentChallenge) return;

    sound.playClick();
    const habitTitle = currentHabit?.title || 'عادت هدف';
    const identityName = currentIdentity?.name || 'هویت من';

    const { updatedChallenge, newlyCompleted } = toggleChallengeDate(
      currentChallenge,
      dateKey,
      habitTitle,
      identityName,
      tehranToday.fullDateLabel
    );

    if (newlyCompleted) {
      sound.playSuccessChime();
      triggerConfettiExplosion();
      if (updatedChallenge.badge) {
        setSelectedBadge(updatedChallenge.badge);
      }
    }

    const updatedList = challenges.map((c) =>
      c.id === updatedChallenge.id ? updatedChallenge : c
    );
    onUpdateChallenges(updatedList);
  };

  // Create new challenge
  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitId) return;

    const habit = habits.find((h) => h.id === newHabitId);
    if (!habit) return;

    const identity = identities.find((i) => i.id === habit.identityId) || identities[0];
    const title = newTitle.trim() || `چالش ۳۰ روزه ${habit.title}`;

    const newChallenge: ThirtyDayChallenge = {
      id: `challenge-${Date.now()}`,
      title,
      habitId: habit.id,
      identityId: identity.id,
      startDate: newStartDate || todayKey,
      targetDays: 30,
      completedDates: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      notes: `چالش اختصاصی ۳۰ روزه در راستای ساخت هویت «${identity.name}».`,
    };

    const updatedList = [newChallenge, ...challenges];
    onUpdateChallenges(updatedList);
    setSelectedChallengeId(newChallenge.id);
    setCreateModalOpen(false);
    setNewTitle('');
    sound.playSuccessChime();
  };

  // All earned badges across challenges
  const allEarnedBadges: ChallengeBadge[] = challenges
    .filter((c) => c.badge !== undefined)
    .map((c) => c.badge!);

  return (
    <div className="p-4 space-y-5 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              چالش‌های ۳۰ روزه عادت‌های اتمی
            </h2>
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              تثبیت هویت
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            با ۳۰ روز تمرکز و استمرار، رفتارهای کوچک را به هویت ماندگار خود تبدیل کنید.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>چالش جدید</span>
        </button>
      </div>

      {/* Challenge Selector Tabs if more than 1 challenge exists */}
      {challenges.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {challenges.map((c) => {
            const isSelected = c.id === (currentChallenge?.id || '');
            const cProg = calculateChallengeProgress(c.completedDates.length, c.targetDays);
            return (
              <button
                key={c.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedChallengeId(c.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 border transition ${
                  isSelected
                    ? 'bg-slate-800 border-amber-500/60 text-amber-300 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {c.status === 'completed' ? (
                  <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span>{c.title}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({cProg.completedCount}/{c.targetDays})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State when no challenge exists */}
      {(!currentChallenge || challenges.length === 0) && (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Trophy className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">هیچ چالشی هنوز تعریف نشده است</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
              یکی از عادات مهم خود را انتخاب کنید و چالش ۳۰ روزه را برای تثبیت هویت و کسب نشان
              افتخار آغاز کنید.
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            شروع اولین چالش ۳۰ روزه
          </button>
        </div>
      )}

      {/* Main Active Challenge Graphic View */}
      {currentChallenge && progress && (
        <div className="space-y-4">
          {/* Main Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 p-5 shadow-xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Badges */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    عادت: {currentHabit?.title || 'عادت هدف'}
                  </span>
                  <span className="text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    هویت: {currentIdentity?.name || 'هویت من'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-100 pt-1">
                  {currentChallenge.title}
                </h3>
              </div>

              {/* Status Badge */}
              {currentChallenge.status === 'completed' ? (
                <button
                  onClick={() => currentChallenge.badge && setSelectedBadge(currentChallenge.badge)}
                  className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 active:scale-95 transition"
                >
                  <Trophy className="w-4 h-4 stroke-[2.5]" />
                  <span>مشاهده مدال افتخار</span>
                </button>
              ) : (
                <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
                  روز {progress.completedCount} از ۳۰
                </div>
              )}
            </div>

            {/* Progress Meter with Compound Interest Metric */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 relative z-10">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  روند پیشرفت اتمی:
                  <strong className="text-emerald-400 font-extrabold text-sm">
                    {progress.percent}٪
                  </strong>
                </span>

                <span className="text-[11px] text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  انباشت ۱٪ رشد: {progress.compoundMultiplier}
                </span>
              </div>

              {/* Graphical Progress Bar */}
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-500 shadow-sm"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                <span>آغاز: {currentChallenge.startDate}</span>
                <span>باقی‌مانده: {progress.remainingDays} روز تا نشان افتخار</span>
              </div>
            </div>
          </div>

          {/* Special 30-Day Graphical Matrix / Heatmap */}
          <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                شبکه ۳۰ روزه اجرای پیوسته (با کلیک وضعیت روز را ثبت کنید)
              </h4>
              <span className="text-[10px] text-slate-400">
                {progress.completedCount} از ۳۰ تیک خورده
              </span>
            </div>

            {/* Matrix Grid: 5 rows x 6 columns (or 6x5) */}
            <div className="grid grid-cols-6 gap-2 pt-1">
              {dayNodes.map((node) => {
                const isSelectedForToday = node.isToday;
                return (
                  <button
                    key={node.dayNumber}
                    onClick={() => handleToggleDay(node.dateKey)}
                    title={`روز ${node.dayNumber}: ${node.dateKey} - ${
                      node.isCompleted ? 'تکمیل شده' : 'ناتمام'
                    }`}
                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1 border transition-all duration-200 active:scale-95 ${
                      node.isCompleted
                        ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20'
                        : isSelectedForToday
                        ? 'bg-amber-500/10 border-amber-400/80 text-amber-300 ring-2 ring-amber-400/30 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {/* Checkmark or Circle */}
                    {node.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                    ) : isSelectedForToday ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 flex items-center justify-center animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      </div>
                    ) : (
                      <Circle className="w-3 h-3 text-slate-600 stroke-[1.5]" />
                    )}

                    {/* Day Number */}
                    <span className="text-[10px] font-bold mt-1 tracking-tight">
                      {node.dayNumber}
                    </span>

                    {/* Today indicator pip */}
                    {isSelectedForToday && (
                      <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-slate-950 font-black px-1 rounded-full shadow">
                        امروز
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-around pt-2 text-[10px] text-slate-400 border-t border-slate-800/80">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/40 border border-emerald-500" />
                تکمیل شده
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-md bg-amber-500/20 border border-amber-400" />
                امروز (فعال)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-md bg-slate-950 border border-slate-800" />
                در انتظار اجرا
              </span>
            </div>
          </div>

          {/* Milestones Pathway */}
          <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              مراحل چهارگانه تثبیت عصبی طبق کتاب عادت‌های اتمی
            </h4>

            <div className="space-y-2">
              {milestones.map((m) => (
                <div
                  key={m.day}
                  className={`p-3 rounded-2xl border flex items-start gap-3 transition ${
                    m.achieved
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      m.achieved
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {m.achieved ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <span className="text-xs font-mono font-bold">{m.day}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-slate-200 flex items-center gap-1">
                        روز {m.day}: {m.title}
                      </h5>
                      {m.achieved && (
                        <span className="text-[10px] text-emerald-400 font-semibold">فتح شد ✓</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Honor Badges Gallery (تالار افتخارات و مدال‌های ۳۰ روزه) */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-sm text-slate-100">تالار نشان‌های افتخار ۳۰ روزه</h3>
          </div>
          <span className="text-xs font-bold text-amber-300">
            {allEarnedBadges.length} نشان کسب شده
          </span>
        </div>

        {allEarnedBadges.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400">
            هنوز نشانی کسب نشده است. با اتمام اولین چالش ۳۰ روزه، نشان طلایی افتخار دگرگونی اتمی شما
            در اینجا ثبت و گواهی‌نامه اختصاصی دریافت خواهید کرد.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allEarnedBadges.map((badge) => (
              <div
                key={badge.id}
                onClick={() => {
                  sound.playSuccessChime();
                  setSelectedBadge(badge);
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/40 hover:border-amber-400 cursor-pointer shadow-lg shadow-amber-500/10 flex items-center gap-3 transition active:scale-95"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md shadow-amber-500/30 shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-amber-400">
                    <Trophy className="w-6 h-6 stroke-[2]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-xs text-amber-200 truncate">{badge.title}</h4>
                  <p className="text-[11px] text-slate-300 truncate">{badge.habitTitle}</p>
                  <span className="text-[10px] text-amber-400/80 block mt-0.5">
                    فتح در تاریخ: {badge.unlockedDateSolar}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Honor Certificate Modal (گواهی‌نامه افتخار دگرگونی اتمی) */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl shadow-amber-500/20 text-center"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Trophy Medal */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-1 shadow-2xl shadow-amber-500/40">
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-amber-400">
                <Trophy className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
                گواهی‌نامه افتخار ۳۰ روزه
              </span>
              <h3 className="text-lg font-black text-slate-100 pt-2">{selectedBadge.title}</h3>
              <p className="text-xs text-amber-300 font-medium">{selectedBadge.subtitle}</p>
            </div>

            {/* Certificate Details Box */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-right space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">اهدا شده به:</span>
                <span className="font-bold text-slate-100">{userProfile.name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">عادت اتمی فتح شده:</span>
                <span className="font-bold text-emerald-400">{selectedBadge.habitTitle}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">هویت تثبیت شده:</span>
                <span className="font-bold text-indigo-400">{selectedBadge.identityName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">تاریخ ثبت افتخار:</span>
                <span className="font-mono text-amber-300">{selectedBadge.unlockedDateSolar}</span>
              </div>
            </div>

            {/* Atomic Habits Quote */}
            <p className="mt-4 text-xs italic text-slate-400 leading-relaxed px-2">
              «{selectedBadge.quote}»
              <span className="block text-[10px] text-amber-400/80 mt-1 font-semibold">
                — جیمز کلیر، عادت‌های اتمی
              </span>
            </p>

            {/* Action buttons */}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  triggerConfettiExplosion();
                  sound.playSuccessChime();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                شادی و پرتاب فشفشه!
              </button>
              <button
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New 30-Day Challenge Modal */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                تعریف چالش جدید ۳۰ روزه
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="mt-4 space-y-4">
              {/* Select Habit */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  انتخاب عادت برای چالش ۳۰ روزه:
                </label>
                <select
                  value={newHabitId}
                  onChange={(e) => {
                    setNewHabitId(e.target.value);
                    const selected = habits.find((h) => h.id === e.target.value);
                    if (selected && !newTitle) {
                      setNewTitle(`چالش ۳۰ روزه ${selected.title}`);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="" disabled>
                    یک عادت را انتخاب کنید...
                  </option>
                  {habits.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title} (هویت: {identities.find((i) => i.id === h.identityId)?.name || 'ناشناس'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Challenge Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  عنوان چالش (اختیاری):
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثلاً: چالش ۳۰ روزه مطالعه کتاب پیش از خواب"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  تاریخ شروع:
                </label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  تاریخ پیش‌فرض: امروز ({tehranToday.fullDateLabel})
                </span>
              </div>

              {/* Motivational Atomic Habit Note */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
                🎯 <strong>نکته اتمی:</strong> با تکمیل ۳۰ روز پیوسته، رفتار به روتین ناخودآگاه مغز
                تبدیل می‌شود و نشان افتخار دگرگونی اتمی دریافت خواهید کرد.
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                >
                  ایجاد و ثبت چالش
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
