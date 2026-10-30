import React, { useState, useEffect } from 'react';
import { AndroidFrame } from './components/AndroidFrame.tsx';
import { TopBar } from './components/TopBar.tsx';
import { BottomNavigation, NavTab } from './components/BottomNavigation.tsx';
import { DailyTimeline } from './components/DailyTimeline.tsx';
import { HabitsTrackerView } from './components/HabitsTrackerView.tsx';
import { ThirtyDayChallengeView } from './components/ThirtyDayChallengeView.tsx';
import { SmartReminderView } from './components/SmartReminderView.tsx';
import { UserProfileView } from './components/UserProfileView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { EveningReviewModal } from './components/EveningReviewModal.tsx';
import { FloatingFocusPlayer } from './components/FloatingFocusPlayer.tsx';
import { PWAInstallModal } from './components/PWAInstallModal.tsx';
import { Task, Habit, Identity, EveningReminderConfig, UserProfile, ThirtyDayChallenge } from './types/index.ts';
import {
  DEFAULT_IDENTITIES,
  DEFAULT_HABITS,
  getDefaultTasks,
  DEFAULT_EVENING_CONFIG,
  DEFAULT_USER_PROFILE,
  getDefaultChallenges,
} from './data/initialData.ts';
import { getTodayDateString } from './utils/habitMath.ts';
import { getTehranSolarDate, getTehranTime } from './utils/tehranTime.ts';
import { sound } from './utils/audio.ts';

const STORAGE_KEYS = {
  TASKS: 'atomic_planner_tasks_v3',
  HABITS: 'atomic_planner_habits_v3',
  IDENTITIES: 'atomic_planner_identities_v3',
  EVENING: 'atomic_planner_evening_v3',
  PROFILE: 'atomic_planner_profile_v3',
  CHALLENGES: 'atomic_planner_challenges_v3',
};

export default function App() {
  // Navigation & Date in Tehran Timezone
  const [currentTab, setCurrentTab] = useState<NavTab>('timeline');
  const [currentDate, setCurrentDate] = useState<string>(() => getTehranSolarDate(0).dateKey);

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModalDefaultDate, setTaskModalDefaultDate] = useState<string | undefined>();
  const [eveningModalOpen, setEveningModalOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  // Core Data States with localStorage persistence
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : getDefaultTasks();
    } catch {
      return getDefaultTasks();
    }
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HABITS);
      return saved ? JSON.parse(saved) : DEFAULT_HABITS;
    } catch {
      return DEFAULT_HABITS;
    }
  });

  const [challenges, setChallenges] = useState<ThirtyDayChallenge[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      return saved ? JSON.parse(saved) : getDefaultChallenges();
    } catch {
      return getDefaultChallenges();
    }
  });

  const [identities, setIdentities] = useState<Identity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IDENTITIES);
      return saved ? JSON.parse(saved) : DEFAULT_IDENTITIES;
    } catch {
      return DEFAULT_IDENTITIES;
    }
  });

  const [eveningConfig, setEveningConfig] = useState<EveningReminderConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENING);
      return saved ? JSON.parse(saved) : DEFAULT_EVENING_CONFIG;
    } catch {
      return DEFAULT_EVENING_CONFIG;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_USER_PROFILE;
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    } catch {
      // ignore
    }
  }, [challenges]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch {
      // ignore
    }
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.IDENTITIES, JSON.stringify(identities));
    } catch {
      // ignore
    }
  }, [identities]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENING, JSON.stringify(eveningConfig));
    } catch {
      // ignore
    }
  }, [eveningConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
    } catch {
      // ignore
    }
  }, [userProfile]);

  // Background Reminder Loop (Check Evening Reminder and Task Advance Reminders)
  useEffect(() => {
    if (!eveningConfig.enabled) return;

    const checkInterval = setInterval(() => {
      const currentHM = getTehranTime().time24;
      const todayStr = getTehranSolarDate(0).dateKey;

      // Check night-before reminder
      if (currentHM === eveningConfig.time && eveningConfig.lastCompletedDate !== todayStr) {
        if (eveningConfig.soundEnabled) {
          sound.playEveningReminder();
        }
        if (eveningConfig.vibrationEnabled) {
          sound.triggerVibration([200, 100, 200]);
        }
        if (
          eveningConfig.browserNotificationEnabled &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification('یادآوری شبانه عادت‌های اتمی 🌙 (به وقت تهران)', {
            body: 'وقت تنظیم کارهای فردا با تعیین زمان، مکان و هویت شخصیتی فرا رسیده است!',
            icon: '/logo.png',
          });
        }
      }
    }, 25000);

    return () => clearInterval(checkInterval);
  }, [eveningConfig]);

  // Handlers for Tasks
  const handleToggleTaskComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const completed = !t.completed;
          return {
            ...t,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const handleSaveTask = (task: Task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      if (exists) {
        return prev.map((t) => (t.id === task.id ? task : t));
      }
      return [...prev, task];
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleOpenTaskModal = (task?: Task, defaultDate?: string) => {
    setEditingTask(task || null);
    setTaskModalDefaultDate(defaultDate || currentDate);
    setTaskModalOpen(true);
  };

  // Handlers for Habits
  const handleToggleHabitToday = (habitId: string) => {
    const todayStr = getTodayDateString(0);
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const isDoneToday = h.completedDates.includes(todayStr);
          const newDates = isDoneToday
            ? h.completedDates.filter((d) => d !== todayStr)
            : [...h.completedDates, todayStr];
          return {
            ...h,
            completedDates: newDates,
          };
        }
        return h;
      })
    );
  };

  const handleAddHabit = (habit: Habit) => {
    setHabits((prev) => [...prev, habit]);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  // Handlers for Identities (Customizing Personas in User Profile)
  const handleAddIdentity = (identity: Identity) => {
    setIdentities((prev) => [...prev, identity]);
  };

  const handleUpdateIdentity = (identity: Identity) => {
    setIdentities((prev) =>
      prev.map((item) => (item.id === identity.id ? identity : item))
    );
  };

  const handleDeleteIdentity = (identityId: string) => {
    setIdentities((prev) => prev.filter((item) => item.id !== identityId));
  };

  const handleAddNewIdentityInline = (name: string, description: string): string => {
    const newId = `id-${Date.now()}`;
    const newIdentity: Identity = {
      id: newId,
      name,
      description: description || 'هویت متعهد و پیگیر',
      color: 'emerald',
      icon: 'UserCheck',
      targetVotes: 50,
      createdAt: new Date().toISOString(),
    };
    handleAddIdentity(newIdentity);
    return newId;
  };

  // Reset to seed data
  const handleResetData = () => {
    if (window.confirm('آیا مایلید تمام اطلاعات به حالت نمونه اولیه کتاب بازگردانده شود؟')) {
      const defaultTasks = getDefaultTasks();
      setTasks(defaultTasks);
      setHabits(DEFAULT_HABITS);
      setIdentities(DEFAULT_IDENTITIES);
      setEveningConfig(DEFAULT_EVENING_CONFIG);
      setUserProfile(DEFAULT_USER_PROFILE);
      setChallenges(getDefaultChallenges());
      localStorage.clear();
      sound.playSuccessChime();
    }
  };

  const todayTasks = tasks.filter((t) => t.date === getTodayDateString(0));
  const pendingTodayCount = todayTasks.filter((t) => !t.completed).length;

  return (
    <AndroidFrame>
      <TopBar
        eveningConfig={eveningConfig}
        onOpenEveningReview={() => setEveningModalOpen(true)}
        onOpenInstallModal={() => setInstallModalOpen(true)}
        unreadCount={pendingTodayCount > 0 ? 1 : 0}
      />

      <main className="flex-1 pb-16">
        {currentTab === 'timeline' && (
          <DailyTimeline
            tasks={tasks}
            identities={identities}
            onToggleTaskComplete={handleToggleTaskComplete}
            onOpenTaskModal={handleOpenTaskModal}
            onOpenEveningReview={() => setEveningModalOpen(true)}
            eveningConfig={eveningConfig}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            ambientSoundConfig={userProfile.ambientSoundConfig}
          />
        )}

        {currentTab === 'habits' && (
          <HabitsTrackerView
            habits={habits}
            identities={identities}
            onToggleHabitToday={handleToggleHabitToday}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        )}

        {currentTab === 'challenges' && (
          <ThirtyDayChallengeView
            challenges={challenges}
            habits={habits}
            identities={identities}
            userProfile={userProfile}
            onUpdateChallenges={setChallenges}
          />
        )}

        {currentTab === 'reminders' && (
          <SmartReminderView
            eveningConfig={eveningConfig}
            onUpdateEveningConfig={setEveningConfig}
            onOpenEveningReview={() => setEveningModalOpen(true)}
          />
        )}

        {currentTab === 'profile' && (
          <UserProfileView
            userProfile={userProfile}
            onUpdateUserProfile={setUserProfile}
            identities={identities}
            tasks={tasks}
            habits={habits}
            onAddIdentity={handleAddIdentity}
            onUpdateIdentity={handleUpdateIdentity}
            onDeleteIdentity={handleDeleteIdentity}
            onOpenInstallModal={() => setInstallModalOpen(true)}
          />
        )}

        {currentTab === 'progress' && (
          <AnalyticsView
            tasks={tasks}
            habits={habits}
            identities={identities}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Floating Focus Mini-Player Pill */}
      <FloatingFocusPlayer />

      <BottomNavigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        pendingTaskCount={pendingTodayCount}
      />


      {/* Task Creation & Editing Dialog */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialTask={editingTask}
        identities={identities}
        onAddNewIdentity={handleAddNewIdentityInline}
        defaultDate={taskModalDefaultDate}
      />

      {/* Night-before Planning Reminder Wizard */}
      <EveningReviewModal
        isOpen={eveningModalOpen}
        onClose={() => setEveningModalOpen(false)}
        tasks={tasks}
        identities={identities}
        eveningConfig={eveningConfig}
        onUpdateEveningConfig={setEveningConfig}
        onAddTask={handleSaveTask}
        onOpenTaskModalForTomorrow={() => {
          handleOpenTaskModal(undefined, getTodayDateString(1));
        }}
      />

      {/* PWA Mobile & Desktop Installation Modal */}
      <PWAInstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />
    </AndroidFrame>
  );
}
