// Cannons writes auction end times as wall-clock text ("MM/DD/YYYY HH:MM:SS") in Central time.
// Parsing that with new Date() would use the machine's own zone, so the result changes with the PC.
const AUCTION_ZONE = 'America/Chicago';
const PATTERN = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: AUCTION_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// How far the zone's wall clock is ahead of UTC at this instant, in milliseconds
function zoneOffsetMs(instant) {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * Convert an auction end time to an ISO UTC string.
 * Returns null when the text is missing or not in the expected format.
 */
function auctionDateToIso(text) {
  const match = PATTERN.exec((text || '').trim());
  if (!match) return null;
  const [, month, day, year, hour, minute, second] = match.map(Number);
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  // Two passes handle the hour either side of a daylight-saving change
  const first = wallAsUtc - zoneOffsetMs(wallAsUtc);
  const instant = wallAsUtc - zoneOffsetMs(first);
  return new Date(instant).toISOString();
}

module.exports = { auctionDateToIso, AUCTION_ZONE };
