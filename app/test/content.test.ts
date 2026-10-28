/// <reference types="node" />
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { strings } from '../src/lib/i18n';

const root = new URL('../../', import.meta.url);

test('bundled content matches /content (run npm run sync-content)', () => {
  for (const f of readdirSync(new URL('content/', root)).filter((f: string) => f.endsWith('.json'))) {
    assert.equal(readFileSync(new URL(`app/src/content/${f}`, root), 'utf8'), readFileSync(new URL(`content/${f}`, root), 'utf8'), f);
  }
});

test('every UI string exists in both languages', () => {
  for (const k of Object.keys(strings.en) as (keyof typeof strings.en)[]) {
    assert.ok(strings.es[k] !== undefined && strings.es[k] !== '', `es.${k}`);
  }
});

test('UI strings pass the wording rules', async () => {
  const { lintText } = await import(new URL('scripts/lint-wording.mjs', root).href);
  for (const lang of ['en', 'es'] as const) {
    const text = Object.values(strings[lang]).filter((v) => typeof v === 'string').join('\n');
    assert.deepEqual(lintText(text), [], lang);
  }
});
