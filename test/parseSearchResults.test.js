const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseSearchResults } = require('../lib/parseSearchResults');

const html = fs.readFileSync(path.join(__dirname, 'fixtures', 'search-multi-auction.html'), 'utf8');

test('each lot gets the title of its own auction', () => {
  const { items } = parseSearchResults(html);
  const byAuction = new Map();
  for (const item of items) {
    if (!byAuction.has(item.ids.auctionId)) byAuction.set(item.ids.auctionId, new Set());
    byAuction.get(item.ids.auctionId).add(item.auctionTitle);
  }

  assert.equal(byAuction.size, 5, 'fixture holds five auctions');
  for (const titles of byAuction.values()) {
    assert.equal(titles.size, 1, 'one auction ID maps to one title');
  }

  const titles = [...byAuction.values()].map(set => [...set][0]);
  assert.equal(new Set(titles).size, 5, 'the five auctions get five different titles');
});

test('auction titles have no "Auction :" prefix', () => {
  const { items } = parseSearchResults(html);
  for (const item of items) {
    assert.ok(!item.auctionTitle.includes('Auction :'), item.auctionTitle);
  }
});

test('a lot from the Vintage Gaming auction gets its own name', () => {
  const { items } = parseSearchResults(html);
  const lego = items.find(item => item.ids.auctionId.startsWith('gohBGDq+vm'));
  assert.equal(lego.auctionTitle, '10/31/26: Vintage Gaming, LEGO, Toys & Collectibles | Ample Seller | Richmond VA 23227');
});
