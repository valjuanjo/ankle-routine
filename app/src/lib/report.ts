// Builds the HTML for the shared PDF. Pure, so it can be tested without a device.
// Only what the patient chose is included; the share notice is always on it.
import { exerciseById, intendedUse, safety, type Country, type Lang } from './content';
import { describeRoutine, doseText, daysText } from './format';
import { strings } from './i18n';
import type { Routine } from './routineCode';
import { parseDay, type Session, type WeekStat } from './schedule';

export interface ShareOptions {
  lang: Lang;
  country: Country;
  routine: Routine | null;
  sessions: Session[];
  weeks: WeekStat[];
  includePain: boolean;
  includeNotes: boolean;
  /** Today, YYYY-MM-DD. */
  createdOn: string;
}

const esc = (v: unknown) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function formatDay(day: string, lang: Lang): string {
  return parseDay(day).toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function buildShareHtml(o: ShareOptions): string {
  const s = strings[o.lang];
  const sessions = [...o.sessions].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const r = o.routine;
  const info = r ? describeRoutine(r, o.lang, s) : null;
  const cols = [s.pdfDate, ...(o.includePain ? [s.pdfPain] : []), ...(o.includeNotes ? [s.pdfNote] : [])];
  const rows = sessions.map((x) => `<tr><td>${esc(formatDay(x.day, o.lang))}</td>${o.includePain ? `<td>${x.pain ?? '–'}</td>` : ''}${o.includeNotes ? `<td>${esc(x.note ?? '')}</td>` : ''}</tr>`).join('');
  const routineHtml = r
    ? `<h2>${esc(info!.title)}${info!.stage ? ` · ${esc(info!.stage)}` : ''}</h2>
       <p class="muted">${esc(daysText(r.days, s))}${r.by ? ` · ${esc(s.setBy)} ${esc(r.by)}` : ''}${r.setOn ? ` ${esc(s.setOn)} ${esc(formatDay(r.setOn, o.lang))}` : ''}</p>
       <ul>${r.items.map((it) => `<li>${esc(exerciseById[it.ex]?.name[o.lang] ?? it.ex)}: ${esc(doseText(it, s))}</li>`).join('')}</ul>`
    : '';
  const weeksHtml = o.weeks.length
    ? `<h2>${esc(s.pdfCompletion)}</h2><table><tr><th>${esc(s.week)}</th><th>${esc(s.pdfPlanned)}</th><th>${esc(s.pdfDone)}</th></tr>${o.weeks
        .map((w) => `<tr><td>${w.week}</td><td>${w.planned}</td><td>${w.done}</td></tr>`)
        .join('')}</table>`
    : '';
  const numbers = safety[o.lang].emergency[o.country].map((n) => `${esc(n.label)} ${esc(n.number)}`).join(' · ');

  return `<!doctype html><html lang="${o.lang}"><head><meta charset="utf-8"><title>${esc(s.pdfTitle)}</title>
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1d2433; font-size: 12px; margin: 28px; }
  h1 { color: #0f4c5c; font-size: 20px; margin: 0 0 4px; }
  h2 { color: #0f4c5c; font-size: 14px; margin: 18px 0 6px; }
  .muted { color: #5b6577; }
  .notice { border: 1.5px solid #b42318; background: #fff5f4; border-radius: 8px; padding: 8px 10px; margin: 12px 0; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 0.5px solid #9aa5b1; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #e6f0f2; }
  footer { margin-top: 18px; font-size: 10px; color: #5b6577; }
</style></head><body>
<h1>${esc(s.pdfTitle)}</h1>
<p class="muted">${esc(s.pdfGenerated)} ${esc(formatDay(o.createdOn, o.lang))}</p>
<div class="notice">${esc(intendedUse.shareNotice[o.lang])}</div>
${routineHtml}
${weeksHtml}
<h2>${esc(s.pdfSessions)} (${sessions.length})</h2>
${sessions.length ? `<table><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr>${rows}</table>` : `<p>${esc(s.noSessionsYet)}</p>`}
<footer>${esc(intendedUse.notice[o.lang])} ${numbers}</footer>
</body></html>`;
}
