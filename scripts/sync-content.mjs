#!/usr/bin/env node
// Copies content/*.json into app/src/content/ so the app bundles a fixed, versioned copy.
// Run after editing content; app tests fail if the copies drift from the source.
import { readdirSync, copyFileSync, mkdirSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
mkdirSync(`${root}app/src/content`, { recursive: true });
for (const f of readdirSync(`${root}content`).filter((f) => f.endsWith('.json'))) {
  copyFileSync(`${root}content/${f}`, `${root}app/src/content/${f}`);
  console.log(`app/src/content/${f}`);
}
