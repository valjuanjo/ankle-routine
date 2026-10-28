/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCalendarPlan, buildIcs, firstPlanDay, estimateMinutes, icsEscape, icsFold, occurrence, type CalendarPlanInput } from '../src/lib/calendarPlan';
import { describeRoutine } from '../src/lib/format';
import { strings } from '../src/lib/i18n';
import type { Routine } from '../src/lib/routineCode';

const routine: Routine = {
  source: 'prescribed', stage: 'Fuerza', days: [5, 1, 3],
  items: [{ ex: 'band_eversion', sets: 3, reps: 12 }, { ex: 'single_leg_stance', sets: 3, sec: 30 }],
};
const input = (over: Partial<CalendarPlanInput> = {}): CalendarPlanInput => ({
  routine, info: describeRoutine(routine, 'es', strings.es), lang: 'es',
  from: '2026-11-04', weeks: 3, time: '18:30', includeExercises: true, ...over,
});

test('one weekly event per routine day, first occurrence on or after the start day', () => {
  // Nov 4 2026 is a Wednesday.
  const plan = buildCalendarPlan(input());
  assert.deepEqual(plan.events, [
    { weekday: 1, firstDay: '2026-11-09' },
    { weekday: 3, firstDay: '2026-11-04' },
    { weekday: 5, firstDay: '2026-11-06' },
  ]);
  assert.equal(plan.lastDay, '2026-11-24');
  assert.equal(plan.hour, 18);
  assert.equal(plan.minute, 30);
});

test('event start and end use the routine time and estimated length', () => {
  const plan = buildCalendarPlan(input());
  const { start, end } = occurrence(plan, plan.events[1]);
  assert.equal(start.getDate(), 4);
  assert.equal(start.getHours(), 18);
  assert.equal((end.getTime() - start.getTime()) / 60000, plan.durationMinutes);
  assert.equal(estimateMinutes(routine), 20); // 6 sets × 2 min + 5, rounded up to 5
  assert.equal(estimateMinutes({ ...routine, items: Array(10).fill({ ex: 'band_eversion', sets: 3, reps: 12 }) }), 45);
});

test('the event never carries pain scores or notes, and the exercise list is optional', () => {
  const withList = buildCalendarPlan(input());
  assert.match(withList.notes, /Liga: pie hacia afuera: 3 × 12 por lado/);
  assert.match(withList.notes, /acude a emergencias/);
  const without = buildCalendarPlan(input({ includeExercises: false }));
  assert.doesNotMatch(without.notes, /Liga/);
  assert.equal(without.title, 'Ejercicios de tobillo');
});

test('bad time falls back to 18:00', () => {
  const plan = buildCalendarPlan(input({ time: '25:99' }));
  assert.deepEqual([plan.hour, plan.minute], [18, 0]);
});

test('.ics has one VEVENT per day with weekly RRULE, alarm and CRLF line endings', () => {
  const ics = buildIcs(buildCalendarPlan(input()), 'routine-7', new Date('2026-11-04T12:00:00Z'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 3);
  assert.match(ics, /DTSTART:20261104T183000\r\n/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=WE;UNTIL=20261124T235900\r\n/);
  assert.match(ics, /UID:routine-7-mo@ankleroutine\.app/);
  assert.match(ics, /TRIGGER:-PT15M/);
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(!/[^\r]\n/.test(ics), 'bare LF found');
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, line);
});

test('.ics escaping and folding', () => {
  assert.equal(icsEscape('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  const long = 'DESCRIPTION:' + 'ñ'.repeat(60);
  const folded = icsFold(long);
  assert.equal(folded.replace(/\r\n /g, ''), long);
  for (const part of folded.split('\r\n')) assert.ok(new TextEncoder().encode(part).length <= 75);
});

test('first day is tomorrow once today\'s session time has passed', () => {
  assert.equal(firstPlanDay(new Date(2026, 10, 4, 7, 0), '07:15'), '2026-11-04');
  assert.equal(firstPlanDay(new Date(2026, 10, 4, 7, 15), '07:15'), '2026-11-05');
  assert.equal(firstPlanDay(new Date(2026, 11, 31, 20, 0), '18:00'), '2027-01-01');
});
