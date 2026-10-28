#!/usr/bin/env node
// Builds the Phase 0 printables from content/*.json:
//   routine card + 3-week log (ES for Lima, EN), team warm-up card (EN, ES),
//   Madison one-pager, clinician reviewer packet.
// HTML goes to print/src/, PDFs to print/.
// Set VIDEO_URL to the page that hosts the exercise videos to print a real QR code;
// without it the cards show a "link pending" box instead of a QR that goes nowhere.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import QRCode from 'qrcode';
import { createRequire } from 'node:module';

// Playwright is preinstalled globally in the dev container; require() finds it, ESM import doesn't.
const { chromium } = createRequire(import.meta.url)('playwright');

const root = new URL('..', import.meta.url).pathname;
const load = (f) => JSON.parse(readFileSync(`${root}content/${f}`, 'utf8'));
const exercises = load('exercises.json');
const templates = load('templates.json');
const programs = load('programs.json');
const warmup = load('team-warmup.json');
const safety = load('safety-checklist.json');
const intended = load('intended-use.json');
const exById = Object.fromEntries(exercises.exercises.map((e) => [e.id, e]));

const VIDEO_URL = process.env.VIDEO_URL || '';
const qr = VIDEO_URL ? await QRCode.toString(VIDEO_URL, { type: 'svg', margin: 0 }) : '';

const T = {
  en: {
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], perSide: 'per side', sets: 'Sets', reps: 'Reps / sec',
    yourRoutine: 'Your routine', setBy: 'Set by your physio at your visit', date: 'Date', physio: 'Physio',
    nextVisit: 'Next visit', stage: 'Stage', exercise: 'Exercise', daysCol: 'Days', notes: 'Notes from the visit',
    videos: 'Exercise videos', scan: 'Scan with your phone camera', pending: 'Video link pending',
    log: 'My 3-week log', week: 'Week', done: 'Done', pain: 'Pain 0–10', note: 'Note',
    logHelp: 'Tick each session you do. Pain and notes are optional. Bring this sheet to your next visit if you want to.',
    reminders: 'Tip: set a phone alarm for your exercise days.', categories: { mobility: 'Mobility', strength: 'Strength', balance: 'Balance', hop: 'Hops' },
    tally: 'Trainer tally: sessions done', minutes: 'min', title: 'Ankle routine',
  },
  es: {
    days: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], perSide: 'por lado', sets: 'Series', reps: 'Reps / seg',
    yourRoutine: 'Tu rutina', setBy: 'Indicada por tu fisioterapeuta en tu cita', date: 'Fecha', physio: 'Fisioterapeuta',
    nextVisit: 'Próxima cita', stage: 'Etapa', exercise: 'Ejercicio', daysCol: 'Días', notes: 'Indicaciones de la cita',
    videos: 'Videos de los ejercicios', scan: 'Escanea con la cámara de tu celular', pending: 'Enlace de videos pendiente',
    log: 'Mi registro de 3 semanas', week: 'Semana', done: 'Hecho', pain: 'Dolor 0–10', note: 'Nota',
    logHelp: 'Marca cada sesión que hagas. El dolor y la nota son opcionales. Si quieres, trae esta hoja a tu próxima cita.',
    reminders: 'Consejo: pon una alarma en tu celular para tus días de ejercicio.', categories: { mobility: 'Movilidad', strength: 'Fuerza', balance: 'Equilibrio', hop: 'Saltos' },
    tally: 'Conteo del entrenador: sesiones hechas', minutes: 'min', title: 'Rutina de tobillo',
  },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const dose = (it, l) => {
  const ex = exById[it.ex];
  const time = it.sec >= 120 ? `${it.sec / 60} min` : `${it.sec} s`;
  const amount = it.reps != null ? `${it.sets} × ${it.reps}` : it.sets === 1 ? time : `${it.sets} × ${time}`;
  return ex.perSide ? `${amount} ${T[l].perSide}` : amount;
};

const CSS = `
  @page { size: letter; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.35 "Helvetica Neue", Arial, sans-serif; color: #1d2433; margin: 0; }
  h1 { font-size: 18pt; margin: 0 0 2mm; color: #0f4c5c; }
  h2 { font-size: 12.5pt; margin: 5mm 0 2mm; color: #0f4c5c; }
  h3 { font-size: 11pt; margin: 3mm 0 1mm; }
  .sub { color: #4a5568; margin: 0 0 3mm; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 0.4pt solid #9aa5b1; padding: 1.1mm 2mm; text-align: left; vertical-align: top; }
  th { background: #e6f0f2; font-size: 9.5pt; }
  .box { display: inline-block; width: 3.6mm; height: 3.6mm; border: 0.8pt solid #1d2433; vertical-align: middle; }
  .safety { border: 1.6pt solid #b42318; border-radius: 3mm; padding: 3mm 4mm; margin-top: 4mm; background: #fff5f4; break-inside: avoid; }
  .safety h2 { color: #b42318; margin-top: 0; }
  .safety ul { margin: 1mm 0 2mm 5mm; padding: 0; }
  .emerg { font-weight: 700; font-size: 11.5pt; }
  .notice { font-size: 9pt; color: #4a5568; border-top: 0.4pt solid #9aa5b1; padding-top: 2mm; margin-top: 4mm; }
  .row { display: flex; gap: 5mm; align-items: flex-start; }
  .qr { width: 28mm; height: 28mm; flex: none; }
  .qr svg { width: 100%; height: 100%; }
  .pending { width: 28mm; height: 28mm; border: 1pt dashed #9aa5b1; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 8pt; color: #4a5568; flex: none; }
  .fill { border-bottom: 0.6pt solid #1d2433; display: inline-block; min-width: 40mm; height: 4.5mm; }
  .cat { background: #f4f7f8; font-weight: 700; }
  .page { break-after: page; }
  .draft { color: #b42318; font-weight: 700; font-size: 9pt; }
  .small { font-size: 9pt; }
`;
const html = (title, lang, body) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;

function safetyBox(l, country) {
  const s = safety[l];
  const nums = s.emergency[country].map((n) => `${esc(n.label)} <span class="emerg">${n.number}</span>`).join(' · ');
  return `<div class="safety"><h2>${esc(s.title)}</h2><ul>${s.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    <div><strong>${esc(s.action)}</strong></div><div style="margin-top:1.5mm">${nums}</div></div>`;
}
const videoBox = (l) => `<div class="row" style="margin-top:4mm">${qr ? `<div class="qr">${qr}</div>` : `<div class="pending">${T[l].pending}</div>`}
  <div><h3 style="margin-top:0">${T[l].videos}</h3><div class="small">${T[l].scan}</div><div class="small" style="margin-top:2mm">${T[l].reminders}</div></div></div>`;

function routineCard(l, country) {
  const t = T[l];
  const rows = ['mobility', 'strength', 'balance', 'hop'].map((cat) => {
    const exs = exercises.exercises.filter((e) => e.category === cat && e.id !== 'jog_with_ankle_drills');
    return `<tr class="cat"><td colspan="4">${t.categories[cat]}</td></tr>` + exs.map((e) =>
      `<tr><td style="width:6mm"><span class="box"></span></td><td>${esc(e.name[l])}${e.perSide ? ` <span class="small">(${t.perSide})</span>` : ''}</td><td style="width:18mm"></td><td style="width:26mm"></td></tr>`).join('');
  }).join('');
  const body = `<div class="page">
    <h1>${t.yourRoutine}</h1>
    <p class="sub">${esc(intended.modes.prescribed[l])} ${t.setBy}.</p>
    <p>${t.date}: <span class="fill" style="min-width:30mm"></span> &nbsp; ${t.physio}: <span class="fill"></span> &nbsp; ${t.stage}: <span class="fill" style="min-width:25mm"></span></p>
    <p><strong>${t.daysCol}:</strong> ${t.days.map((d) => `<span class="box"></span> ${d}`).join(' &nbsp; ')}</p>
    <table><thead><tr><th></th><th>${t.exercise}</th><th>${t.sets}</th><th>${t.reps}</th></tr></thead><tbody>${rows}</tbody></table>
    <p style="margin-top:3mm">${t.notes}:</p><div style="border:0.4pt solid #9aa5b1;height:16mm"></div>
    <p>${t.nextVisit}: <span class="fill"></span></p>
  </div>
  <div>
    ${safetyBox(l, country)}
    ${videoBox(l)}
    <h2>${t.exercise}s</h2>
    <table class="small"><tbody>${exercises.exercises.filter((e) => e.id !== 'jog_with_ankle_drills').map((e) => `<tr><td style="width:40mm"><strong>${esc(e.name[l])}</strong></td><td>${esc(e.instructions[l])}</td></tr>`).join('')}</tbody></table>
    <p class="notice">${esc(intended.notice[l])}</p>
  </div>`;
  return html(t.title, l, body);
}

function logSheet(l, country) {
  const t = T[l];
  const weeks = [1, 2, 3].map((w) => `<h3>${t.week} ${w}</h3><table><thead><tr><th style="width:24mm">${t.date}</th><th style="width:14mm">${t.done}</th><th style="width:20mm">${t.pain}</th><th>${t.note}</th></tr></thead><tbody>${
    Array.from({ length: 7 }, () => `<tr><td style="height:7mm"></td><td><span class="box"></span></td><td></td><td></td></tr>`).join('')}</tbody></table>`).join('');
  return html(t.log, l, `<h1>${t.log}</h1><p class="sub">${t.logHelp}</p>${weeks}
    <p class="notice"><strong>${esc(intended.shareNotice[l])}</strong></p>${safetyBox(l, country)}`);
}

function warmupCard(l, country) {
  const t = T[l];
  const blocks = warmup.blocks.map((b) => `<tr class="cat"><td colspan="3">${esc(b.name[l])}</td></tr>` + b.items.map((it) =>
    `<tr><td style="width:55mm"><strong>${esc(exById[it.ex].name[l])}</strong></td><td style="width:30mm">${dose(it, l)}</td><td class="small">${esc(exById[it.ex].instructions[l])}</td></tr>`).join('')).join('');
  return html(warmup.name[l], l, `<h1>${esc(warmup.name[l])} · ${warmup.minutes} ${t.minutes}</h1>
    <p class="sub">${esc(intended.modes.team[l])} ${esc(warmup.frequency[l])}.</p>
    <table><tbody>${blocks}</tbody></table>
    ${videoBox(l)}
    <h2>${t.tally}</h2>
    <table><thead><tr><th></th><th>${t.week} 1</th><th>${t.week} 2</th><th>${t.week} 3</th></tr></thead>
    <tbody><tr><td style="width:40mm;height:9mm">${l === 'es' ? 'Sesiones' : 'Sessions'}</td><td></td><td></td><td></td></tr></tbody></table>
    ${safetyBox(l, country)}`);
}

function onePager() {
  return html('Team ankle warm-up pilot', 'en', `<h1>Team ankle warm-up: 3-week pilot</h1>
    <p class="sub">Tech Exploration Lab · Juan José Valverde Ayte, physiotherapist</p>
    <h2>What it is</h2><p>${esc(intended.modes.team.en)} About ${warmup.minutes} minutes, ${esc(warmup.frequency.en)}, built from ankle mobility, strength, balance and landing drills (FIFA 11+ style). Printed card with QR links to short videos; a phone app comes later.</p>
    <h2>What the trainer gets</h2><ul><li>A ready-made warm-up, adjusted with you to your sport and season.</li><li>A simple weekly count of sessions done, as a tool for you.</li></ul>
    <h2>What it isn't</h2><ul><li>Not a medical service. No one monitors athletes through it; injuries go through you as usual.</li><li>No individual or health data. I receive team totals only: sessions done per team per week.</li></ul>
    <h2>Pilot</h2><table><tbody>
      <tr><th style="width:40mm">Length</th><td>3 weeks, first session by Nov 9</td></tr>
      <tr><th>Measure</th><td>Sessions done per team per week; your verdict in your own words</td></tr>
      <tr><th>Success</th><td>At least 2 sessions a week in week 3, and you want to continue</td></tr>
      <tr><th>Paperwork</th><td>UW QI / program-evaluation self-certification completed before the first session</td></tr>
    </tbody></table>
    <h2>Contact</h2><p>Juan José Valverde Ayte · [email] · [phone]</p>`);
}

function reviewerPacket() {
  const exRows = exercises.exercises.map((e) => `<tr><td><strong>${esc(e.name.en)}</strong><br><span class="small">${esc(e.name.es)}</span><br><span class="small">${e.category} · ${e.dose.sets} × ${e.dose.reps ?? e.dose.seconds + ' s'}${e.perSide ? ' per side' : ''}</span></td>
    <td class="small">${esc(e.instructions.en)}<br><em>Mistakes:</em> ${esc(e.mistakes.en.join('; '))}</td>
    <td class="small">${esc(e.instructions.es)}<br><em>Errores:</em> ${esc(e.mistakes.es.join('; '))}</td><td style="width:16mm"><span class="box"></span> OK<br><span class="box"></span> Edit</td></tr>`).join('');
  const items = (its) => `<ul class="small">${its.map((it) => `<li>${esc(exById[it.ex].name.en)}: ${dose(it, 'en')}</li>`).join('')}</ul>`;
  const tpl = templates.templates.map((t) => `<h3>${esc(t.name.en)} (${t.days.length} days/week)</h3>${items(t.items)}`).join('');
  const prg = programs.programs.map((p) => `<h3>${esc(p.name.en)}</h3><p class="small">${esc(p.for.en)}</p>${p.stages.map((s) =>
    `<p class="small"><strong>${esc(s.name.en)}</strong> (${s.days.length} days/week). Move on when: ${esc(s.moveOnWhen.en)}</p>${items(s.items)}`).join('')}`).join('');
  return html('Clinician review packet', 'en', `<h1>Clinician review packet · content v${exercises.version}</h1>
    <p class="draft">DRAFT for review. Please mark each item OK or Edit and add comments. Source: content/*.json.</p>
    <h2>1. Safety checklist (EN and ES written separately)</h2>
    <div class="row"><div style="flex:1">${safetyBox('en', 'US')}</div><div style="flex:1">${safetyBox('es', 'PE')}</div></div>
    <p class="small">Questions: Is anything missing (e.g. fever, open wound)? Is "4 steps" the right weight-bearing cue? Is the Spanish natural for Lima patients?</p>
    <h2>2. Exercise library</h2><table><thead><tr><th>Exercise</th><th>English</th><th>Español</th><th>Review</th></tr></thead><tbody>${exRows}</tbody></table>
    <h2>3. Routine templates</h2>${tpl}
    <h2>4. General programs</h2>${prg}
    <h2>5. Team warm-up (${warmup.minutes} min)</h2>${warmup.blocks.map((b) => `<h3>${esc(b.name.en)}</h3>${items(b.items)}`).join('')}
    <h2>Reviewer sign-off</h2><p>Name: <span class="fill"></span> Role: <span class="fill"></span> Date: <span class="fill" style="min-width:25mm"></span></p>`);
}

const outputs = {
  'routine-card-es': routineCard('es', 'PE'),
  'routine-card-en': routineCard('en', 'US'),
  'log-3wk-es': logSheet('es', 'PE'),
  'log-3wk-en': logSheet('en', 'US'),
  'team-warmup-card-en': warmupCard('en', 'US'),
  'team-warmup-card-es': warmupCard('es', 'PE'),
  'madison-one-pager': onePager(),
  'reviewer-packet-v0.1': reviewerPacket(),
};

mkdirSync(`${root}print/src`, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, doc] of Object.entries(outputs)) {
  writeFileSync(`${root}print/src/${name}.html`, doc);
  await page.setContent(doc, { waitUntil: 'load' });
  await page.pdf({ path: `${root}print/${name}.pdf`, preferCSSPageSize: true, printBackground: true });
  console.log(`print/${name}.pdf`);
}
await browser.close();
if (!VIDEO_URL) console.warn('\nVIDEO_URL not set: cards show "video link pending" instead of a QR code.');
