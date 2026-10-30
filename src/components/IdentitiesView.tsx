import React, { useState } from 'react';
import { Identity, Task, Habit } from '../types/index.ts';
import { calculateIdentityVotes } from '../utils/habitMath.ts';
import { UserCheck, Plus, Sparkles, Award, Shield, Check, X } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface IdentitiesViewProps {
  identities: Identity[];
  tasks: Task[];
  habits: Habit[];
  onAddIdentity: (identity: Identity) => void;
}

export const IdentitiesView: React.FC<IdentitiesViewProps> = ({
  identities,
  tasks,
  habits,
  onAddIdentity,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetVotes, setTargetVotes] = useState(50);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newIdentity: Identity = {
      id: `id-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'هویت متعهد و پیگیر',
      color: 'emerald',
      icon: 'UserCheck',
      targetVotes: Number(targetVotes) || 50,
    };

    onAddIdentity(newIdentity);
    setName('');
    setDescription('');
    setShowAddModal(false);
    sound.playSuccessChime();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Identity Concept Header Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-purple-950/40 to-slate-900 border border-indigo-500/30 shadow-lg space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
            <UserCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-100">هویت‌ها و صندوق آرای شخصیتی</h2>
            <p className="text-[11px] text-indigo-300/80">
              «عادت‌ها بازتاب‌دهنده هویت شما هستند» — جیمز کلیر
            </p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <p className="font-medium text-amber-300 mb-1">اصل اساسی کتاب عادت‌های اتمی:</p>
          هدف این نیست که فقط کتاب بخوانید، هدف این است که «کتاب‌خوان» شوید. هدف این نیست که ماراتن بدوید، بلکه این است که «یک دونده» شوید.
          هر کاری که در طول روز برنامه‌ریزی و کامل می‌کنید، یک رأی در صندوق این شخصیت می‌اندازد!
        </div>
      </div>

      {/* Identities List Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-400" />
          <span>شخصیت‌های در حال شکل‌گیری ({identities.length})</span>
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1 shadow-md shadow-indigo-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تعریف هویت جدید</span>
        </button>
      </div>

      {/* Identity Cards */}
      <div className="space-y-3">
        {identities.map((identity) => {
          const votes = calculateIdentityVotes(identity.id, tasks, habits);
          const target = identity.targetVotes || 50;
          const progress = Math.min(100, Math.round((votes / target) * 100));

          // Level calculation:
          // Level 1: 0-15 votes (آغازگر)
          // Level 2: 16-35 votes (در حال تثبیت)
          // Level 3: 36-50 votes (نهادینه‌شده)
          // Level 4: 50+ votes (هویت ماندگار)
          const levelName =
            votes >= 50
              ? 'هویت پایدار و اصیل'
              : votes >= 30
              ? 'در حال نهادینه‌سازی'
              : votes >= 10
              ? 'در حال تثبیت روزانه'
              : 'شروع مسیر هویت‌سازی';

          return (
            <div
              key={identity.id}
              className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3 transition-all hover:border-indigo-500/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30 shrink-0">
                    <Shield className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{identity.name}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {identity.description}
                    </p>
                  </div>
                </div>

                {/* Vote Count Badge */}
                <div className="text-center bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-2xl shrink-0">
                  <span className="font-extrabold text-base text-amber-400 font-mono block leading-none">
                    {votes}
                  </span>
                  <span className="text-[9px] text-indigo-300 font-medium">رأی ثبت‌شده</span>
                </div>
              </div>

              {/* Progress & Milestone */}
              <div className="space-y-1.5 bg-slate-800/40 p-2.5 rounded-2xl border border-slate-700/50">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    وضعیت: {levelName}
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {votes} / {target} ({progress}٪)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Identity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-[440px] bg-slate-900 border border-slate-800 rounded-t-[32px] sm:rounded-[32px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                تعریف هویت شخصیتی جدید
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  می‌خواهید چه نوع انسانی باشید؟ (نام هویت)
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: برنامه‌نویس مسلط، انسان صبور، نویسنده خلاق"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  توصیف این شخصیت:
                </label>
                <textarea
                  rows={2}
                  placeholder="مثلاً: کسی که کارها را بدون بهانه‌تراشی شروع می‌کند و تا پایان متعهد می‌ماند."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  هدف اولیه تعداد آرا:
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={targetVotes}
                  onChange={(e) => setTargetVotes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ثبت هویت شخصیتی</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
