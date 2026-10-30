import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateChallengeProgress,
  addDaysToDateKey,
  generateChallengeDays,
  getChallengeMilestones,
  createHonorBadge,
  toggleChallengeDate,
} from './challengeUtils.ts';
import { ThirtyDayChallenge } from '../types/index.ts';

describe('30-Day Challenge Pure Calculations & Logic', () => {
  it('calculateChallengeProgress calculates zero progress correctly', () => {
    const res = calculateChallengeProgress(0, 30);
    assert.equal(res.percent, 0);
    assert.equal(res.completedCount, 0);
    assert.equal(res.remainingDays, 30);
    assert.equal(res.isCompleted, false);
    assert.equal(res.compoundMultiplier, '1.00x');
  });

  it('calculateChallengeProgress calculates midpoint and compound multiplier', () => {
    const res = calculateChallengeProgress(15, 30);
    assert.equal(res.percent, 50);
    assert.equal(res.remainingDays, 15);
    assert.equal(res.isCompleted, false);
    assert.equal(res.compoundMultiplier, '1.16x');
  });

  it('calculateChallengeProgress marks 30 days as 100% completed', () => {
    const res = calculateChallengeProgress(30, 30);
    assert.equal(res.percent, 100);
    assert.equal(res.remainingDays, 0);
    assert.equal(res.isCompleted, true);
    assert.equal(res.compoundMultiplier, '1.35x');
  });

  it('addDaysToDateKey adds days accurately across month boundaries', () => {
    assert.equal(addDaysToDateKey('2026-10-25', 5), '2026-10-30');
    assert.equal(addDaysToDateKey('2026-10-30', 2), '2026-11-01');
    assert.equal(addDaysToDateKey('2026-12-31', 1), '2027-01-01');
  });

  it('generateChallengeDays produces exact 30 nodes with proper states', () => {
    const challenge: ThirtyDayChallenge = {
      id: 'c1',
      title: 'چالش آزمایشی',
      habitId: 'h1',
      identityId: 'id1',
      startDate: '2026-10-01',
      targetDays: 30,
      completedDates: ['2026-10-01', '2026-10-02', '2026-10-05'],
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
    };

    const nodes = generateChallengeDays(challenge, '2026-10-05');
    assert.equal(nodes.length, 30);
    assert.equal(nodes[0].dayNumber, 1);
    assert.equal(nodes[0].dateKey, '2026-10-01');
    assert.equal(nodes[0].isCompleted, true);
    assert.equal(nodes[0].isPast, true);

    // Day 5 is today
    assert.equal(nodes[4].dayNumber, 5);
    assert.equal(nodes[4].dateKey, '2026-10-05');
    assert.equal(nodes[4].isCompleted, true);
    assert.equal(nodes[4].isToday, true);

    // Day 6 is future
    assert.equal(nodes[5].dayNumber, 6);
    assert.equal(nodes[5].isToday, false);
    assert.equal(nodes[5].isFuture, true);
  });

  it('getChallengeMilestones reports appropriate status at different counts', () => {
    const m0 = getChallengeMilestones(0);
    assert.equal(m0.every((m) => !m.achieved), true);

    const m10 = getChallengeMilestones(10);
    assert.equal(m10[0].achieved, true); // day 7
    assert.equal(m10[1].achieved, false); // day 14

    const m30 = getChallengeMilestones(30);
    assert.equal(m30.every((m) => m.achieved), true);
  });

  it('createHonorBadge generates badge with title and details', () => {
    const challenge: ThirtyDayChallenge = {
      id: 'c-win',
      title: 'چالش مطالعه',
      habitId: 'h1',
      identityId: 'id1',
      startDate: '2026-10-01',
      targetDays: 30,
      completedDates: [],
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
    };

    const badge = createHonorBadge(challenge, 'مطالعه ۳۰ صفحه کتاب', 'نویسنده و دانشمند', '۹ آبان ۱۴۰۵');
    assert.ok(badge.id.includes('badge-c-win'));
    assert.equal(badge.title, 'نشان افتخار دگرگونی اتمی');
    assert.equal(badge.habitTitle, 'مطالعه ۳۰ صفحه کتاب');
    assert.equal(badge.identityName, 'نویسنده و دانشمند');
    assert.equal(badge.unlockedDateSolar, '۹ آبان ۱۴۰۵');
  });

  it('toggleChallengeDate adds date and awards badge upon reaching 30 days', () => {
    const past29Dates = Array.from({ length: 29 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
    const challenge: ThirtyDayChallenge = {
      id: 'c-almost',
      title: 'چالش ورزش',
      habitId: 'h-sport',
      identityId: 'id-fit',
      startDate: '2026-10-01',
      targetDays: 30,
      completedDates: past29Dates,
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
    };

    const result = toggleChallengeDate(challenge, '2026-10-30', 'ورزش هوازی', 'ورزشکار پرانرژی');
    assert.equal(result.newlyCompleted, true);
    assert.equal(result.updatedChallenge.status, 'completed');
    assert.equal(result.updatedChallenge.completedDates.length, 30);
    assert.ok(result.updatedChallenge.badge);
    assert.equal(result.updatedChallenge.badge.habitTitle, 'ورزش هوازی');

    // Untoggling Day 30 returns status to active
    const unResult = toggleChallengeDate(result.updatedChallenge, '2026-10-30');
    assert.equal(unResult.newlyCompleted, false);
    assert.equal(unResult.updatedChallenge.status, 'active');
    assert.equal(unResult.updatedChallenge.completedDates.length, 29);
  });
});
