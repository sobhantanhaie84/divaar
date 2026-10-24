import { test, assert } from './harness.js';
import {
  highlight,
  matchesQuery,
  normalizeText,
  searchAds,
  tokenize,
} from '../src/search/match.js';
import { normalizeAd } from '../src/ads/model.js';

const sample = [
  normalizeAd({ id: 'a', title: 'آیفون ۱۳ ۱۲۸ گیگ', city: 'تهران', category: 'موبایل' }),
  normalizeAd({ id: 'b', title: 'كتاب داستان كودكان', city: 'مشهد', category: 'کتاب' }),
  normalizeAd({ id: 'c', title: 'مبل راحتی', city: 'مشهد', category: 'خانه و آشپزخانه' }),
];

test('normalizeText folds arabic letter forms and removes ZWNJ', () => {
  assert.equal(normalizeText('كتاب'), 'کتاب');
  assert.equal(normalizeText('آیفون'), 'ایفون');
  assert.equal(normalizeText('جست‌وجو'), 'جست وجو');
  assert.equal(normalizeText('مُبل'), 'مبل');
  assert.equal(normalizeText('  چند   فاصله  '), 'چند فاصله');
});

test('tokenize returns folded tokens and drops empties', () => {
  assert.deepEqual(tokenize('  مبل   مشهد '), ['مبل', 'مشهد']);
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize(null), []);
});

test('an empty query matches everything and returns the same array', () => {
  assert.equal(matchesQuery(sample[0], ''), true);
  assert.equal(searchAds(sample, ''), sample);
});

test('matching is insensitive to alef/yeh/kaf variants', () => {
  assert.equal(matchesQuery(sample[0], 'ایفون'), true);
  assert.equal(matchesQuery(sample[1], 'کتاب'), true);
  assert.equal(matchesQuery(sample[1], 'کودکان'), true);
});

test('tokens combine with AND semantics', () => {
  assert.equal(matchesQuery(sample[2], 'مبل مشهد'), true);
  assert.equal(matchesQuery(sample[2], 'مبل تهران'), false);
});

test('searchAds narrows by title, city and category', () => {
  assert.deepEqual(searchAds(sample, 'مشهد').map((ad) => ad.id), ['b', 'c']);
  assert.deepEqual(searchAds(sample, 'موبایل').map((ad) => ad.id), ['a']);
  assert.deepEqual(searchAds(sample, 'یخچال'), []);
});

test('highlight escapes markup and wraps matches', () => {
  const html = highlight('<b>آیفون</b>', 'ایفون');
  assert.ok(html.includes('<mark class="search-mark">آیفون</mark>'));
  assert.ok(html.includes('&lt;b&gt;'));
  assert.ok(!html.includes('<b>'));
});

test('highlight ignores one-letter tokens and regex metacharacters', () => {
  assert.equal(highlight('مبل', 'م'), 'مبل');
  assert.doesNotThrow(() => highlight('قیمت (تومان)', '('));
  assert.equal(highlight('abc', '.*'), 'abc');
});
