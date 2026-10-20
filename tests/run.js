/**
 * Test entry point. Every `tests/*.test.js` file is picked up automatically,
 * so a feature branch only has to add its own file — no shared line to edit.
 *
 * Usage: `npm test` (or `node tests/run.js`).
 */
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runTests } from './harness.js';

const here = dirname(fileURLToPath(import.meta.url));
const files = (await readdir(here)).filter((file) => file.endsWith('.test.js')).sort();

for (const file of files) {
  await import(pathToFileURL(join(here, file)).href);
}

await runTests();
