import React, { useState } from 'react';
import { Task, Identity } from '../types/index.ts';
import { getTodayDateString, getImplementationFormula } from '../utils/habitMath.ts';
import { getTehranSolarDate, toPersianDigits } from '../utils/tehranTime.ts';
import { X, Clock, MapPin, User, Sparkles, Check, Plus, Trash2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  initialTask?: Task | null;
  identities: Identity[];
  onAddNewIdentity: (name: string, description: string) => string;
  defaultDate?: string;
}

const COMMON_LOCATIONS = [
  'اتاق خواب',
  'پشت میز کار',
  'باشگاه ورزشی',
  'کتابخانه',
  'کافه کتاب',
  'دفتر شرکت',
  'آشپزخانه',
];

const COMMON_DURATIONS = [15, 30, 45, 60, 90, 120];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  identities,
  onAddNewIdentity,
  defaultDate,
}) => {
  const todayInfo = getTehranSolarDate(0);
  const tomorrowInfo = getTehranSolarDate(1);
  const today = todayInfo.dateKey;
  const tomorrow = tomorrowInfo.dateKey;

  const [title, setTitle] = useState(initialTask?.title || '');
  const [date, setDate] = useState(initialTask?.date || defaultDate || today);
  const [startTime, setStartTime] = useState(initialTask?.startTime || '08:00');
  const [durationMinutes, setDurationMinutes] = useState(initialTask?.durationMinutes || 45);
  const [location, setLocation] = useState(initialTask?.location || '');
  const [identityId, setIdentityId] = useState(
    initialTask?.identityId || (identities.length > 0 ? identities[0].id : '')
  );
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(
    initialTask?.priority || 'medium'
  );
  const [remindMinutesBefore, setRemindMinutesBefore] = useState<number>(
    initialTask?.remindMinutesBefore ?? 15
  );
  const [notes, setNotes] = useState(initialTask?.notes || '');

  // Add custom identity inline state
  const [showAddIdentity, setShowAddIdentity] = useState(false);
  const [newIdentityName, setNewIdentityName] = useState('');
  const [newIdentityDesc, setNewIdentityDesc] = useState('');

  if (!isOpen) return null;

  const selectedIdentity = identities.find((i) => i.id === identityId);

  const handleCreateCustomIdentity = () => {
    if (!newIdentityName.trim()) return;
    const newId = onAddNewIdentity(newIdentityName.trim(), newIdentityDesc.trim());
    setIdentityId(newId);
    setNewIdentityName('');
    setNewIdentityDesc('');
    setShowAddIdentity(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const task: Task = {
      id: initialTask?.id || `task-${Date.now()}`,
      title: title.trim(),
      date,
      startTime,
      durationMinutes,
      location: location.trim() || 'مکان دلخواه',
      identityId: identityId || (identities[0]?.id ?? 'general'),
      completed: initialTask?.completed || false,
      completedAt: initialTask?.completedAt,
      priority,
      remindMinutesBefore,
      notes: notes.trim() || undefined,
    };

    onSave(task);
    onClose();
  };

  const liveFormula = getImplementationFormula(
    title,
    startTime,
    location,
    durationMinutes,
    selectedIdentity?.name
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-[440px] max-h-[90vh] bg-slate-900 border border-slate-800 rounded-t-[32px] sm:rounded-[32px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-title" className="font-bold text-base text-slate-100">
                {initialTask ? 'ویرایش برنامه‌ریزی' : 'برنامه‌ریزی کار با تعیین هویت'}
              </h2>
              <p className="text-[11px] text-slate-400">قانون نیت اجرا در کتاب عادت‌های اتمی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن پنجره"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1 text-sm">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
              عنوان کار یا رفتار <span className="text-rose-400">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: تمرین تنفس عمیق، مطالعه فصل ۵، جلسه استراتژی"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Date Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">تاریخ اجرا (تقویم هجری شمسی)</span>
              <span className="text-[11px] text-emerald-400 font-mono">به وقت تهران</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDate(today)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${
                  date === today
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>امروز</span>
                <span className="text-[10px] opacity-80">
                  {toPersianDigits(todayInfo.day)} {todayInfo.monthName}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDate(tomorrow)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${
                  date === tomorrow
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>فردا (شب قبل)</span>
                <span className="text-[10px] opacity-80">
                  {toPersianDigits(tomorrowInfo.day)} {tomorrowInfo.monthName}
                </span>
              </button>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-time" className="block text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  ساعت شروع
                </span>
              </label>
              <input
                id="task-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-center font-mono outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="task-duration" className="block text-xs font-semibold text-slate-300 mb-1.5">
                مدت زمان (دقیقه)
              </label>
              <select
                id="task-duration"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 outline-none focus:border-emerald-500"
              >
                {COMMON_DURATIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} دقیقه
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="task-location" className="block text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                مکان انجام کار
              </span>
            </label>
            <input
              id="task-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="مثلاً: اتاق خواب، باشگاه، کتابخانه"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 mb-2"
            />
            {/* Quick Location Chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    location === loc
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-medium'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* THE CORE ATOMIC HABITS REQUIREMENT:
              "برای درست شدن چه شخصیتی اینکارو دارم میکنم" */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" />
                <span>برای ساختن چه شخصیتی این کار را می‌کنم؟</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddIdentity(!showAddIdentity)}
                className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1 underline underline-offset-2"
              >
                <Plus className="w-3 h-3" />
                {showAddIdentity ? 'انصراف' : 'هویت جدید'}
              </button>
            </div>

            <p className="text-[11px] text-indigo-300/80 mb-3 leading-relaxed">
              «هر بار که این کار را انجام می‌دهید، یک رأی به نفع این شخصیت در ذهن خود ثبت می‌کنید.»
            </p>

            {/* Custom identity creator inline */}
            {showAddIdentity && (
              <div className="p-3 mb-3 rounded-xl bg-slate-900/90 border border-indigo-500/40 space-y-2">
                <input
                  type="text"
                  placeholder="نام هویت (مثلاً: برنامه‌نویس خستگی‌ناپذیر)"
                  value={newIdentityName}
                  onChange={(e) => setNewIdentityName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-100 outline-none"
                />
                <input
                  type="text"
                  placeholder="توضیح کوتاه (مثلاً: کسی که هر روز یک مسئله را حل می‌کند)"
                  value={newIdentityDesc}
                  onChange={(e) => setNewIdentityDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-100 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateCustomIdentity}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
                >
                  ثبت هویت جدید
                </button>
              </div>
            )}

            {/* Identities Radio Selection */}
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {identities.map((item) => {
                const isSelected = item.id === identityId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setIdentityId(item.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-100 shadow-sm'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{item.description}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Implementation Intentions Preview Badge */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-500/30 text-xs space-y-1.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              فرمول قصد اجرای دقیق (کتاب عادت‌های اتمی):
            </span>
            <p className="text-slate-100 font-medium leading-relaxed text-[12px]">
              من <span className="text-emerald-300 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{title ? `«${title}»` : '[عنوان کار]'}</span> را در ساعت <span className="text-amber-300 font-bold font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{startTime || '[ساعت]'}</span> و در <span className="text-rose-300 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{location ? `«${location}»` : '[مکان]'}</span> به مدت <span className="text-cyan-300 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">{durationMinutes} دقیقه</span> انجام خواهم داد{selectedIdentity ? <> برای ساختن شخصیت <span className="text-indigo-300 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">«{selectedIdentity.name}»</span>.</> : '.'}
            </p>
          </div>

          {/* Advance Reminder Option */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              هشدار قبل از شروع این کار:
            </span>
            <select
              value={remindMinutesBefore}
              onChange={(e) => setRemindMinutesBefore(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 outline-none text-xs"
            >
              <option value={0}>بدون هشدار قبلی</option>
              <option value={10}>۱۰ دقیقه قبل</option>
              <option value={15}>۱۵ دقیقه قبل</option>
              <option value={30}>۳۰ دقیقه قبل</option>
            </select>
          </div>

          {/* Priority & Notes */}
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((p) => {
              const labels = { low: 'عادی', medium: 'مهم', high: 'اولویت بالا' };
              const colors = {
                low: 'border-slate-700 text-slate-300',
                medium: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
                high: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-1.5 text-xs rounded-xl border transition-all ${
                    priority === p ? colors[p] + ' font-bold' : 'border-slate-800 text-slate-500'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          <div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="یادداشت تکمیلی یا قانون ۲ دقیقه برای شروع..."
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs outline-none focus:border-emerald-500"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          {initialTask && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(initialTask.id);
                onClose();
              }}
              aria-label="حذف این کار"
              className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 mr-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{initialTask ? 'ذخیره تغییرات' : 'ثبت در برنامه'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
