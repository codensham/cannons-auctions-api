const cheerio = require('cheerio');
const { auctionDateToIso } = require('./auctionTime');

const BASE_URL = 'https://bid.cannonsauctions.com';

/**
 * Parse the HTML response into structured JSON
 */
function parseSearchResults(html, { page, pagesize } = {}) {
  const $ = cheerio.load(html);
  const items = [];

  // "Showing 1001 - 2000 of 4,557 entries". The page links on the page are not reliable
  // (they read page 11 whatever was asked for), so the numbers come from this line and the request.
  const showingText = $('.show-enteries').first().text().replace(/\s+/g, ' ');
  const showingMatch = showingText.match(/([\d,]+)\s*-\s*([\d,]+)\s+of\s+([\d,]+)/);
  const toInt = text => parseInt(text.replace(/,/g, ''), 10);
  const first = showingMatch ? toInt(showingMatch[1]) : 1;
  const last = showingMatch ? toInt(showingMatch[2]) : 0;
  const total = showingMatch ? toInt(showingMatch[3]) : 0;

  const itemsPerPage = pagesize || Math.max(last - first + 1, 1);
  const currentPage = page || Math.floor((first - 1) / itemsPerPage) + 1;
  const totalPages = Math.ceil(total / itemsPerPage);

  // Each auction section starts with an "Auction :" h4 followed by its lots.
  // Walk the page in document order so every lot gets the nearest heading above it.
  let auctionTitle = 'Unknown Auction';

  $('h4, .bg-white.border').each((_, lotElement) => {
    const $lot = $(lotElement);

    if ($lot.is('h4')) {
      const headingText = $lot.text();
      if (headingText.includes('Auction :')) {
        auctionTitle = headingText.replace('Auction :', '').trim();
      }
      return;
    }

    // Extract lot number from linkbuttons span
    const lotText = $lot.find('.linkbuttons').first().text();
    const lotMatch = lotText.match(/Lot\s*-\s*(\d+)/i);
    const lotNumber = lotMatch ? lotMatch[1] : null;

    if (!lotNumber) return;

    // Extract item title (may be empty)
    const itemTitle = $lot.find('.auction-Itemlist-Title a').text().trim();

    // Extract current bid
    const bidText = $lot.find('.font-1rem').text();
    const bidMatch = bidText.match(/Current Bid\s*:\s*([\d,.]+)/);
    const currentBid = bidMatch ? parseFloat(bidMatch[1].replace(/,/g, '')) : null;

    // Extract end date
    const endDateStr = $lot.find('.local-date-time').data('auc-date');
    const endDate = auctionDateToIso(endDateStr);

    // Extract image URLs
    const images = [];
    $lot.find('.carousel-item img').each((_, img) => {
      const src = $(img).attr('src');
      if (src && !src.includes('arrow-angel') && !src.includes('placeholder')) {
        const fullSrc = src.replace(/-100x100\.jpg$/, '.jpg');
        images.push(fullSrc);
      }
    });

    // Extract detail URL and IDs
    const detailLink = $lot.find('.Auction-item-list a').first().attr('href');
    let itemId = null;
    let auctionId = null;
    let pageNumber = null;
    let pageSize = null;

    if (detailLink) {
      const urlParams = new URLSearchParams(detailLink.split('?')[1]);
      itemId = urlParams.get('AuctionItemId');
      auctionId = urlParams.get('AuctionId');
      pageNumber = urlParams.get('pageNumber');
      pageSize = urlParams.get('pageSize');
    }

    // Extract thumbnail
    const thumbnail = $lot.find('.carousel-item.active img').attr('src') || null;

    items.push({
      lotNumber,
      title: itemTitle || `Lot ${lotNumber}`,
      description: null, // Description only available on item detail page
      auctionTitle: auctionTitle || 'Unknown Auction',
      currentBid,
      endDate,
      images,
      thumbnail,
      detailUrl: detailLink ? `${BASE_URL}${detailLink}` : null,
      ids: {
        itemId,
        auctionId,
        pageNumber,
        pageSize
      }
    });
  });

  return {
    items,
    pagination: {
      currentPage,
      totalPages,
      totalItems: total,
      itemsPerPage
    }
  };
}

module.exports = { parseSearchResults };
