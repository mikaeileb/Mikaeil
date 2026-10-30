import React, { useState, useEffect } from 'react';
import { AmbientSoundConfig, AmbientSoundType } from '../types/index.ts';
import {
  AMBIENT_SOUNDS_CATALOG,
  clampVolume,
  formatVolumePercent,
} from '../utils/ambientSounds.ts';
import { ambientAudio } from '../utils/ambientAudio.ts';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Check,
  Radio,
  Sliders,
  Zap,
} from 'lucide-react';
import { toPersianDigits } from '../utils/tehranTime.ts';

interface AmbientSoundSettingsProps {
  config: AmbientSoundConfig;
  onUpdateConfig: (newConfig: AmbientSoundConfig) => void;
}

export const AmbientSoundSettings: React.FC<AmbientSoundSettingsProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [isPlaying, setIsPlaying] = useState(ambientAudio.isPlaying());
  const [currentlyAuditioning, setCurrentlyAuditioning] = useState<AmbientSoundType | null>(
    ambientAudio.getActiveSound()
  );
  const [localVolume, setLocalVolume] = useState(config.volume ?? 0.65);

  useEffect(() => {
    const unsubscribe = ambientAudio.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setCurrentlyAuditioning(state.activeSound);
    });
    return unsubscribe;
  }, []);

  const handleToggleMasterEnabled = () => {
    const updated: AmbientSoundConfig = {
      ...config,
      enabled: !config.enabled,
    };
    onUpdateConfig(updated);
    if (!updated.enabled && isPlaying) {
      ambientAudio.stop();
    }
  };

  const handleToggleAutoPlay = () => {
    onUpdateConfig({
      ...config,
      autoPlayOnTask: !config.autoPlayOnTask,
    });
  };

  const handleSelectDefaultSound = (soundType: AmbientSoundType) => {
    const updated: AmbientSoundConfig = {
      ...config,
      activeSound: soundType,
    };
    onUpdateConfig(updated);

    // If already playing, switch smoothly
    if (isPlaying) {
      ambientAudio.play(soundType, localVolume);
    }
  };

  const handleTogglePreviewSound = (soundType: AmbientSoundType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying && currentlyAuditioning === soundType) {
      ambientAudio.stop();
    } else {
      ambientAudio.play(soundType, localVolume);
      if (config.activeSound !== soundType) {
        onUpdateConfig({
          ...config,
          activeSound: soundType,
        });
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = clampVolume(parseFloat(e.target.value));
    setLocalVolume(newVol);
    ambientAudio.setVolume(newVol);
    onUpdateConfig({
      ...config,
      volume: newVol,
    });
  };

  return (
    <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      {/* Header and Master Switch */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <span>موسیقی محیطی و اصوات طبیعت</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-full font-medium">
                افزایش تمرکز عمیق
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
              پخش صدای باران، کافه یا نویز هنگام انجام کارهای زمان‌بندی‌شده
            </p>
          </div>
        </div>

        {/* Master Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={handleToggleMasterEnabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
        </label>
      </div>

      {config.enabled ? (
        <div className="space-y-4 pt-1">
          {/* Auto-play on scheduled task toggle */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  پخش خودکار با شروع کار روزانه
                </p>
                <p className="text-[10px] text-slate-400">
                  با کلیک روی کار زمان‌بندی‌شده، صدای منتخب برای تمرکز آغاز شود
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.autoPlayOnTask}
              onChange={handleToggleAutoPlay}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-700 border-slate-600 focus:ring-0"
            />
          </div>

          {/* Volume Control */}
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                تنظیم بلندی صدای محیطی:
              </span>
              <span className="font-mono text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                {toPersianDigits(formatVolumePercent(localVolume))}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <VolumeX className="w-4 h-4 text-slate-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localVolume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <Volume2 className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          {/* Sound Library Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                انتخاب نوع صدای آرام‌بخش:
              </span>
              {isPlaying && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 animate-pulse font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  در حال پخش...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AMBIENT_SOUNDS_CATALOG.map((item) => {
                const isSelected = config.activeSound === item.id;
                const isCurrentlyPlayingThis = isPlaying && currentlyAuditioning === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectDefaultSound(item.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2 text-right relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Top Row: Emoji, Name, Preview Button */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1">
                            {item.persianName}
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {item.subtitle}
                          </span>
                        </div>
                      </div>

                      {/* Play/Stop Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => handleTogglePreviewSound(item.id, e)}
                        aria-label={isCurrentlyPlayingThis ? 'توقف پخش صدا' : 'پیش‌نمایش و تست صدا'}
                        className={`p-2 rounded-xl transition-all shrink-0 ${
                          isCurrentlyPlayingThis
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-750'
                        }`}
                      >
                        {isCurrentlyPlayingThis ? (
                          <Square className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>
                    </div>

                    {/* Benefit and Description */}
                    <p className="text-[10px] text-slate-400 leading-snug">
                      {item.description}
                    </p>

                    <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[9px]">
                      <span className="text-cyan-300 font-medium">{item.benefit}</span>

                      {/* Visual Audio Equalizer animation when playing */}
                      {isCurrentlyPlayingThis && (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 h-full bg-cyan-400 rounded-full animate-bounce"></span>
                          <span className="w-0.5 h-2/3 bg-cyan-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                          <span className="w-0.5 h-4/5 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                          <span className="w-0.5 h-1/2 bg-cyan-400 rounded-full animate-bounce [animation-delay:75ms]"></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-slate-800/30 border border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            پخش موسیقی و اصوات محیطی غیرفعال است. برای تمرکز با صدای باران یا کافه، کلید بالا را فعال کنید.
          </p>
        </div>
      )}
    </div>
  );
};
