import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTehranTime,
  getTehranSolarDate,
  formatTehranDateKey,
  toPersianDigits,
} from './tehranTime.ts';

test('getTehranTime returns valid 24h hours and minutes', () => {
  const time = getTehranTime();
  assert.equal(typeof time.hours, 'string');
  assert.equal(typeof time.minutes, 'string');
  assert.equal(time.hours.length, 2);
  assert.equal(time.minutes.length, 2);
  assert.ok(parseInt(time.hours, 10) >= 0 && parseInt(time.hours, 10) <= 23);
  assert.ok(parseInt(time.minutes, 10) >= 0 && parseInt(time.minutes, 10) <= 59);
});

test('getTehranSolarDate returns Persian Shamsi year and month in Tehran timezone', () => {
  const today = getTehranSolarDate(0);
  assert.ok(today.year >= 1400); // Solar Hijri year
  assert.ok(today.month >= 1 && today.month <= 12);
  assert.ok(today.day >= 1 && today.day <= 31);
  assert.ok(today.fullDateLabel.includes(today.monthName));
  assert.ok(today.fullDateLabel.length > 5);
});

test('getTehranSolarDate offset calculates tomorrow correctly', () => {
  const today = getTehranSolarDate(0);
  const tomorrow = getTehranSolarDate(1);
  assert.notEqual(today.dateKey, tomorrow.dateKey);
});

test('formatTehranDateKey recognizes today and tomorrow', () => {
  const today = getTehranSolarDate(0);
  const tomorrow = getTehranSolarDate(1);

  const todayLabel = formatTehranDateKey(today.dateKey);
  const tomorrowLabel = formatTehranDateKey(tomorrow.dateKey);

  assert.ok(todayLabel.includes('امروز'));
  assert.ok(tomorrowLabel.includes('فردا'));
});

test('toPersianDigits converts western digits to Persian characters', () => {
  assert.equal(toPersianDigits('2026-10-30'), '۲۰۲۶-۱۰-۳۰');
  assert.equal(toPersianDigits(1405), '۱۴۰۵');
});
