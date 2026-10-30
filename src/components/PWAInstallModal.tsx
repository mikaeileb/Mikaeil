import React, { useState } from 'react';
import {
  Smartphone,
  Apple,
  Monitor,
  Download,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { sound } from '../utils/audio.ts';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>(
    isIOS ? 'ios' : 'android'
  );
  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    sound.playClick();
    const success = await install();
    if (success) {
      sound.playSuccessChime();
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleCopyLink = () => {
    sound.playClick();
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-lg shadow-emerald-500/20">
              <img
                src="/logo.png"
                alt="لوگوی اتمیک پلنر"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-1.5">
                نصب برنامه «اتمیک پلنر»
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400">نصب مستقیم روی گوشی بدون نیاز به نصب APK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن پنجره راهنما"
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner if just installed */}
        {installSuccess && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>برنامه با موفقیت نصب شد! آیکون برنامه به صفحه اصلی شما اضافه گردید.</span>
          </div>
        )}

        {/* Standalone already running badge */}
        {isInstalled && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>برنامه در حال حاضر به‌صورت اپلیکیشن مستقل (Standalone) در حال اجرا است.</span>
          </div>
        )}

        {/* Direct One-Click Install Button if browser supports beforeinstallprompt */}
        {isInstallable && !isInstalled && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-600/30 via-slate-800 to-slate-800 border border-emerald-500/40 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                قابلیت نصب مستقیم مرورگر فعال است
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              مرورگر شما از نصب مستقیم پشتیبانی می‌کند. تنها با یک کلیک آیکون برنامه را به گوشی خود
              اضافه کنید:
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              هم‌اکنون نصب کن (Install App)
            </button>
          </div>
        )}

        {/* Tab Selector for Device Guides */}
        <div className="mt-4 flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'android'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            اندروید (Android)
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'ios'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            آیفون (iOS)
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'desktop'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            کامپیوتر / PC
          </button>
        </div>

        {/* Tab Details */}
        <div className="mt-3.5">
          {activeTab === 'android' && (
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 mb-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                    ۱
                  </span>
                  باز کردن با مرورگر کروم یا سامسونگ اینترنت
                </h4>
                <p className="text-slate-400 leading-relaxed pr-7">
                  لینک برنامه را در مرورگر <strong>Google Chrome</strong> یا{' '}
                  <strong>Samsung Internet</strong> گوشی باز کنید.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 mb-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                    ۲
                  </span>
                  لمس منوی سه نقطه (⋮)
                </h4>
                <p className="text-slate-400 leading-relaxed pr-7">
                  روی علامت سه‌نقطه در گوشه بالا یا پایین مرورگر ضربه بزنید.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 mb-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                    ۳
                  </span>
                  انتخاب «افزودن به صفحه اصلی» یا «Install App»
                </h4>
                <p className="text-slate-400 leading-relaxed pr-7">
                  گزینه <strong>«نصب برنامه»</strong> (Install App) یا{' '}
                  <strong>«افزودن به صفحه اصلی»</strong> (Add to Home screen) را بزنید و سپس دکمه
                  تایید را لمس کنید.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 mb-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">
                    ۱
                  </span>
                  باز کردن با مرورگر سافاری (Safari)
                </h4>
                <p className="text-slate-400 leading-relaxed pr-7">
                  در سیستم‌عامل iOS و گوشی‌های آیفون، حتماً صفحه را در مرورگر رسمی{' '}
                  <strong>Safari</strong> باز نمایید.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 mb-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">
                    ۲
                  </span>
                  لمس آیکون اشتراک‌گذاری (Share)
                </h4>
                <p className="text-slate-400 leading-relaxed pr-7">
                  در نوار پایین صفحه مرورگر سافاری، روی آیکون <strong>اشتراک‌گذاری</strong> (مربع با
                  فلش رو به بالا <Share2 className="w-3.5 h-3.5 inline mx-1 text-indigo-400" />) ضربه
                  بزنید.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 mb-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">
                    ۳
                  </span>
                  انتخاب «Add to Home Screen»
                </h4>
                <p className="text-slate-400 leading-relaxed pr-7">
                  به سمت پایین اسکرول کنید و روی گزینه{' '}
                  <strong>«افزودن به صفحه اصلی» (Add to Home Screen)</strong> ضربه بزنید و سپس دکمه{' '}
                  <strong>Add</strong> در گوشه بالا را بزنید.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 mb-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px]">
                    ۱
                  </span>
                  نصب با گوگل کروم یا مایکروسافت اج
                </h4>
                <p className="text-slate-400 leading-relaxed pr-7">
                  در بالای صفحه و سمت راست نوار آدرس URL، روی آیکون مانیتور کوچک با علامت دانلود کلیک
                  کنید.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-slate-100 flex items-center gap-2 mb-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px]">
                    ۲
                  </span>
                  کلیک روی «Install»
                </h4>
                <p className="text-slate-400 leading-relaxed pr-7">
                  پنجره‌ای کوچک باز می‌شود؛ دکمه <strong>Install</strong> را بزنید تا اتمیک پلنر به
                  عنوان یک اپلیکیشن دسکتاپ مستقل روی ویندوز یا مک باز شود.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>پشتیبانی کامل از حالت آفلاین</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>بدون نیاز به فایل APK و حجم کم</span>
          </div>
        </div>

        {/* Share & Copy Link button */}
        <div className="mt-3.5 flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">لینک کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>کپی لینک برنامه برای موبایل</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};
