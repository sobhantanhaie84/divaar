/**
 * Tiny zero-dependency harness shared by the *.test.js files.
 * Keep it boring: collect, run, print, exit non-zero on failure.
 */
import assert from 'node:assert/strict';

export { assert };

const registry = [];

export function test(name, fn) {
  registry.push({ name, fn });
}

export async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of registry) {
    try {
      await fn();
      passed += 1;
      console.log(`  \u001b[32m✔\u001b[0m ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`  \u001b[31m✘\u001b[0m ${name}`);
      console.error(`    ${String(error.message).split('\n').join('\n    ')}`);
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed, ${registry.length} total\n`);
  if (failed > 0) process.exitCode = 1;
  return { passed, failed, total: registry.length };
}
