import { test, assert } from './harness.js';
import { ads } from '../src/data/ads.js';
import { getCities, getPriceBounds, normalizeAd, normalizeAds } from '../src/ads/model.js';
import { renderAdCard } from '../src/ads/card.js';

test('normalizeAd coerces bad prices to a safe number', () => {
  assert.equal(normalizeAd({ title: 'x', price: 'abc' }).price, 0);
  assert.equal(normalizeAd({ title: 'x', price: -5 }).price, 0);
  assert.equal(normalizeAd({ title: 'x', price: '1250000' }).price, 1_250_000);
  assert.equal(normalizeAd({ title: 'x', price: 1e15 }).price, 100_000_000_000);
});

test('normalizeAd trims titles and fills defaults', () => {
  const ad = normalizeAd({ title: '  مبلمان  ' });
  assert.equal(ad.title, 'مبلمان');
  assert.equal(ad.city, 'نامشخص');
  assert.equal(ad.category, 'سایر');
  assert.ok(ad.id.startsWith('ad-'));
});

test('normalizeAds sorts newest first and is stable for ties', () => {
  const sorted = normalizeAds([
    { id: 'b', postedAt: '2026-01-02T00:00:00Z' },
    { id: 'a', postedAt: '2026-01-02T00:00:00Z' },
    { id: 'c', postedAt: '2026-03-01T00:00:00Z' },
  ]);
  assert.deepEqual(sorted.map((ad) => ad.id), ['c', 'a', 'b']);
});

test('normalizeAds sends invalid dates to the bottom', () => {
  const sorted = normalizeAds([
    { id: 'bad', postedAt: 'not-a-date' },
    { id: 'good', postedAt: '2026-05-01T00:00:00Z' },
  ]);
  assert.deepEqual(sorted.map((ad) => ad.id), ['good', 'bad']);
});

test('getCities returns unique, alphabetically sorted city names', () => {
  const cities = getCities(normalizeAds(ads));
  assert.equal(new Set(cities).size, cities.length);
  assert.ok(cities.includes('تهران'));
  assert.deepEqual(cities, [...cities].sort((a, b) => a.localeCompare(b, 'fa')));
});

test('getPriceBounds ignores negotiable listings', () => {
  const bounds = getPriceBounds(normalizeAds(ads));
  assert.ok(bounds.min > 0);
  assert.ok(bounds.max >= bounds.min);
  assert.ok(!normalizeAds(ads).some((ad) => ad.price === bounds.min && ad.price === 0));
});

test('getPriceBounds survives an empty inventory', () => {
  assert.deepEqual(getPriceBounds([]), { min: 0, max: 0 });
});

test('renderAdCard escapes user supplied markup', () => {
  const html = renderAdCard(
    normalizeAd({ id: 'ad-1', title: '<script>alert(1)</script>', price: 0, city: '<b>' }),
  );
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&lt;b&gt;'));
});

test('renderAdCard renders price and negotiable state', () => {
  const priced = renderAdCard(normalizeAd({ title: 't', price: 2_500_000 }));
  assert.ok(priced.includes('تومان'));
  assert.ok(!/[0-9]/.test(priced.match(/ad-card__price[^>]*>\s*([^<]+)/)[1]));

  const free = renderAdCard(normalizeAd({ title: 't', price: 0 }));
  assert.ok(free.includes('توافقی'));
  assert.ok(free.includes('ad-card__price--free'));
});
