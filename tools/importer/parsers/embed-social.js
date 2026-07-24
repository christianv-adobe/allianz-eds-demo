/* eslint-disable */
/* global WebImporter */
/**
 * Parser for embed-social. Base: embed (social variant).
 * Source: https://www.allianz.com/en.html (.parsys .flockler-integration)
 * Generated: 2026-07-23
 *
 * Library convention (Embed, social): 1 column, 2 rows.
 *   Row 1: block name
 *   Row 2: a single cell containing a URL to the external content.
 * The embed-social block reads `block.querySelector('a').href` at runtime and
 * injects the feed, so the parser must emit exactly ONE link/URL — not the
 * pre-rendered Flockler post grid.
 *
 * Source: `.flockler-integration` contains a `<div id="flockler-embed-{hash}">`
 * followed by a fully pre-rendered post grid. We extract the embed hash and emit
 * the canonical Flockler embed URL (https://plugins.flockler.com/embed/{hash}),
 * discarding the pre-rendered posts entirely.
 */
export default function parse(element, { document }) {
  // Locate the Flockler embed container and derive its identifier hash.
  const embedEl = element.querySelector('[id^="flockler-embed-"]')
    || element.querySelector('.flockler-integration-container [id]')
    || element.querySelector('[id*="flockler-embed"]');

  let hash = null;
  if (embedEl && embedEl.id) {
    // id looks like "flockler-embed-18060a8139a0cb2f7768a73588e8f114"
    const m = embedEl.id.match(/flockler-embed-([a-z0-9]+)/i);
    if (m) [, hash] = m;
  }

  // Fallback: derive the hash from the skip-link anchor (#flockler-end-{hash}).
  if (!hash) {
    const skip = element.querySelector('a[href*="flockler-end-"]');
    if (skip) {
      const m = (skip.getAttribute('href') || '').match(/flockler-end-([a-z0-9]+)/i);
      if (m) [, hash] = m;
    }
  }

  // Empty-block guard: no identifiable Flockler embed.
  if (!hash) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Canonical Flockler embed URL that the block loads at runtime.
  const embedUrl = `https://plugins.flockler.com/embed/${hash}`;
  const link = document.createElement('a');
  link.setAttribute('href', embedUrl);
  link.textContent = embedUrl;

  // 1-column embed: one content row, one cell holding the URL.
  const cells = [[link]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-social', cells });
  element.replaceWith(block);
}
