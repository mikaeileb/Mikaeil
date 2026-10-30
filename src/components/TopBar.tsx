import React, { useState } from 'react';
import { Bell, Sparkles, Moon, Quote, Download } from 'lucide-react';
import { ATOMIC_HABITS_QUOTES } from '../data/initialData.ts';
import { EveningReminderConfig } from '../types/index.ts';
import { getTehranSolarDate } from '../utils/tehranTime.ts';

interface TopBarProps {
  eveningConfig: EveningReminderConfig;
  onOpenEveningReview: () => void;
  onOpenInstallModal: () => void;
  unreadCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  eveningConfig,
  onOpenEveningReview,
  onOpenInstallModal,
  unreadCount = 1,
}) => {
  const [showQuote, setShowQuote] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const cycleQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % ATOMIC_HABITS_QUOTES.length);
    setShowQuote(true);
  };

  const currentQuote = ATOMIC_HABITS_QUOTES[quoteIndex];
  const tehranToday = getTehranSolarDate(0);

  return (
    <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* App Logo & Title */}
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="لوگوی اتمیک پلنر"
            className="w-10 h-10 rounded-2xl ring-2 ring-emerald-500/40 object-cover shadow-lg shadow-emerald-500/20"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base text-slate-100 tracking-tight">اتمیک پلنر</h1>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                تهران
              </span>
            </div>
            <p className="text-[11px] text-emerald-400/90 font-medium">
              {tehranToday.fullDateLabel}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* Install App Button */}
          <button
            onClick={onOpenInstallModal}
            aria-label="نصب برنامه روی گوشی"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold shadow-sm transition active:scale-95"
            title="راهنما و نصب مستقیم برنامه روی گوشی"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
            <span>نصب</span>
          </button>

          {/* Quote Button */}
          <button
            onClick={cycleQuote}
            aria-label="نمایش گزینه‌گویی از کتاب عادت‌های اتمی"
            className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
            title="نکته طلایی عادت‌های اتمی"
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* Night-before Planning Reminder Button */}
          <button
            onClick={onOpenEveningReview}
            aria-label="یادآوری شبانه برای تنظیم برنامه فردا"
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all text-xs font-medium"
            title="تنظیم برنامه فردا و یادآوری شبانه"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-medium hidden xs:inline">یادآوری شبانه</span>
            <span className="text-[10px] font-mono bg-indigo-500/30 px-1 py-0.2 rounded text-indigo-200">
              {eveningConfig.time}
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenEveningReview}
            aria-label="اعلان‌ها و یادآوری‌ها"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {eveningConfig.enabled && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
            )}
          </button>
        </div>
      </div>

      {/* Quote Banner dropdown / toggle */}
      {showQuote && (
        <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 relative animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-200 leading-relaxed font-medium">
                  «{currentQuote.quote}»
                </p>
                <span className="text-[10px] text-amber-400/80 block mt-1">
                  — {currentQuote.author}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowQuote(false)}
              aria-label="بستن نقل‌قول"
              className="text-amber-400/60 hover:text-amber-300 text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
