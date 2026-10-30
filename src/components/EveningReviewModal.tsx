import React, { useState } from 'react';
import { Task, Identity, EveningReminderConfig } from '../types/index.ts';
import { getTodayDateString } from '../utils/habitMath.ts';
import { sound } from '../utils/audio.ts';
import confetti from 'canvas-confetti';
import {
  Moon,
  Clock,
  MapPin,
  Sparkles,
  Bell,
  CheckCircle2,
  Plus,
  Volume2,
  Calendar,
  X,
  Award,
} from 'lucide-react';

interface EveningReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  identities: Identity[];
  eveningConfig: EveningReminderConfig;
  onUpdateEveningConfig: (newConfig: EveningReminderConfig) => void;
  onAddTask: (task: Task) => void;
  onOpenTaskModalForTomorrow: () => void;
}

export const EveningReviewModal: React.FC<EveningReviewModalProps> = ({
  isOpen,
  onClose,
  tasks,
  identities,
  eveningConfig,
  onUpdateEveningConfig,
  onAddTask,
  onOpenTaskModalForTomorrow,
}) => {
  const [activeStep, setActiveStep] = useState<'review' | 'tomorrow' | 'reminder'>('review');
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Quick tomorrow task fields
  const [tomorrowTitle, setTomorrowTitle] = useState('');
  const [tomorrowTime, setTomorrowTime] = useState('09:00');
  const [tomorrowLocation, setTomorrowLocation] = useState('دفتر کار');
  const [tomorrowIdentityId, setTomorrowIdentityId] = useState(
    identities.length > 0 ? identities[0].id : ''
  );

  if (!isOpen) return null;

  const todayStr = getTodayDateString(0);
  const tomorrowStr = getTodayDateString(1);

  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const tomorrowTasks = tasks.filter((t) => t.date === tomorrowStr);

  // Calculate today's identity votes
  const todayVotesByIdentity: Record<string, number> = {};
  for (const t of completedTodayTasks) {
    todayVotesByIdentity[t.identityId] = (todayVotesByIdentity[t.identityId] || 0) + 1;
  }

  const handleTestNotification = async () => {
    sound.playEveningReminder();

    if ('Notification' in window) {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        new Notification('یادآوری شبانه عادت‌های اتمی 🌙', {
          body: `ساعت ${eveningConfig.time} است! وقت آن رسیده تا با مشخص کردن زمان، مکان و هویت کارهای فردا، پیروزی فردای خود را تضمین کنید.`,
          icon: '/favicon.ico',
        });
      }
    }

    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 4000);
  };

  const handleQuickAddTomorrowTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tomorrowTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: tomorrowTitle.trim(),
      date: tomorrowStr,
      startTime: tomorrowTime,
      durationMinutes: 45,
      location: tomorrowLocation.trim() || 'مکان کار',
      identityId: tomorrowIdentityId || (identities[0]?.id ?? 'general'),
      completed: false,
      priority: 'high',
    };

    onAddTask(newTask);
    setTomorrowTitle('');
    sound.playSuccessChime();
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  const handleFinishReview = () => {
    onUpdateEveningConfig({
      ...eveningConfig,
      lastCompletedDate: todayStr,
      reviewStreak: (eveningConfig.reviewStreak || 0) + 1,
    });
    sound.playSuccessChime();
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-[440px] max-h-[92vh] bg-slate-900 border border-indigo-500/30 rounded-t-[32px] sm:rounded-[32px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evening-review-title"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Moon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 id="evening-review-title" className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>برنامه‌ریزی شبانه برای فردا</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded-full font-mono">
                  {eveningConfig.time}
                </span>
              </h2>
              <p className="text-[11px] text-indigo-300/80">
                پیروزی فردا در آرامش و تصمیم‌گیری شب قبل ساخته می‌شود
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Steps Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveStep('review')}
            className={`py-2.5 text-center font-medium border-b-2 transition-all ${
              activeStep === 'review'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ۱. بازبینی امروز
          </button>
          <button
            onClick={() => setActiveStep('tomorrow')}
            className={`py-2.5 text-center font-medium border-b-2 transition-all ${
              activeStep === 'tomorrow'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ۲. برنامه فردا
          </button>
          <button
            onClick={() => setActiveStep('reminder')}
            className={`py-2.5 text-center font-medium border-b-2 transition-all ${
              activeStep === 'reminder'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ۳. تنظیم اعلان شبانه
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 flex-1 space-y-4 text-xs">
          {activeStep === 'review' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Today's achievements card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    کارهای انجام‌شده امروز
                  </span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {completedTodayTasks.length} از {todayTasks.length}
                  </span>
                </div>

                {todayTasks.length === 0 ? (
                  <p className="text-slate-400 text-xs py-2">برای امروز برنامه‌ای ثبت نشده بود.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {todayTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-2 rounded-xl border flex items-center justify-between ${
                          t.completed
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                            : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                        }`}
                      >
                        <span className={t.completed ? 'line-through text-slate-300' : ''}>
                          {t.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{t.startTime}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Votes Cast Today for Identities */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
                <h4 className="font-bold text-indigo-200 flex items-center gap-1.5 mb-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  آرای هویتی ثبت‌شده امروز:
                </h4>
                {Object.keys(todayVotesByIdentity).length === 0 ? (
                  <p className="text-slate-400 text-xs">
                    هنوز رأیی برای امروز ثبت نشده است. با اتمام کارها، آرای شخصیتی افزوده می‌شود!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(todayVotesByIdentity).map(([idKey, count]) => {
                      const idObj = identities.find((i) => i.id === idKey);
                      return (
                        <div
                          key={idKey}
                          className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between"
                        >
                          <span className="text-[11px] font-medium text-slate-200 truncate">
                            {idObj?.name || idKey}
                          </span>
                          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/30">
                            +{count} رأی
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveStep('tomorrow')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                <span>مرحله بعد: تنظیم برنامه فردا</span>
                <span>←</span>
              </button>
            </div>
          )}

          {activeStep === 'tomorrow' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    کارهای زمان‌بندی‌شده فردا: ({tomorrowTasks.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTaskModalForTomorrow();
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline"
                  >
                    فرم پیشرفته
                  </button>
                </div>

                {tomorrowTasks.length === 0 ? (
                  <p className="text-slate-400 text-xs py-1">
                    هنوز برای فردا برنامه‌ای تنظیم نکرده‌اید. با فرم سریع زیر اولین کار فردا را ثبت کنید!
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {tomorrowTasks.map((t) => {
                      const idObj = identities.find((i) => i.id === t.identityId);
                      return (
                        <div
                          key={t.id}
                          className="p-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-slate-200 text-xs">{t.title}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-emerald-400" />
                                {t.startTime}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-rose-400" />
                                {t.location}
                              </span>
                              <span className="text-indigo-300">{idObj?.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fast Tomorrow Task Add Form */}
              <form
                onSubmit={handleQuickAddTomorrowTask}
                className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-200 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    افزودن سریع کار برای فردا
                  </span>
                  <span className="text-[10px] text-indigo-300/80">زمان، مکان، هویت</span>
                </div>

                <input
                  type="text"
                  required
                  placeholder="عنوان کار (مثلاً: تمرین تنفس صبحگاهی)"
                  value={tomorrowTitle}
                  onChange={(e) => setTomorrowTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500 text-xs"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">ساعت اجرا:</label>
                    <input
                      type="time"
                      value={tomorrowTime}
                      onChange={(e) => setTomorrowTime(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-center font-mono outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">مکان اجرا:</label>
                    <input
                      type="text"
                      placeholder="مثلاً: اتاق خواب، باشگاه"
                      value={tomorrowLocation}
                      onChange={(e) => setTomorrowLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    برای تقویت چه شخصیتی؟
                  </label>
                  <select
                    value={tomorrowIdentityId}
                    onChange={(e) => setTomorrowIdentityId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none text-xs"
                  >
                    {identities.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ثبت این کار برای فردا</span>
                </button>
              </form>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveStep('review')}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
                >
                  بازگشت
                </button>
                <button
                  onClick={() => setActiveStep('reminder')}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1"
                >
                  <span>تنظیم یادآوری شبانه</span>
                  <span>←</span>
                </button>
              </div>
            </div>
          )}

          {activeStep === 'reminder' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-slate-200 text-xs">فعال بودن یادآوری شبانه</span>
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
                    className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1.5 font-medium">
                    ساعت اعلان یادآوری هر شب:
                  </label>
                  <input
                    type="time"
                    value={eveningConfig.time}
                    onChange={(e) =>
                      onUpdateEveningConfig({
                        ...eveningConfig,
                        time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-center font-mono text-base outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    بهترین زمان: ۳۰ تا ۶۰ دقیقه قبل از خواب برای تخلیه ذهن و آرامش شبانه
                  </p>
                </div>

                {/* Sound Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                    پخش زنگ یادآوری ملایم
                  </span>
                  <input
                    type="checkbox"
                    checked={eveningConfig.soundEnabled}
                    onChange={(e) =>
                      onUpdateEveningConfig({
                        ...eveningConfig,
                        soundEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-indigo-500 rounded"
                  />
                </div>
              </div>

              {/* Notification Test Action */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">تست اعلان و زنگ شبانه</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    وب نوتیفیکیشن
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  با فشردن دکمه زیر می‌توانید صدای زنگ ملایم شبانه و ارسال اعلان مرور برنامه را امتحان کنید.
                </p>

                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 text-indigo-400" />
                  <span>تست زنگ و ارسال اعلان</span>
                </button>

                {testNotificationSent && (
                  <p className="text-center text-[11px] text-emerald-400 animate-in fade-in">
                    ✓ اعلان آزمایشی و زنگ شبانه پخش شد!
                  </p>
                )}
              </div>

              {/* Final Complete Review Button */}
              <button
                type="button"
                onClick={handleFinishReview}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>تکمیل برنامه‌ریزی شبانه و آماده‌سازی فردا</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            زنجیره برنامه‌ریزی شبانه: {eveningConfig.reviewStreak || 0} شب متوالی
          </span>
          <button onClick={onClose} className="hover:text-slate-200 text-xs">
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
