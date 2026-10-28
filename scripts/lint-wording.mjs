#!/usr/bin/env node
// Fails if user-facing text uses wording the plan forbids (section A, "Never use").
// Usage: node scripts/lint-wording.mjs [paths...]  (defaults: content, app/src, prototype, fakedoor, print/src)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

export const FORBIDDEN = [
  'treatment', 'treatments', 'rehab protocol', 'diagnosis', 'diagnose', 'clinically proven',
  'medical grade', 'medical-grade', 'ready to return to sport', 'cure', 'cures',
  'diagnóstico', 'diagnostico', 'tratamiento', 'tratamientos', 'cura', 'curar',
  'protocolo de rehabilitación', 'clínicamente probado', 'grado médico', 'listo para volver al deporte',
];
// Recovery-time promises, e.g. "back in 2 weeks", "recover in 10 days", "recupérate en 3 semanas".
const PROMISES = [
  /\b(back|recover(ed|y)?|heal(ed)?)\b[^.\n]{0,20}\bin \d+ (days?|weeks?)\b/i,
  /\b(recupera\w*|san\w+)\b[^.\n]{0,20}\ben \d+ (días|dias|semanas)\b/iu,
];

// The standard notice denies these words on purpose ("not a diagnosis or treatment").
// Lines containing these phrases are allowed.
const ALLOWED_PHRASES = [
  'not a diagnosis or treatment', 'no es un diagnóstico ni un tratamiento',
  'isn\'t a diagnosis or treatment', 'no es diagnóstico ni tratamiento',
];

const TEXT_EXT = new Set(['.json', '.ts', '.tsx', '.js', '.mjs', '.html', '.md']);
const SKIP_DIRS = new Set(['node_modules', '.expo', 'dist', '.git', 'android', 'ios']);

function* walk(p) {
  if (!existsSync(p)) return;
  if (statSync(p).isFile()) { yield p; return; }
  for (const name of readdirSync(p)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(p, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (TEXT_EXT.has(extname(name))) yield full;
  }
}

const wordRe = (w) => new RegExp(`(?<![\\p{L}])${w.replace(/[-]/g, '[- ]')}(?![\\p{L}])`, 'iu');
const RULES = FORBIDDEN.map((w) => ({ w, re: wordRe(w) }));

export function lintText(text) {
  const problems = [];
  text.split('\n').forEach((line, i) => {
    const lower = line.toLowerCase();
    if (ALLOWED_PHRASES.some((p) => lower.includes(p))) return;
    if (line.includes('lint-wording: allow')) return;
    for (const { w, re } of RULES) if (re.test(line)) problems.push({ line: i + 1, word: w, text: line.trim() });
    for (const re of PROMISES) if (re.test(line)) problems.push({ line: i + 1, word: 'recovery-time promise', text: line.trim() });
  });
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = new URL('..', import.meta.url).pathname;
  const targets = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ['content', 'app/src', 'app/app.json', 'prototype', 'fakedoor', 'print/src'].map((p) => join(root, p));
  let count = 0;
  for (const t of targets) for (const file of walk(t)) {
    for (const p of lintText(readFileSync(file, 'utf8'))) {
      count++;
      console.log(`${file}:${p.line}  "${p.word}"  ${p.text.slice(0, 120)}`);
    }
  }
  if (count) { console.error(`\n${count} wording problem(s).`); process.exit(1); }
  console.log('Wording OK.');
}
