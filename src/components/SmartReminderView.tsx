import React, { useState } from 'react';
import { EveningReminderConfig } from '../types/index.ts';
import { sound } from '../utils/audio.ts';
import {
  Bell,
  Moon,
  Clock,
  Volume2,
  Smartphone,
  CheckCircle2,
  Sparkles,
  Layers,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SmartReminderViewProps {
  eveningConfig: EveningReminderConfig;
  onUpdateEveningConfig: (newConfig: EveningReminderConfig) => void;
  onOpenEveningReview: () => void;
}

export const SmartReminderView: React.FC<SmartReminderViewProps> = ({
  eveningConfig,
  onUpdateEveningConfig,
  onOpenEveningReview,
}) => {
  const [testSent, setTestSent] = useState(false);

  const toggleChannel = (
    channel: 'browser_notification' | 'sound' | 'vibration' | 'in_app_modal'
  ) => {
    const current = eveningConfig.notificationChannels || [];
    const exists = current.includes(channel);
    const updated = exists
      ? current.filter((c) => c !== channel)
      : [...current, channel];

    onUpdateEveningConfig({
      ...eveningConfig,
      notificationChannels: updated,
      browserNotificationEnabled: updated.includes('browser_notification'),
      soundEnabled: updated.includes('sound'),
      vibrationEnabled: updated.includes('vibration'),
      inAppModalEnabled: updated.includes('in_app_modal'),
    });
  };

  const handleTestAllNotifications = async () => {
    // 1. Sound
    if (eveningConfig.soundEnabled) {
      sound.playEveningReminder();
    }

    // 2. Vibration
    if (eveningConfig.vibrationEnabled) {
      sound.triggerVibration([250, 100, 250]);
    }

    // 3. Web Notification
    if (eveningConfig.browserNotificationEnabled && 'Notification' in window) {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }
      if (perm === 'granted') {
        new Notification('سیستم یادآوری هوشمند اتمیک پلنر 🌙', {
          body: `ساعت ${eveningConfig.time} است! وقت آن است برنامه فردا را با مشخص کردن ساعت، مکان، مدت و هویت خود تنظیم کنید.`,
          icon: '/favicon.ico',
        });
      }
    }

    setTestSent(true);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
    setTimeout(() => setTestSent(false), 4500);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Smart Reminder Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-purple-950/40 to-slate-900 border border-indigo-500/30 shadow-lg space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
            <Moon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-100">سیستم یادآوری هوشمند</h2>
            <p className="text-[11px] text-indigo-300/80">
              یادآوری شب قبل برای تنظیم دقیق برنامه و وظایف روز بعد
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
          جیمز کلیر در کتاب عادت‌های اتمی تأکید می‌کند: تصمیم‌گیری برای کارهای فردا در همان صبح، انرژی اراده شما را هدر می‌دهد. با تنظیم برنامه از شب قبل، روز خود را بدون تردید و با تمرکز آغاز کنید.
        </p>
      </div>

      {/* Main Switch & Time Configuration */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs text-slate-100">
              فعال‌سازی یادآوری شب قبل برای برنامه فردا
            </span>
          </div>
          <input
            type="checkbox"
            checked={eveningConfig.enabled}
            onChange={(e) =>
              onUpdateEveningConfig({
                ...eveningConfig,
                enabled: e.target.checked,
              })
            }
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
          />
        </div>

        {/* Time Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>ساعت ارسال یادآوری در هر شب:</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">به وقت رسمی تهران</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={eveningConfig.time}
              onChange={(e) =>
                onUpdateEveningConfig({
                  ...eveningConfig,
                  time: e.target.value,
                })
              }
              className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 font-mono text-base outline-none focus:border-indigo-500 flex-1 text-center"
            />
            {/* Quick Presets */}
            {['21:00', '21:30', '22:00'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  onUpdateEveningConfig({
                    ...eveningConfig,
                    time: preset,
                  })
                }
                className={`px-2.5 py-2 rounded-xl text-xs font-mono border transition-all ${
                  eveningConfig.time === preset
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            توصیه: ۳۰ الی ۶۰ دقیقه پیش از خواب جهت کاهش بار ذهنی و آرامش شبانه
          </span>
        </div>
      </div>

      {/* Notification Types / Channels */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <h3 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>تنظیم انواع اعلان‌ها و کانال‌های هشدار:</span>
        </h3>

        <div className="space-y-2">
          {/* Channel 1: Browser/System Push */}
          <div
            onClick={() => toggleChannel('browser_notification')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              eveningConfig.browserNotificationEnabled
                ? 'bg-indigo-500/10 border-indigo-500/40 text-slate-100'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs block">اعلان متنی سیستم و مرورگر (Web Push)</span>
                <span className="text-[10px] text-slate-400">
                  ارسال پیام هشدار روی صفحه گوشی یا دسکتاپ
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              readOnly
              checked={eveningConfig.browserNotificationEnabled}
              className="w-4 h-4 accent-indigo-500 rounded"
            />
          </div>

          {/* Channel 2: Sound Chime */}
          <div
            onClick={() => toggleChannel('sound')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              eveningConfig.soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-100'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs block">پخش زنگ صوتی ملایم شبانه</span>
                <span className="text-[10px] text-slate-400">
                  صدای زنگ پیانویی سنتز شده با Web Audio
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              readOnly
              checked={eveningConfig.soundEnabled}
              className="w-4 h-4 accent-emerald-500 rounded"
            />
          </div>

          {/* Channel 3: Android Vibration */}
          <div
            onClick={() => toggleChannel('vibration')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              eveningConfig.vibrationEnabled
                ? 'bg-purple-500/10 border-purple-500/40 text-slate-100'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs block">ویبره و لرزش ملایم (Android Vibration)</span>
                <span className="text-[10px] text-slate-400">
                  الگوی لرزش در دستگاه‌های اندرویدی
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              readOnly
              checked={eveningConfig.vibrationEnabled}
              className="w-4 h-4 accent-purple-500 rounded"
            />
          </div>

          {/* Channel 4: In-App Interactive Modal */}
          <div
            onClick={() => toggleChannel('in_app_modal')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              eveningConfig.inAppModalEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs block">پنجره تعاملی برنامه‌ریزی شبانه</span>
                <span className="text-[10px] text-slate-400">
                  نمایش فرم مرور امروز و ثبت سریع ۳ کار مهم فردا
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              readOnly
              checked={eveningConfig.inAppModalEnabled}
              className="w-4 h-4 accent-amber-500 rounded"
            />
          </div>
        </div>
      </div>

      {/* Task Advance Reminders */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
        <label className="block text-xs font-bold text-slate-200">
          یادآوری قبل از موعد هر وظیفه روزانه:
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 10, 15, 30].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() =>
                onUpdateEveningConfig({
                  ...eveningConfig,
                  taskAdvanceReminderMinutes: mins,
                })
              }
              className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                eveningConfig.taskAdvanceReminderMinutes === mins
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {mins === 0 ? 'بدون هشدار' : `${mins} دقیقه قبل`}
            </button>
          ))}
        </div>
      </div>

      {/* Test Notification and Launch Planning */}
      <div className="space-y-2 pt-1">
        <button
          onClick={handleTestAllNotifications}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>تست زنده سیستم اعلان (صدا، ویبره و پیام)</span>
        </button>

        {testSent && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center animate-in fade-in flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>هشدار تستی با موفقیت اجرا شد!</span>
          </div>
        )}

        <button
          onClick={onOpenEveningReview}
          className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs border border-slate-700 flex items-center justify-center gap-2"
        >
          <Moon className="w-4 h-4 text-indigo-400" />
          <span>ورود مستقیم به فرم برنامه‌ریزی شبانه برای فردا</span>
        </button>
      </div>
    </div>
  );
};
