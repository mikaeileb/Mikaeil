import React, { useState } from 'react';
import { Task, Habit, Identity } from '../types/index.ts';
import { calculateCompound1Percent } from '../utils/habitMath.ts';
import { TrendingUp, Sparkles, BookOpen, Download, RotateCcw } from 'lucide-react';

interface AnalyticsViewProps {
  tasks: Task[];
  habits: Habit[];
  identities: Identity[];
  onResetData: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tasks,
  habits,
  identities,
  onResetData,
}) => {
  const [sliderDays, setSliderDays] = useState(30);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalHabitsCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const totalVotesCast = completedTasks + totalHabitsCompletions;

  const compoundResult = calculateCompound1Percent(sliderDays);

  const handleExportData = () => {
    const data = {
      tasks,
      habits,
      identities,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atomic-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4">
      {/* 1% Better Everyday Rule */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-100">قانون ۱٪ بهبود روزانه (رشد مرکب)</h2>
            <p className="text-[11px] text-emerald-300/80">اثر شگفت‌انگیز مداومت در عادات کوچک</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          «اگر هر روز فقط ۱٪ بهتر شوید، در پایان یک سال ۳۷ برابر قوی‌تر و داناتر خواهید بود. برعکس، اگر هر روز ۱٪ افت کنید، تقریباً به صفر می‌رسید!»
        </div>

        {/* Interactive compound simulator */}
        <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">مدت مداومت:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {sliderDays} روز مداومت
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={365}
            value={sliderDays}
            onChange={(e) => setSliderDays(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="grid grid-cols-2 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 block mb-0.5">ضریب رشد توانمندی:</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">
                {compoundResult.multiplier} برابر
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 block mb-0.5">درصد بهبود خالص:</span>
              <span className="text-base font-extrabold text-amber-400 font-mono">
                +{compoundResult.improvementPct}٪
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Performance Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-base font-bold text-amber-400 font-mono block">{totalVotesCast}</span>
          <span className="text-[10px] text-slate-400 font-medium">کل آرای هویتی</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-base font-bold text-emerald-400 font-mono block">{completedTasks}</span>
          <span className="text-[10px] text-slate-400 font-medium">کارهای انجام‌شده</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <span className="text-base font-bold text-indigo-400 font-mono block">{habits.length}</span>
          <span className="text-[10px] text-slate-400 font-medium">عادت‌های فعال</span>
        </div>
      </div>

      {/* 4 Laws of Behavior Change Cheatsheet */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-xs text-slate-200">
            خلاصه ۴ قانون تغییر رفتار در کتاب عادت‌های اتمی
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
              ۱
            </span>
            <div>
              <span className="font-bold text-emerald-300">آن را آشکار کنید (نیت اجرا):</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                دقیقاً مشخص کنید در چه ساعتی و در چه مکانی کار را انجام می‌دهید.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
              ۲
            </span>
            <div>
              <span className="font-bold text-indigo-300">آن را جذاب کنید (انباشت عادت):</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                عادت جدید را بلافاصله بعد از یک عادت لذت‌بخش یا تثبیت‌شده قبلی انجام دهید.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
              ۳
            </span>
            <div>
              <span className="font-bold text-amber-300">آن را ساده کنید (قانون دو دقیقه):</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                نسخه اولیه هر عادت را آن‌قدر کوچک کنید که شروع آن کمتر از ۲ دقیقه طول بکشد.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
              ۴
            </span>
            <div>
              <span className="font-bold text-rose-300">آن را رضایت‌بخش کنید (آرای شخصیتی):</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                دیدن اضافه شدن یک رأی به صندوق شخصیتی که می‌خواهید بسازید، پاداش فوری مغز شماست.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings / Export Data */}
      <div className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <button
          onClick={handleExportData}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>پشتیبان‌گیری (JSON)</span>
        </button>

        <button
          onClick={onResetData}
          className="flex items-center gap-1.5 text-xs text-rose-400/80 hover:text-rose-300 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>بازنشانی داده‌های اولیه</span>
        </button>
      </div>
    </div>
  );
};
