/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-feature. Base: columns.
 * Source: https://www.allianz.com/en.html
 *   - .parsys .multi-column-grid:has(.c-iframe)                       (3-col promo)
 *   - .parsys .multi-column-grid:has(.column.l-grid__column-large-8)  (2-col image+text)
 * Generated: 2026-07-23
 *
 * Library convention (Columns): flexible grid. Row 1 = block name; the next row
 * holds one cell per visual column. This variant covers two shapes that share the
 * same `.multi-column-grid > div > .l-grid__row > .column` structure:
 *   Shape A (3 columns): [Investor Relations text+links] | [Results text+link] |
 *     [share-price chart iframe -> preserved as an embed link/URL]
 *   Shape B (2 columns): a large-8 text column and a large-4 image column; the
 *     image/text order varies (image-left or text-left).
 * Each top-level `.column` becomes one cell so the visual layout is preserved.
 */
export default function parse(element, { document }) {
  // Top-level grid row only — text columns can contain a NESTED .multi-column-grid
  // with its own .l-grid__row, so restrict to the direct child row.
  const row = element.querySelector(':scope > div > .l-grid__row')
    || element.querySelector('.l-grid__row');
  if (!row) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Direct column children of this row (skip the nested grids' columns).
  const columns = Array.from(row.children).filter((c) => c.classList.contains('column'));
  if (!columns.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const rowCells = columns.map((col) => {
    // 1) Iframe column (share-price chart) -> preserve as an embed link/URL so the
    //    chart can be reconstructed rather than dumping non-portable iframe markup.
    const iframe = col.querySelector('iframe, .c-iframe');
    if (iframe) {
      const src = iframe.getAttribute('src') || iframe.getAttribute('data-src');
      if (src) {
        const a = document.createElement('a');
        a.setAttribute('href', src);
        a.textContent = src;
        return [a];
      }
    }

    // 2) Image-only column -> reference the <img> so src/alt are preserved.
    const picture = col.querySelector('picture');
    const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
    if (picture && !heading) {
      const img = picture.querySelector('img') || picture;
      return [img];
    }

    // 3) Text column -> curated content: heading, body copy, then CTA links.
    //    Curating (instead of dumping the deeply-nested wrapper divs) keeps the
    //    markdown clean and avoids the nested grid's wrapper noise.
    const parts = [];
    if (heading) parts.push(heading);

    // Body copy blocks (skip empty/whitespace-only ones).
    col.querySelectorAll('.text .c-copy, :scope > .c-copy, .c-copy').forEach((copy) => {
      // Only take a copy block that is not nested inside another already-added copy.
      if (copy.closest('.link')) return;
      if (copy.textContent && copy.textContent.replace(/\s+/g, ' ').trim().length) {
        if (!parts.includes(copy)) parts.push(copy);
      }
    });

    // CTA links (Power of Unity Hub, More, Results, etc.). Dedupe by href.
    const seen = new Set();
    col.querySelectorAll('.link a[href], a.c-link[href], a.c-button[href], a[href]').forEach((a) => {
      // Skip links already contained within a copy block we pushed.
      const href = a.getAttribute('href');
      if (!href || seen.has(href)) return;
      const inPushedCopy = parts.some((p) => p !== a && p.contains && p.contains(a));
      if (inPushedCopy) return;
      seen.add(href);
      parts.push(a);
    });

    // Fallback: if curation found nothing meaningful, use the whole column.
    if (!parts.length) return [col];
    return [parts];
  });

  // cells is a single content row: one cell per column.
  const cells = [rowCells.map((cell) => (Array.isArray(cell) && cell.length === 1 ? cell[0] : cell))];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-feature', cells });
  element.replaceWith(block);
}
