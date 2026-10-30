import React from 'react';
import { Calendar, Repeat, Bell, User, TrendingUp, Trophy } from 'lucide-react';

export type NavTab = 'timeline' | 'habits' | 'challenges' | 'reminders' | 'progress' | 'profile';

interface BottomNavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingTaskCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
  pendingTaskCount,
}) => {
  const tabs = [
    {
      id: 'timeline' as NavTab,
      label: 'برنامه',
      icon: Calendar,
      badge: pendingTaskCount > 0 ? pendingTaskCount : null,
    },
    {
      id: 'habits' as NavTab,
      label: 'عادات',
      icon: Repeat,
      badge: null,
    },
    {
      id: 'challenges' as NavTab,
      label: 'چالش ۳۰ روزه',
      icon: Trophy,
      badge: null,
    },
    {
      id: 'reminders' as NavTab,
      label: 'یادآوری',
      icon: Bell,
      badge: null,
    },
    {
      id: 'progress' as NavTab,
      label: 'پیشرفت',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'profile' as NavTab,
      label: 'پروفایل',
      icon: User,
      badge: null,
    },
  ];

  return (
    <nav
      aria-label="ناوبری اصلی برنامه"
      className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-1 py-1.5 z-30 flex items-center justify-around shadow-2xl"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            className={`flex flex-col items-center justify-center py-0.5 px-2 rounded-2xl transition-all relative tap-highlight-transparent ${
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 font-normal'
            }`}
          >
            {/* Active Pill Indicator in Android Material 3 style */}
            <div
              className={`relative px-3 py-1 rounded-full transition-all duration-200 ${
                isActive ? 'bg-emerald-500/20 text-emerald-400' : ''
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {tab.badge !== null && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-bold flex items-center justify-center shadow">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
