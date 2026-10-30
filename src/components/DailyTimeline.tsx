import React, { useState, useEffect } from 'react';
import { Task, Identity, EveningReminderConfig, AmbientSoundConfig } from '../types/index.ts';
import {
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Moon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Headphones,
  Square,
} from 'lucide-react';
import { getTodayDateString, filterTasksByDate, getImplementationFormula } from '../utils/habitMath.ts';
import { sound } from '../utils/audio.ts';
import confetti from 'canvas-confetti';
import { getTehranSolarDate, formatTehranDateKey, toPersianDigits } from '../utils/tehranTime.ts';
import { ambientAudio } from '../utils/ambientAudio.ts';
import { getSoundMeta } from '../utils/ambientSounds.ts';

interface DailyTimelineProps {
  tasks: Task[];
  identities: Identity[];
  onToggleTaskComplete: (taskId: string) => void;
  onOpenTaskModal: (task?: Task, defaultDate?: string) => void;
  onOpenEveningReview: () => void;
  eveningConfig: EveningReminderConfig;
  currentDate: string;
  onDateChange: (newDate: string) => void;
  ambientSoundConfig?: AmbientSoundConfig;
}

export const DailyTimeline: React.FC<DailyTimelineProps> = ({
  tasks,
  identities,
  onToggleTaskComplete,
  onOpenTaskModal,
  onOpenEveningReview,
  eveningConfig,
  currentDate,
  onDateChange,
  ambientSoundConfig,
}) => {

  const tehranToday = getTehranSolarDate(0);
  const tehranTomorrow = getTehranSolarDate(1);
  const todayStr = tehranToday.dateKey;
  const tomorrowStr = tehranTomorrow.dateKey;

  const [filterState, setFilterState] = useState<'all' | 'pending' | 'completed'>('all');

  const dateTasks = filterTasksByDate(tasks, currentDate);
  const filteredTasks = dateTasks.filter((t) => {
    if (filterState === 'pending') return !t.completed;
    if (filterState === 'completed') return t.completed;
    return true;
  });

  const completedCount = dateTasks.filter((t) => t.completed).length;
  const totalCount = dateTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isToday = currentDate === todayStr;
  const isTomorrow = currentDate === tomorrowStr;

  const handleNextDay = () => {
    // Offset by +1 day from current date
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    onDateChange(`${yr}-${mo}-${da}`);
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    onDateChange(`${yr}-${mo}-${da}`);
  };

  const [ambientState, setAmbientState] = useState(() => ({
    isPlaying: ambientAudio.isPlaying(),
    activeSound: ambientAudio.getActiveSound(),
    activeTaskId: ambientAudio.getActiveTaskId(),
  }));

  useEffect(() => {
    const unsub = ambientAudio.subscribe((st) => {
      setAmbientState({
        isPlaying: st.isPlaying,
        activeSound: st.activeSound,
        activeTaskId: st.activeTaskId || null,
      });
    });
    return unsub;
  }, []);

  const handleToggleTaskFocusSound = (task: Task) => {
    if (ambientState.isPlaying && ambientState.activeTaskId === task.id) {
      ambientAudio.stop();
    } else {
      const soundType = ambientSoundConfig?.activeSound || 'rain';
      const vol = ambientSoundConfig?.volume ?? 0.65;
      ambientAudio.play(soundType, vol, task.id, task.title);
    }
  };

  const handleCheckTask = (task: Task) => {
    onToggleTaskComplete(task.id);
    if (!task.completed) {
      if (ambientState.activeTaskId === task.id) {
        ambientAudio.setActiveTask(null, null);
      }
      sound.playSuccessChime();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };


  return (
    <div className="p-4 space-y-4">
      {/* Date Switcher & Evening Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-3.5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevDay}
              aria-label="روز قبل"
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="font-bold text-sm text-slate-100 block">
                {isToday ? 'امروز' : isTomorrow ? 'فردا (شب قبل)' : formatTehranDateKey(currentDate)}
              </span>
              <span className="text-[11px] text-emerald-400 font-medium block">
                {isToday
                  ? tehranToday.fullDateLabel
                  : isTomorrow
                  ? tehranTomorrow.fullDateLabel
                  : formatTehranDateKey(currentDate)}
              </span>
            </div>
            <button
              onClick={handleNextDay}
              aria-label="روز بعد"
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDateChange(todayStr)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                isToday
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              امروز ({toPersianDigits(tehranToday.day)} {tehranToday.monthName})
            </button>
            <button
              onClick={() => onDateChange(tomorrowStr)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                isTomorrow
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              فردا ({toPersianDigits(tehranTomorrow.day)} {tehranTomorrow.monthName})
            </button>
          </div>
        </div>

        {/* Progress Bar of Daily Tasks */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>انجام کارهای روز:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {completedCount} از {totalCount} ({progressPercent}٪)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Night-before Planning Reminder Banner */}
        <div
          onClick={onOpenEveningReview}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/30 to-slate-900 border border-indigo-500/30 flex items-center justify-between cursor-pointer hover:border-indigo-400/60 transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-200">یادآوری شبانه برای برنامه فردا</p>
              <p className="text-[10px] text-indigo-300/80">
                هر شب ساعت {eveningConfig.time} • ثبت زمان، مکان و هویت
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-lg border border-indigo-500/30">
            تنظیم
          </span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setFilterState('all')}
            className={`px-2.5 py-1 rounded-xl transition-all ${
              filterState === 'all'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            همه ({dateTasks.length})
          </button>
          <button
            onClick={() => setFilterState('pending')}
            className={`px-2.5 py-1 rounded-xl transition-all ${
              filterState === 'pending'
                ? 'bg-slate-700 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            در انتظار ({dateTasks.filter((t) => !t.completed).length})
          </button>
          <button
            onClick={() => setFilterState('completed')}
            className={`px-2.5 py-1 rounded-xl transition-all ${
              filterState === 'completed'
                ? 'bg-slate-700 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            انجام‌شده ({completedCount})
          </button>
        </div>

        <button
          onClick={() => onOpenTaskModal(undefined, currentDate)}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>کار جدید</span>
        </button>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">
                کاری برای این تاریخ ثبت نشده است
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                بر اساس کتاب عادت‌های اتمی، با تعیین زمان، مکان و شخصیت مورد نظر، پایبندی خود را چند برابر کنید.
              </p>
            </div>
            <button
              onClick={() => onOpenTaskModal(undefined, currentDate)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن کار با زمان، مکان و هویت</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const identity = identities.find((i) => i.id === task.identityId);
            const formula = getImplementationFormula(
              task.title,
              task.startTime,
              task.location,
              task.durationMinutes,
              identity?.name
            );

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-3xl border transition-all duration-200 ${
                  task.completed
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                    : 'bg-slate-900/90 border-slate-800 shadow-md hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Complete Checkbox Button */}
                  <button
                    onClick={() => handleCheckTask(task)}
                    aria-label={task.completed ? 'علامت‌گذاری به عنوان انجام نشده' : 'علامت‌گذاری به عنوان انجام شده'}
                    className="mt-0.5 p-1 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors tap-highlight-transparent"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-500 hover:text-emerald-400" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={`font-bold text-sm text-slate-100 ${
                            task.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h3>

                        {/* Priority Badge */}
                        {task.priority === 'high' && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                            اولویت بالا
                          </span>
                        )}
                      </div>

                      {/* Time & Duration badge */}
                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{task.startTime}</span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          ({task.durationMinutes}د)
                        </span>
                      </div>
                    </div>

                    {/* Location Badge */}
                    <div className="flex items-center gap-1.5 text-xs text-rose-300">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="font-medium bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                        {task.location}
                      </span>
                    </div>

                    {/* CORE USER REQUEST: "برای درست شدن چه شخصیتی اینکارو دارم میکنم" */}
                    <div className="p-2.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-300 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          برای ساختن این هویت:
                        </span>
                        <span className="text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.2 rounded text-[10px]">
                          +۱ رأی شخصیتی
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-200">
                        {identity?.name || 'هویت تعریف‌شده'}
                      </p>
                      <p className="text-[10px] text-slate-400 italic leading-snug">
                        «{formula}»
                      </p>
                    </div>

                    {/* Task Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!task.completed && (
                          <button
                            type="button"
                            onClick={() => handleToggleTaskFocusSound(task)}
                            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl border transition-all ${
                              ambientState.isPlaying && ambientState.activeTaskId === task.id
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                : 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border-cyan-500/30'
                            }`}
                          >
                            {ambientState.isPlaying && ambientState.activeTaskId === task.id ? (
                              <>
                                <Square className="w-3 h-3 fill-current" />
                                <span>توقف صدای تمرکز</span>
                              </>
                            ) : (
                              <>
                                <Headphones className="w-3 h-3 text-cyan-400" />
                                <span>تمرکز با صدای محیطی</span>
                              </>
                            )}
                          </button>
                        )}

                        {task.notes && (
                          <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            یادداشت: {task.notes}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onOpenTaskModal(task)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline mr-auto shrink-0"
                      >
                        ویرایش
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) in Android Style */}
      <button
        onClick={() => onOpenTaskModal(undefined, currentDate)}
        aria-label="افزودن کار جدید با هویت و زمان‌بندی"
        className="fixed bottom-20 left-6 sm:left-auto sm:right-[calc(50%-180px)] z-20 w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};
