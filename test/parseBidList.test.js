const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseBidList, parseBidContext } = require('../lib/parseBidList');

const html = fs.readFileSync(path.join(__dirname, 'fixtures', 'bidlist.html'), 'utf8');

test('bids come back oldest first with the price after each one', () => {
  const bids = parseBidList(html);
  assert.equal(bids.length, 13);
  assert.deepEqual(bids.map(b => b.bidNumber), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  const prices = bids.map(b => b.price);
  assert.deepEqual([...prices].sort((a, b) => a - b), prices, 'the price only goes up');
  assert.deepEqual(bids[12], {
    bidNumber: 13,
    bidder: '4***4',
    amount: 53.09,
    price: 53.09,
    leader: '4***4',
    // 4:57:27 PM Central is 21:57:27 UTC
    time: '2026-10-29T21:57:27.000Z',
  });
});

test('the detail page gives the numeric lot id and the starting bid', () => {
  const detail = `
    <input id="AuctionItemId" name="AuctionItemId" type="hidden" value="49258563" />
    <div><label class="text-muted mb-0">Starting Bid</label><p class="font-weight-600 mb-2">3.00</p></div>`;
  assert.deepEqual(parseBidContext(detail), { numericId: '49258563', startingBid: 3 });
  assert.deepEqual(parseBidContext('<p>nothing</p>'), { numericId: null, startingBid: null });
});
