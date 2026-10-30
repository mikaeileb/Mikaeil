import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Monitor } from 'lucide-react';
import { getTehranTime, toPersianDigits } from '../utils/tehranTime.ts';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  const [tehranTime, setTehranTime] = useState('');
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const time = getTehranTime();
      setTehranTime(time.time24);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:p-4 md:p-6 transition-colors">
      {/* Viewport switch toolbar for desktop testing */}
      <div className="w-full max-w-md hidden sm:flex items-center justify-between mb-3 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-400 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-300">طرح‌بندی اندروید (Material 3)</span>
        </div>
        <button
          onClick={() => setIsMobileFrame(!isMobileFrame)}
          aria-label={isMobileFrame ? 'نمایش تمام‌صفحه' : 'نمایش در فریم گوشی اندروید'}
          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors px-2 py-0.5 rounded-md hover:bg-slate-800"
        >
          {isMobileFrame ? (
            <>
              <Monitor className="w-3.5 h-3.5" />
              <span>تمام‌صفحه</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>فریم موبایل</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container - either Android Device Frame or Fluid Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileFrame
            ? 'sm:max-w-[420px] sm:rounded-[44px] sm:border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] sm:ring-1 sm:ring-slate-800/80 overflow-hidden bg-slate-900 flex flex-col min-h-screen sm:min-h-[850px] relative'
            : 'max-w-3xl rounded-3xl border border-slate-800 shadow-2xl bg-slate-900 flex flex-col min-h-screen relative overflow-hidden'
        }`}
      >
        {/* Android Punch Hole & Status Bar */}
        <div className="w-full bg-slate-950/80 backdrop-blur-md px-6 pt-2 pb-1.5 flex items-center justify-between text-xs text-slate-300 z-30 select-none border-b border-slate-850/50">
          {/* Tehran Clock */}
          <div className="flex items-center gap-1.5 font-medium tracking-wide dir-ltr text-slate-200">
            <span className="font-mono">{tehranTime || '20:53'}</span>
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">تهران</span>
          </div>

          {/* Android Camera Punch Hole */}
          {isMobileFrame && (
            <div className="w-3.5 h-3.5 rounded-full bg-black ring-2 ring-slate-800/80 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            </div>
          )}

          {/* Status Icons */}
          <div className="flex items-center gap-2 dir-ltr">
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[10px] font-semibold text-emerald-400">5G</span>
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-medium text-slate-300">92%</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col overflow-y-auto pb-20 relative">
          {children}
        </div>

        {/* Android Navigation Gesture Bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600/60 rounded-full pointer-events-none z-40" />
      </div>
    </div>
  );
};
