/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-teaser. Base: carousel.
 * Source: https://www.allianz.com/en.html (.carousel.container .js-carousel-three-column)
 * Generated: 2026-07-23
 *
 * Library convention (Carousel): 2 columns, one row per slide.
 *   Cell 1: image (mandatory, no other content)
 *   Cell 2: title (heading), description/additional content, CTA link (optional)
 *
 * Source: each slide is a `.c-teaser` whose whole card is wrapped in an
 * `<a class="c-teaser__link-area" href>`. Inside: picture, h2 title, and a
 * `.c-carousel__content--teaser .c-copy` block holding a date + description.
 * We preserve the teaser link by making the title a linked heading.
 */
export default function parse(element, { document }) {
  const slides = Array.from(
    element.querySelectorAll('.c-carousel__three-column__slide, .swiper-slide'),
  );

  const cells = [];

  slides.forEach((slide) => {
    const teaser = slide.querySelector('.c-teaser') || slide;
    const link = teaser.querySelector('a.c-teaser__link-area, a[href]');
    const href = link ? link.getAttribute('href') : null;

    // Image cell (mandatory).
    const img = teaser.querySelector('picture img, img.c-image__img, img');

    // Title heading.
    const heading = teaser.querySelector('h1, h2, h3, h4, h5, h6');

    // Description / additional content (date + body). Take meaningful direct
    // children of the copy container, skipping empty (&nbsp;) spacers.
    const copyContainer = teaser.querySelector('.c-carousel__content--teaser .c-copy, .c-copy');
    const copyEls = [];
    if (copyContainer) {
      Array.from(copyContainer.querySelectorAll(':scope > p, :scope > div')).forEach((el) => {
        if (el.textContent && el.textContent.replace(/ /g, '').trim().length) {
          copyEls.push(el);
        }
      });
    }

    // Skip degenerate slides that have neither image nor text.
    if (!img && !heading && !copyEls.length) return;

    // Preserve the teaser link by turning the title into a linked heading.
    if (heading && href) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      while (heading.firstChild) a.appendChild(heading.firstChild);
      heading.appendChild(a);
    }

    // Build the content cell (single cell that holds title + description).
    const contentCell = [];
    if (heading) contentCell.push(heading);
    copyEls.forEach((el) => contentCell.push(el));

    // Each row = [imageCell, contentCell]. Pad missing image so columns stay even.
    cells.push([img || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-teaser', cells });
  element.replaceWith(block);
}
