// Makes a routine QR code (PNG + the text code) for a physio or coach to show at a visit.
// Phase 1 stand-in for the Phase 2 web routine builder.
//   npx tsx scripts/make-routine-qr.mts routine.json out/routine   → out/routine.png, out/routine.txt
// routine.json follows the Routine type in src/lib/routineCode.ts, or { "template": "<template id>" } plus overrides.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { exercises, templates } from '../src/lib/content';
import { decodeRoutine, encodeRoutine, type Routine } from '../src/lib/routineCode';

const require = createRequire(import.meta.url);
const QRCode = require('qrcode');

const [input, out] = process.argv.slice(2);
if (!input || !out) {
  console.error('Usage: npx tsx scripts/make-routine-qr.mts routine.json out/name');
  process.exit(1);
}
const { template: templateId, ...overrides } = JSON.parse(readFileSync(input, 'utf8'));
const template = templateId ? templates.find((t) => t.id === templateId) : undefined;
if (templateId && !template) throw new Error(`Unknown template ${templateId}`);
const routine: Routine = { source: 'prescribed', days: template?.days ?? [], items: template?.items ?? [], ...overrides };

const code = encodeRoutine(routine);
decodeRoutine(code, new Set(exercises.map((e) => e.id))); // throws if the routine is invalid
await QRCode.toFile(`${out}.png`, code, { errorCorrectionLevel: 'M', width: 600, margin: 2 });
writeFileSync(`${out}.txt`, code + '\n');
console.log(`${out}.png (${code.length} chars)`);
