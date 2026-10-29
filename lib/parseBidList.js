const cheerio = require('cheerio');
const { auctionDateToIso } = require('./auctionTime');

const toMoney = text => {
  const value = parseFloat(String(text).replace(/[^\d.]/g, ''));
  return Number.isFinite(value) ? value : null;
};

/**
 * Parse Cannons' bid list table (/Public/Auction/GetBidlist). Its columns are Bidder (masked, e.g. "4***4"),
 * Amount (the bid placed, which can be a maximum), Current (the lot's price after that bid), Winning
 * (who leads after it), Received Date (Central time) and Bid#. Returns the bids oldest first.
 */
function parseBidList(html) {
  const $ = cheerio.load(html);
  const bids = [];
  $('table tbody tr').each((_, row) => {
    const cells = $(row).children('td');
    if (cells.length < 6) return;
    // The Bid# cell also holds a hidden copy of the previous number
    const numberCell = $(cells[5]).clone();
    numberCell.find('.hide').remove();
    bids.push({
      bidNumber: parseInt(numberCell.text().trim(), 10) || null,
      bidder: $(cells[0]).text().trim(),
      amount: toMoney($(cells[1]).text()),
      price: toMoney($(cells[2]).text()),
      leader: $(cells[3]).text().trim(),
      time: auctionDateToIso($(cells[4]).find('[data-auc-date]').attr('data-auc-date')),
    });
  });
  return bids.sort((a, b) => (a.bidNumber ?? 0) - (b.bidNumber ?? 0));
}

/**
 * From a lot's detail page: the numeric id the bid list needs, and the starting bid.
 */
function parseBidContext(detailHtml) {
  const $ = cheerio.load(detailHtml);
  const numericId = $('input#AuctionItemId').first().val() || null;
  const startingText = $('label')
    .filter((_, el) => $(el).text().trim() === 'Starting Bid')
    .first()
    .next()
    .text();
  return { numericId, startingBid: toMoney(startingText) };
}

module.exports = { parseBidList, parseBidContext };
