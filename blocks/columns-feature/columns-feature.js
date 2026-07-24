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

  // 2-column feature rows sit on a light-blue band. Pull the intro that
  // precedes the FIRST such row onto the same band so the heading + intro share
  // the band (matches "Insights & Specials" and "Careers at Allianz Group").
  // The intro is either a default-content heading wrapper or a single-column
  // columns-feature block (heading + paragraph). A pill row sharing the heading
  // wrapper is split off into its own white wrapper so only the heading bands.
  if (cols.length === 2) {
    const wrapper = block.closest('.columns-feature-wrapper');
    const prev = wrapper && wrapper.previousElementSibling;
    const prevIsIntro = prev
      && (prev.classList.contains('default-content-wrapper')
        || prev.querySelector('.columns-feature-1-cols'));
    // avoid double-banding when the band was already extended upward
    const prevPrev = prev && prev.previousElementSibling;
    const alreadyBanded = prevPrev && prevPrev.classList.contains('content-band');
    if (prev && prevIsIntro && !prev.classList.contains('content-band') && !alreadyBanded) {
      const heading = prev.querySelector('h2, h3');
      if (heading) {
        const dcw = prev.classList.contains('default-content-wrapper') ? prev : null;
        if (dcw) {
          const kids = [...dcw.children];
          const pills = dcw.querySelector(':scope > .link-group');
          if (pills && kids.indexOf(pills) < kids.indexOf(heading)) {
            const pillsWrapper = document.createElement('div');
            pillsWrapper.className = 'default-content-wrapper';
            dcw.before(pillsWrapper);
            pillsWrapper.append(pills);
          }
        }
        prev.classList.add('content-band');
      }
    }
  }
}
