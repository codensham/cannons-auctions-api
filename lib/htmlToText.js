const cheerio = require('cheerio');

// Lot descriptions on Cannons are sometimes HTML ("<p>14K gold ring…</p>", "<div>…</div>").
// Keep only the text, with a line break where each block or <br> was.
function htmlToText(value) {
  const text = (value || '').trim();
  if (!/[<&]/.test(text)) return text;
  const withBreaks = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n');
  const $ = cheerio.load(`<body>${withBreaks}</body>`);
  return $('body')
    .text()
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n[\s]*/g, '\n')
    .trim();
}

module.exports = { htmlToText };
