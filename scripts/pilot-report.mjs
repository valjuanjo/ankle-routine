#!/usr/bin/env node
// Monday report: week-by-week completion and sharing for both pilots, checked against the pass criteria.
// Reads docs/pilots/tracking/{lima,madison}-weekly.csv (anonymized counts only).
import { readFileSync } from 'node:fs';

const dir = new URL('../docs/pilots/tracking/', import.meta.url);
const csv = (f) => {
  const [head, ...rows] = readFileSync(new URL(f, dir), 'utf8').trim().split('\n');
  const keys = head.split(',');
  return rows.filter(Boolean).map((r) => {
    // Last column may contain commas (free text); split only as many times as needed.
    const parts = r.split(',');
    const vals = [...parts.slice(0, keys.length - 1), parts.slice(keys.length - 1).join(',')];
    return Object.fromEntries(keys.map((k, i) => [k, (vals[i] ?? '').trim()]));
  });
};
const yes = (v) => /^(y|yes|s|si|sí|true|1)$/i.test(v);
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : 'n/a');

export function limaReport(rows) {
  const out = [];
  const people = [...new Set(rows.map((r) => r.participant))];
  for (const w of ['1', '2', '3']) {
    const wk = rows.filter((r) => r.week === w);
    if (!wk.length) continue;
    // Pass rule: "4 of 7 planned sessions", scaled to the planned number.
    const hit = wk.filter((r) => +r.sessions_done >= Math.ceil((4 / 7) * +r.planned_sessions)).length;
    out.push(`Week ${w}: ${wk.length} patients, ${hit} at ≥4/7 of planned (${pct(hit, wk.length)}), mean ${(wk.reduce((s, r) => s + +r.sessions_done, 0) / wk.length).toFixed(1)} sessions`);
  }
  const shared = people.filter((p) => rows.some((r) => r.participant === p && yes(r.shared_log))).length;
  const useful = rows.filter((r) => yes(r.log_changed_or_sped_up_visit)).length;
  out.push(`Shared at least once: ${shared}/${people.length} (${pct(shared, people.length)}; assumption 3 wrong if < 33%)`);
  out.push(`Visits where the log changed or sped up the visit: ${useful}`);
  const w3 = rows.filter((r) => r.week === '3');
  if (w3.length) {
    const hit = w3.filter((r) => +r.sessions_done >= Math.ceil((4 / 7) * +r.planned_sessions)).length;
    out.push(`PASS CHECK: ${hit * 2 >= w3.length && useful > 0 ? 'PASS' : 'NOT YET'} (≥ half at 4/7 in week 3, and physio says the log helped)`);
  }
  return out;
}

export function madisonReport(rows) {
  const out = [];
  for (const team of [...new Set(rows.map((r) => r.team))]) {
    const t = rows.filter((r) => r.team === team);
    out.push(`${team}: ${t.map((r) => `W${r.week} ${r.sessions_done}`).join(' · ')}`);
    const w3 = t.find((r) => r.week === '3');
    if (w3) out.push(`  PASS CHECK: ${+w3.sessions_done >= 2 && yes(w3.trainer_wants_to_continue) ? 'PASS' : 'NOT YET'} (≥ 2 sessions in week 3, trainer wants to continue)${w3.trainer_verdict ? ` · "${w3.trainer_verdict}"` : ''}`);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const lima = csv('lima-weekly.csv');
  const madison = csv('madison-weekly.csv');
  console.log('# Lima clinic pilot');
  console.log(lima.length ? limaReport(lima).join('\n') : 'No data yet.');
  console.log('\n# Madison team pilot');
  console.log(madison.length ? madisonReport(madison).join('\n') : 'No data yet.');
}
