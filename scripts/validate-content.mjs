#!/usr/bin/env node
// Checks content/*.json: every exercise reference exists, every text has EN and ES,
// doses are sane, and the safety checklist has the same number of items in both languages.
import { readFileSync } from 'node:fs';

const dir = new URL('../content/', import.meta.url);
const load = (f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));

const exercises = load('exercises.json');
const templates = load('templates.json');
const programs = load('programs.json');
const warmup = load('team-warmup.json');
const safety = load('safety-checklist.json');
const intended = load('intended-use.json');

const errors = [];
const ids = new Set();
const CATS = new Set(['mobility', 'strength', 'balance', 'hop']);

const bilingual = (obj, where) => {
  if (!obj || typeof obj !== 'object') return errors.push(`${where}: missing`);
  for (const l of ['en', 'es']) {
    const v = obj[l];
    if (Array.isArray(v) ? !v.length : !v || !String(v).trim()) errors.push(`${where}: missing ${l}`);
  }
};

for (const e of exercises.exercises) {
  if (ids.has(e.id)) errors.push(`exercise ${e.id}: duplicate id`);
  ids.add(e.id);
  if (!/^[a-z0-9_]+$/.test(e.id)) errors.push(`exercise ${e.id}: id must be snake_case`);
  if (!CATS.has(e.category)) errors.push(`exercise ${e.id}: bad category ${e.category}`);
  bilingual(e.name, `exercise ${e.id} name`);
  bilingual(e.instructions, `exercise ${e.id} instructions`);
  bilingual(e.mistakes, `exercise ${e.id} mistakes`);
  if (e.mistakes.en.length !== e.mistakes.es.length) errors.push(`exercise ${e.id}: mistakes EN/ES count differ`);
}

const checkItems = (items, where) => {
  if (!items?.length) errors.push(`${where}: no items`);
  for (const it of items ?? []) {
    if (!ids.has(it.ex)) errors.push(`${where}: unknown exercise "${it.ex}"`);
    if (!(it.sets >= 1 && it.sets <= 10)) errors.push(`${where} ${it.ex}: sets out of range`);
    if ((it.reps == null) === (it.sec == null)) errors.push(`${where} ${it.ex}: needs exactly one of reps or sec`);
  }
};
const checkDays = (days, where) => {
  if (!days?.length || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) errors.push(`${where}: bad days`);
};

for (const t of templates.templates) {
  bilingual(t.name, `template ${t.id}`);
  checkDays(t.days, `template ${t.id}`);
  checkItems(t.items, `template ${t.id}`);
}
for (const p of programs.programs) {
  bilingual(p.name, `program ${p.id}`);
  bilingual(p.for, `program ${p.id} for`);
  for (const s of p.stages) {
    const w = `program ${p.id}/${s.id}`;
    bilingual(s.name, w);
    bilingual(s.moveOnWhen, `${w} moveOnWhen`);
    checkDays(s.days, w);
    checkItems(s.items, w);
  }
}
bilingual(warmup.name, 'team warm-up');
checkDays(warmup.days, 'team warm-up');
for (const b of warmup.blocks) { bilingual(b.name, 'warm-up block'); checkItems(b.items, `warm-up ${b.name.en}`); }

for (const l of ['en', 'es']) {
  const s = safety[l];
  if (!s?.title || !s.action || !s.items?.length) errors.push(`safety ${l}: incomplete`);
  if (!s?.emergency?.US?.length || !s?.emergency?.PE?.length) errors.push(`safety ${l}: missing emergency numbers`);
}
if (safety.en.items.length !== safety.es.items.length) errors.push('safety: EN/ES item counts differ');
for (const m of ['prescribed', 'general', 'team']) bilingual(intended.modes[m], `intended use ${m}`);
bilingual(intended.notice, 'notice');
bilingual(intended.shareNotice, 'share notice');

const versions = [exercises, templates, programs, warmup, safety, intended].map((c) => c.version);
if (versions.some((v) => !/^\d+\.\d+\.\d+$/.test(v))) errors.push('every content file needs a semver "version"');

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Content OK: ${ids.size} exercises, ${templates.templates.length} templates, ${programs.programs.length} programs, warm-up ${warmup.blocks.length} blocks, safety ${safety.en.items.length} items.`);
