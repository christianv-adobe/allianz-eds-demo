export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;

  const rows = [...block.children];

  // Drop authored-empty cells (e.g. a blank second column) so the remaining
  // content column can span the full width instead of leaving a dead gap.
  rows.forEach((row) => {
    [...row.children].forEach((col) => {
      const hasMedia = col.querySelector('picture, img, iframe, video');
      if (!hasMedia && col.textContent.trim() === '') {
        col.remove();
      }
    });
  });

  const cols = [...firstRow.children];
  block.classList.add(`columns-feature-${cols.length}-cols`);

  rows.forEach((row) => {
    [...row.children].forEach((col) => {
      // Image-only column.
      const pic = col.querySelector(':scope > picture');
      if (pic && col.children.length === 1) {
        col.classList.add('columns-feature-img-col');
        return;
      }

      // Embedded URL column (e.g. the share-price chart): a single paragraph
      // whose only content is a link pointing at itself. Render as an iframe.
      if (col.children.length === 1) {
        const link = col.querySelector(':scope > p > a:only-child, :scope > a:only-child');
        const href = link ? link.getAttribute('href') || '' : '';
        const isUrlEmbed = link
          && /^https?:\/\//.test(href)
          && link.textContent.trim() === href;
        if (isUrlEmbed) {
          const iframe = document.createElement('iframe');
          iframe.src = href;
          iframe.title = link.textContent.trim();
          iframe.loading = 'lazy';
          iframe.setAttribute('frameborder', '0');
          col.classList.add('columns-feature-embed');
          col.replaceChildren(iframe);
        }
      }
    });
  });

  // 3-column promo shape: two stacked info panels (light + dark) beside an embed.
  if (cols.length === 3) {
    let panelIdx = 0;
    cols.forEach((col) => {
      if (
        col.classList.contains('columns-feature-embed')
        || col.classList.contains('columns-feature-img-col')
      ) {
        return;
      }
      col.classList.add('columns-feature-panel');
      col.classList.add(
        panelIdx === 0 ? 'columns-feature-panel-light' : 'columns-feature-panel-dark',
      );
      panelIdx += 1;
    });
  }
}
