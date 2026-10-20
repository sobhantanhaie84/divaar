import { test, assert } from './harness.js';
import { clamp, debounce, escapeHtml, formatDate, formatPrice, toFa } from '../src/utils.js';

test('toFa converts latin digits to Persian', () => {
  assert.equal(toFa('1405/08/02'), '۱۴۰۵/۰۸/۰۲');
});

test('formatPrice groups thousands and appends currency', () => {
  const label = formatPrice(25_000_000);
  assert.match(label, /تومان$/);
  assert.ok(label.includes('۲۵'), `expected ۲۵ in ${label}`);
  assert.ok(!/[0-9]/.test(label), 'price must not contain latin digits');
});

test('formatPrice treats 0 as negotiable and null as unknown', () => {
  assert.equal(formatPrice(0), 'توافقی');
  assert.equal(formatPrice(null), 'نامشخص');
});

test('escapeHtml neutralises markup', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});

test('debounce runs once with the last arguments', async () => {
  let calls = 0;
  let last = null;
  const fn = debounce((value) => {
    calls += 1;
    last = value;
  }, 10);
  fn('a');
  fn('b');
  fn('c');
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(calls, 1);
  assert.equal(last, 'c');
});

test('formatDate renders a non-empty persian date', () => {
  const label = formatDate('2026-10-24T09:30:00+03:30');
  assert.ok(label.length > 0);
  assert.ok(!/[0-9]/.test(label), `expected persian digits, got ${label}`);
});

test('clamp keeps values inside bounds', () => {
  assert.equal(clamp(12, 0, 10), 10);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(4, 0, 10), 4);
});
