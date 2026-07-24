/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-stage. Base: hero.
 * Source: https://www.allianz.com/en.html (.stage.container .c-stage)
 * Generated: 2026-07-23
 *
 * Library convention (Hero): 1 column, 3 rows.
 *   Row 1: block name
 *   Row 2: background image (optional)
 *   Row 3: title (heading), subheading (optional), CTA (optional)
 * The hero-stage block JS keys the background off `:scope > div:first-child picture`,
 * so the image MUST be the first content row.
 */
export default function parse(element, { document }) {
  // Background image (optional). Reference the <img> so markdown conversion keeps src/alt.
  const bgImage = element.querySelector(
    '.c-stage__image img, picture.c-stage__image img, img.abovethefoldimage, picture img',
  );

  // Headline styled as a heading.
  const heading = element.querySelector(
    '.headline h1, .headline h2, .c-stage__content h1, .c-stage__content h2, h1, h2',
  );

  // CTA button(s). Primary path: buttons in the paragraph content; fall back to any styled link.
  let ctaLinks = Array.from(element.querySelectorAll('.button.parbase a'));
  if (!ctaLinks.length) {
    ctaLinks = Array.from(element.querySelectorAll('a.c-button, a[class*="button"]'));
  }

  // Empty-block guard: nothing meaningful to render.
  if (!bgImage && !heading && !ctaLinks.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (optional) — must be the first content row.
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 3: content cell holding heading + CTA(s). Hero is a single-column block,
  // so all content goes into ONE cell.
  const contentCell = [];
  if (heading) contentCell.push(heading);
  ctaLinks.forEach((a) => contentCell.push(a));
  if (contentCell.length) {
    cells.push([contentCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-stage', cells });
  element.replaceWith(block);
}
