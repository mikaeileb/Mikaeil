import React, { useState, useEffect } from 'react';
import { ambientAudio } from '../utils/ambientAudio.ts';
import { getSoundMeta } from '../utils/ambientSounds.ts';
import { AmbientSoundType } from '../types/index.ts';
import { Play, Pause, Square, Volume2, Sparkles, X } from 'lucide-react';
import { toPersianDigits } from '../utils/tehranTime.ts';

export const FloatingFocusPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(ambientAudio.isPlaying());
  const [activeSound, setActiveSound] = useState<AmbientSoundType | null>(ambientAudio.getActiveSound());
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(ambientAudio.getActiveTaskTitle());
  const [volume, setVolume] = useState(ambientAudio.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    const unsub = ambientAudio.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setActiveSound(state.activeSound);
      setActiveTaskTitle(state.activeTaskTitle || null);
      setVolume(state.volume);
    });
    return unsub;
  }, []);

  if (!isPlaying || !activeSound) {
    return null;
  }

  const meta = getSoundMeta(activeSound);

  const handleTogglePlay = () => {
    ambientAudio.toggle(activeSound);
  };

  const handleStop = () => {
    ambientAudio.stop();
  };

  return (
    <div className="fixed bottom-18 left-3 right-3 sm:left-auto sm:right-[calc(50%-180px)] sm:w-[360px] z-30 animate-in slide-in-from-bottom-2 duration-300">
      <div className="p-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 shadow-2xl shadow-cyan-950/50 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Sound info */}
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-base shrink-0 border border-cyan-500/30">
              {meta.emoji}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-100 truncate">
                  {meta.persianName}
                </span>
                <span className="flex items-end gap-0.5 h-2.5 shrink-0">
                  <span className="w-0.5 h-full bg-cyan-400 rounded-full animate-bounce"></span>
                  <span className="w-0.5 h-2/3 bg-cyan-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-0.5 h-4/5 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                </span>
              </div>
              {activeTaskTitle ? (
                <p className="text-[10px] text-amber-300 truncate flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>تمرکز روی: {activeTaskTitle}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400">حالت تمرکز عمیق فعال است</p>
              )}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              aria-label="تنظیم بلندی صدا"
              className={`p-1.5 rounded-lg border transition-colors ${
                showVolumeSlider
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'توقف موقت' : 'پخش'}
              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            <button
              onClick={handleStop}
              aria-label="بستن و اتمام پخش"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable volume slider */}
        {showVolumeSlider && (
          <div className="pt-1 border-t border-slate-800/80 flex items-center gap-2 text-xs">
            <span className="text-[10px] text-slate-400">صدا:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                ambientAudio.setVolume(val);
              }}
              className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] font-mono text-cyan-300 font-bold min-w-[28px] text-left">
              {toPersianDigits(Math.round(volume * 100))}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
