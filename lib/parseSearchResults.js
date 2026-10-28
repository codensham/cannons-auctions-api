const cheerio = require('cheerio');

const BASE_URL = 'https://bid.cannonsauctions.com';

/**
 * Parse the HTML response into structured JSON
 */
function parseSearchResults(html) {
  const $ = cheerio.load(html);
  const items = [];

  // Get total count from "Showing X - Y of Z entries"
  const showingText = $('.show-enteries').text().trim();
  const totalMatch = showingText.match(/of\s+([\d,]+)/);
  const total = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : 0;

  // Get current page from pagination
  const currentPageMatch = $('.pagination .page-item.active a').text().trim();
  const currentPage = parseInt(currentPageMatch) || 1;

  const totalPages = Math.ceil(total / 100);

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
    const endDate = endDateStr ? new Date(endDateStr) : null;

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
      endDate: endDate ? endDate.toISOString() : null,
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
      itemsPerPage: 100
    }
  };
}

module.exports = { parseSearchResults };
