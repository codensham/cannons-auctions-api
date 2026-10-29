const { test } = require('node:test');
const assert = require('node:assert/strict');
const { htmlToText } = require('../lib/htmlToText');

test('paragraph and div tags are removed', () => {
  assert.equal(
    htmlToText('<p>Vintage 14K yellow gold ring size 5.5.</p>'),
    'Vintage 14K yellow gold ring size 5.5.',
  );
  assert.equal(htmlToText('<div>Dainty 10K ring.</div>'), 'Dainty 10K ring.');
});

test('blocks and line breaks become new lines; entities and non-breaking spaces are decoded', () => {
  assert.equal(
    htmlToText('<p>14K&nbsp;gold bar ring &amp; two bands.</p><p>Total weight 3.2g</p>'),
    '14K gold bar ring & two bands.\nTotal weight 3.2g',
  );
  assert.equal(htmlToText('Line one<br>Line two<br/>'), 'Line one\nLine two');
});

test('plain text is left alone', () => {
  assert.equal(htmlToText('  Nintendo 64 console  '), 'Nintendo 64 console');
  assert.equal(htmlToText(undefined), '');
});
