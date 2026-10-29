const { test } = require('node:test');
const assert = require('node:assert/strict');
const { auctionDateToIso } = require('../lib/auctionTime');

// Lot 1 on the Raintree Estate sale: the page shows "Thu Oct 29 2026 6:00 PM" Eastern,
// and its data-auc-date attribute reads 17:00 Central. Both are 22:00 UTC.
test('Central wall-clock time converts to UTC (CDT, UTC-5)', () => {
  assert.equal(auctionDateToIso('10/29/2026 17:00:00'), '2026-10-29T22:00:00.000Z');
});

test('Standard time in winter (CST, UTC-6)', () => {
  assert.equal(auctionDateToIso('01/15/2027 12:00:00'), '2027-01-15T18:00:00.000Z');
});

test('Result does not depend on the machine zone', () => {
  // Same answer whatever TZ the process runs in, because the zone is named explicitly
  const before = process.env.TZ;
  try {
    process.env.TZ = 'Asia/Tokyo';
    assert.equal(auctionDateToIso('10/29/2026 17:00:00'), '2026-10-29T22:00:00.000Z');
  } finally {
    process.env.TZ = before;
  }
});

test('Missing or malformed text gives null', () => {
  assert.equal(auctionDateToIso(undefined), null);
  assert.equal(auctionDateToIso(''), null);
  assert.equal(auctionDateToIso('not a date'), null);
});
