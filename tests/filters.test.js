import { test, assert } from './harness.js';
import {
  applyFilters,
  filterByCity,
  filterByPrice,
  normalizeRange,
  parseNumber,
  sortAds,
} from '../src/filters/query.js';
import { normalizeAd } from '../src/ads/model.js';
import { formatPrice } from '../src/utils.js';

const make = (overrides) =>
  normalizeAd({
    id: overrides.id,
    title: overrides.title ?? 'آگهی',
    price: overrides.price ?? 0,
    city: overrides.city ?? 'تهران',
    postedAt: overrides.postedAt ?? '2026-10-01T00:00:00+03:30',
  });

const ads = [
  make({ id: 'cheap', price: 1_000_000, city: 'مشهد', postedAt: '2026-10-20T00:00:00+03:30' }),
  make({ id: 'mid', price: 8_000_000, city: 'تهران', postedAt: '2026-10-25T00:00:00+03:30' }),
  make({ id: 'pricey', price: 40_000_000, city: 'تهران', postedAt: '2026-10-10T00:00:00+03:30' }),
  make({ id: 'free', price: 0, city: 'مشهد', postedAt: '2026-10-28T00:00:00+03:30' }),
];

test('parseNumber accepts persian digits, separators and stray text', () => {
  assert.equal(parseNumber('۱۲٬۵۰۰٬۰۰۰'), 12_500_000);
  assert.equal(parseNumber('12,500,000'), 12_500_000);
  assert.equal(parseNumber('۱۲۵۰۰۰۰۰ تومان'), 12_500_000);
  assert.equal(parseNumber(' 4200 '), 4200);
});

test('parseNumber returns null for empty or non-numeric input', () => {
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('   '), null);
  assert.equal(parseNumber('tomans'), null);
  assert.equal(parseNumber(null), null);
});

test('normalizeRange swaps reversed bounds instead of emptying the grid', () => {
  assert.deepEqual(normalizeRange(900, 100), { minPrice: 100, maxPrice: 900 });
  assert.deepEqual(normalizeRange(null, 100), { minPrice: null, maxPrice: 100 });
  assert.deepEqual(normalizeRange(100, null), { minPrice: 100, maxPrice: null });
});

test('filterByCity returns everything for the "all" sentinel', () => {
  assert.equal(filterByCity(ads, 'all').length, 4);
  assert.deepEqual(filterByCity(ads, 'تهران').map((ad) => ad.id), ['mid', 'pricey']);
  assert.deepEqual(filterByCity(ads, 'رشت'), []);
});

test('filterByPrice skips negotiable listings when a bound is set', () => {
  const ids = filterByPrice(ads, { minPrice: 1_000_000, maxPrice: 8_000_000 }).map((ad) => ad.id);
  assert.deepEqual(ids.sort(), ['cheap', 'mid']);
  assert.equal(filterByPrice(ads, {}).length, 4);
  assert.deepEqual(filterByPrice(ads, { minPrice: 1_000_000 }).map((ad) => ad.id).includes('free'), false);
});

test('sortAds keeps negotiable listings last in both directions', () => {
  assert.deepEqual(sortAds(ads, 'price-asc').map((ad) => ad.id), ['cheap', 'mid', 'pricey', 'free']);
  assert.deepEqual(sortAds(ads, 'price-desc').map((ad) => ad.id), ['pricey', 'mid', 'cheap', 'free']);
});

test('sortAds "newest" orders by posted timestamp', () => {
  assert.deepEqual(sortAds(ads, 'newest').map((ad) => ad.id), ['free', 'mid', 'cheap', 'pricey']);
});

test('sortAds falls back to "newest" for unknown sort keys', () => {
  assert.deepEqual(
    sortAds(ads, 'on-sale').map((ad) => ad.id),
    sortAds(ads, 'newest').map((ad) => ad.id),
  );
});

test('sortAds does not mutate the input array', () => {
  const input = [...ads];
  sortAds(input, 'price-asc');
  assert.deepEqual(input.map((ad) => ad.id), ads.map((ad) => ad.id));
});

test('applyFilters composes city, range and sort', () => {
  const result = applyFilters(ads, { city: 'تهران', minPrice: 2_000_000, maxPrice: 50_000_000, sort: 'price-desc' });
  assert.deepEqual(result.map((ad) => ad.id), ['pricey', 'mid']);
});

test('applyFilters with default state behaves like the plain list', () => {
  const result = applyFilters(ads, { city: 'all', minPrice: null, maxPrice: null, sort: 'newest' });
  assert.deepEqual(result.map((ad) => ad.id), ['free', 'mid', 'cheap', 'pricey']);
});

test('persian price labels survive the round trip through parseNumber', () => {
  const label = formatPrice(12_500_000);
  assert.equal(parseNumber(label), 12_500_000);
});
