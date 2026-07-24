/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-stats. Base: cards (no images variant).
 * Source: https://www.allianz.com/en.html (.parsys .multi-column-grid:has(.azcom-statistics))
 * Generated: 2026-07-23
 *
 * Library convention (Cards, no images): 1 column, one row per card.
 *   The single cell holds: heading (the statistic value), description (bold label),
 *   and optional CTA / as-of date below.
 *
 * Source: a `.multi-column-grid` whose row has 4 `.column` children, each a stat:
 *   .statistics .azcom-statistics .statistic  -> the big value (e.g. "156,000")
 *   .text .c-copy (bold)                       -> the label
 *   .text .c-copy--small                       -> "As of: ..." date (may contain a "See" link)
 */
export default function parse(element, { document }) {
  const row = element.querySelector(':scope > div > .l-grid__row')
    || element.querySelector('.l-grid__row');
  if (!row) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const stats = Array.from(row.children).filter((c) => c.classList.contains('column'));
  if (!stats.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  stats.forEach((stat) => {
    const contentCell = [];

    // Statistic value -> heading.
    const valueEl = stat.querySelector('.azcom-statistics .statistic, .statistic');
    if (valueEl && valueEl.textContent.trim()) {
      const h = document.createElement('h3');
      h.textContent = valueEl.textContent.trim();
      contentCell.push(h);
    }

    // Text blocks: bold label (.c-copy) then as-of date (.c-copy--small).
    // Preserve order and keep any inline links (e.g. "See ...").
    stat.querySelectorAll('.text .c-copy').forEach((copy) => {
      if (copy.textContent && copy.textContent.replace(/\s+/g, ' ').trim().length) {
        contentCell.push(copy);
      }
    });

    // Skip degenerate stat columns.
    if (!contentCell.length) return;

    // "No images" variant is a single column: one row, one cell holding all content.
    cells.push([contentCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stats', cells });
  element.replaceWith(block);
}
