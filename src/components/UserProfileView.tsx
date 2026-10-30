import React, { useState } from 'react';
import { Identity, Task, Habit, UserProfile, AmbientSoundConfig } from '../types/index.ts';
import { calculateIdentityVotes } from '../utils/habitMath.ts';
import { AmbientSoundSettings } from './AmbientSoundSettings.tsx';
import { DEFAULT_AMBIENT_CONFIG } from '../utils/ambientSounds.ts';
import {
  User,
  Shield,
  Plus,
  Sparkles,
  Award,
  Edit2,
  Trash2,
  Check,
  X,
  Target,
  Download,
} from 'lucide-react';
import { sound } from '../utils/audio.ts';
import confetti from 'canvas-confetti';


interface UserProfileViewProps {
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  identities: Identity[];
  tasks: Task[];
  habits: Habit[];
  onAddIdentity: (identity: Identity) => void;
  onUpdateIdentity: (identity: Identity) => void;
  onDeleteIdentity: (identityId: string) => void;
  onOpenInstallModal?: () => void;
}

const AVATAR_OPTIONS = ['🌱', '🏃', '📚', '⚡', '🧘', '🚀', '🎯', '🎨', '🦁', '🦉'];

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  userProfile,
  onUpdateUserProfile,
  identities,
  tasks,
  habits,
  onAddIdentity,
  onUpdateIdentity,
  onDeleteIdentity,
  onOpenInstallModal,
}) => {
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(userProfile.name);
  const [profileTitle, setProfileTitle] = useState(userProfile.title);
  const [profileBio, setProfileBio] = useState(userProfile.bio);
  const [profileAvatar, setProfileAvatar] = useState(userProfile.avatar);

  // Identity Create / Edit
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
  const [idName, setIdName] = useState('');
  const [idDesc, setIdDesc] = useState('');
  const [idMotto, setIdMotto] = useState('');
  const [idColor, setIdColor] = useState('emerald');
  const [idTarget, setIdTarget] = useState(50);

  // Total votes cast across all personas
  const totalVotesAcrossAll = identities.reduce((acc, curr) => {
    return acc + calculateIdentityVotes(curr.id, tasks, habits);
  }, 0);

  const handleOpenNewIdentityModal = () => {
    setEditingIdentity(null);
    setIdName('');
    setIdDesc('');
    setIdMotto('');
    setIdColor('emerald');
    setIdTarget(50);
    setIdentityModalOpen(true);
  };

  const handleOpenEditIdentityModal = (item: Identity) => {
    setEditingIdentity(item);
    setIdName(item.name);
    setIdDesc(item.description);
    setIdMotto(item.motto || '');
    setIdColor(item.color || 'emerald');
    setIdTarget(item.targetVotes || 50);
    setIdentityModalOpen(true);
  };

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idName.trim()) return;

    if (editingIdentity) {
      // Update
      const updated: Identity = {
        ...editingIdentity,
        name: idName.trim(),
        description: idDesc.trim(),
        motto: idMotto.trim() || undefined,
        color: idColor,
        targetVotes: Number(idTarget) || 50,
      };
      onUpdateIdentity(updated);
    } else {
      // Create new
      const created: Identity = {
        id: `id-${Date.now()}`,
        name: idName.trim(),
        description: idDesc.trim(),
        motto: idMotto.trim() || undefined,
        color: idColor,
        icon: 'UserCheck',
        targetVotes: Number(idTarget) || 50,
        createdAt: new Date().toISOString(),
      };
      onAddIdentity(created);
    }

    setIdentityModalOpen(false);
    sound.playSuccessChime();
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile({
      ...userProfile,
      name: profileName.trim() || 'کاربر گرامی',
      title: profileTitle?.trim() || 'سازنده عادات اتمی',
      bio: profileBio.trim() || '',
      avatar: profileAvatar,
    });
    setIsEditingProfile(false);
    sound.playSuccessChime();
  };

  const handleUpdateAmbientConfig = (newConfig: AmbientSoundConfig) => {
    onUpdateUserProfile({
      ...userProfile,
      ambientSoundConfig: newConfig,
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* User Profile Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-3xl flex items-center justify-center border border-indigo-500/30 shadow-inner">
              {userProfile.avatar || '🌱'}
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-100 flex items-center gap-1.5">
                {userProfile.name}
              </h2>
              <p className="text-xs text-indigo-300/90 font-medium">{userProfile.title}</p>
              <span className="text-[10px] text-slate-400 font-mono">
                عضویت: {userProfile.joinedDate}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEditingProfile(true)}
            aria-label="ویرایش اطلاعات پروفایل"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {userProfile.bio && (
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 italic">
            «{userProfile.bio}»
          </p>
        )}

        {/* Total Votes in Profile */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-center text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-0.5">مجموع آرای هویتی ثبت‌شده</span>
            <span className="text-base font-extrabold text-amber-400 font-mono">
              {totalVotesAcrossAll} رأی
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-0.5">شخصیت‌های شخصی‌سازی‌شده</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">
              {identities.length} هویت
            </span>
          </div>
        </div>
      </div>

      {/* Ambient Nature & Focus Sound Settings (Requested by User) */}
      <AmbientSoundSettings
        config={userProfile.ambientSoundConfig || DEFAULT_AMBIENT_CONFIG}
        onUpdateConfig={handleUpdateAmbientConfig}
      />

      {/* PWA Mobile App Installation Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Download className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5">
              نصب برنامه روی گوشی (PWA)
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                اندروید و آیفون
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              استفاده تمام‌صفحه با آیکون اختصاصی در صفحه اصلی گوشی بدون نیاز به مرورگر
            </p>
          </div>
        </div>

        {onOpenInstallModal && (
          <button
            onClick={onOpenInstallModal}
            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 shrink-0 transition active:scale-95"
          >
            راهنما و نصب
          </button>
        )}
      </div>

      {/* Personas Customization Section */}
      <div className="space-y-3">

        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>شخصی‌سازی شخصیت‌ها و هویت‌ها ({identities.length})</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              این شخصیت‌ها در پروفایل شما ذخیره و در هر وظیفه قابل انتخاب هستند.
            </p>
          </div>
          <button
            onClick={handleOpenNewIdentityModal}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1 shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>شخصیت جدید</span>
          </button>
        </div>

        {/* Identities List */}
        <div className="space-y-3">
          {identities.map((item) => {
            const votes = calculateIdentityVotes(item.id, tasks, habits);
            const target = item.targetVotes || 50;
            const progress = Math.min(100, Math.round((votes / target) * 100));

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30 shrink-0">
                      <Shield className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{item.name}</h4>
                      {item.motto && (
                        <span className="text-[10px] font-medium text-amber-400 block mt-0.5">
                          شعار: «{item.motto}»
                        </span>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Vote Count Badge */}
                  <div className="text-center bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-2xl shrink-0">
                    <span className="font-extrabold text-sm text-amber-400 font-mono block leading-none">
                      {votes}
                    </span>
                    <span className="text-[9px] text-indigo-300">رأی</span>
                  </div>
                </div>

                {/* Progress bar towards target */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>پیشرفت ساخت این شخصیت:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {votes} از {target} ({progress}٪)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenEditIdentityModal(item)}
                    className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 px-2 py-0.5 rounded-lg hover:bg-slate-800"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>ویرایش شخصیت</span>
                  </button>

                  {identities.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`آیا از حذف شخصیت «${item.name}» اطمینان دارید؟`)) {
                          onDeleteIdentity(item.id);
                        }
                      }}
                      className="flex items-center gap-1 text-[11px] text-rose-400/80 hover:text-rose-300 px-2 py-0.5 rounded-lg hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                ویرایش پروفایل کاربر
              </h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">انتخاب آواتار:</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setProfileAvatar(av)}
                      className={`text-xl p-1.5 rounded-xl border transition-all ${
                        profileAvatar === av
                          ? 'border-emerald-400 bg-emerald-500/20 scale-110'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">نام یا نام مستعار:</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">عنوان / نقش فردی:</label>
                <input
                  type="text"
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">شعار یا بیو شخصی:</label>
                <textarea
                  rows={2}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
              >
                ذخیره تغییرات پروفایل
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Personality Modal */}
      {identityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-[440px] max-h-[90vh] bg-slate-900 border border-slate-800 rounded-t-[32px] sm:rounded-[32px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                {editingIdentity ? 'ویرایش شخصیت' : 'ایجاد و شخصی‌سازی شخصیت جدید'}
              </h3>
              <button onClick={() => setIdentityModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIdentity} className="p-5 space-y-3 text-xs overflow-y-auto">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  نام شخصیت یا هویت <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: پژوهشگر عمیق، دونده باانگیزه، همسر باگذشت"
                  value={idName}
                  onChange={(e) => setIdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  شعار هویتی (Motto):
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: هر روز با یادگیری یک نکته، داناتر می‌شوم."
                  value={idMotto}
                  onChange={(e) => setIdMotto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  توصیف این شخصیت:
                </label>
                <textarea
                  rows={2}
                  placeholder="این شخصیت چه ویژگی‌هایی دارد و چگونه تصمیم‌گیری می‌کند؟"
                  value={idDesc}
                  onChange={(e) => setIdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  هدف تعداد آرای تثبیت:
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={idTarget}
                  onChange={(e) => setIdTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingIdentity ? 'ثبت تغییرات شخصیت' : 'ذخیره در پروفایل و شخصیت‌ها'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
