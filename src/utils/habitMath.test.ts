import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStreak,
  calculateIdentityVotes,
  getImplementationFormula,
  formatDurationPersian,
  calculateCompound1Percent,
  filterTasksByDate,
  getHabitScorecardStats
} from './habitMath.ts';
import { Task, Habit } from '../types/index.ts';

test('calculateStreak computes continuous consecutive days correctly', () => {
  const dates = ['2026-10-28', '2026-10-29', '2026-10-30'];
  const res = calculateStreak(dates, '2026-10-30');
  assert.equal(res.current, 3);
  assert.equal(res.longest, 3);
});

test('formatDurationPersian handles minutes and hours properly', () => {
  assert.equal(formatDurationPersian(45), '۴۵ دقیقه');
  assert.equal(formatDurationPersian(60), '۱ ساعت');
  assert.equal(formatDurationPersian(90), '۱ ساعت و ۳۰ دقیقه');
  assert.equal(formatDurationPersian(120), '۲ ساعت');
});

test('getImplementationFormula produces exact requested structure with duration and identity', () => {
  const formula = getImplementationFormula(
    'مطالعه فصل ۵',
    '۲۱:۳۰',
    'اتاق خواب',
    90,
    'کتاب‌خوان دانا'
  );
  // Expected structure:
  // "من «مطالعه فصل ۵» را در ساعت ۲۱:۳۰ و در «اتاق خواب» به مدت ۱ ساعت و ۳۰ دقیقه انجام خواهم داد برای ساختن شخصیت «کتاب‌خوان دانا»."
  assert.ok(formula.includes('من «مطالعه فصل ۵» را'));
  assert.ok(formula.includes('در ساعت ۲۱:۳۰'));
  assert.ok(formula.includes('در «اتاق خواب»'));
  assert.ok(formula.includes('به مدت ۱ ساعت و ۳۰ دقیقه انجام خواهم داد'));
  assert.ok(formula.includes('برای ساختن شخصیت «کتاب‌خوان دانا»'));
});

test('calculateCompound1Percent calculates correct 1% daily gain', () => {
  const day1 = calculateCompound1Percent(1);
  assert.equal(day1.multiplier, 1.01);

  const year = calculateCompound1Percent(365);
  assert.ok(year.multiplier >= 37 && year.multiplier <= 38);
});

test('filterTasksByDate sorts by startTime', () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'تسک دوم',
      date: '2026-10-30',
      startTime: '14:00',
      durationMinutes: 30,
      location: 'دفتر',
      identityId: 'pro',
      completed: false,
    },
    {
      id: '2',
      title: 'تسک اول',
      date: '2026-10-30',
      startTime: '08:30',
      durationMinutes: 45,
      location: 'خانه',
      identityId: 'pro',
      completed: true,
    },
  ];

  const todayTasks = filterTasksByDate(tasks, '2026-10-30');
  assert.equal(todayTasks.length, 2);
  assert.equal(todayTasks[0].id, '2');
});
