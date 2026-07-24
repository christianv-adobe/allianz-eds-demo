/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Allianz site-wide cleanup.
 *
 * Source is a Cloudflare-protected AEM Classic (parsys / AEM Grid) site with
 * deeply nested layout wrappers. This transformer strips everything that is not
 * page-level authorable content so the import contains only the stage + main
 * (parsys) content.
 *
 * ALL selectors below were verified against migration-work/cleaned.html.
 * None are guessed.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Cookie banner / consent overlay + its injected stylesheet (non-authorable).
    //   cleaned.html: <div id="onetrust-consent-sdk"> (line 2882),
    //                 <link href=".../onetrust/onetrust_v2.min...css"> (line 2881)
    // Removing the #onetrust-consent-sdk container also removes its nested
    // <iframe class="ot-text-resize"> so no blanket iframe removal is needed.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      'link[href*="onetrust"]',
    ]);

    // Empty full-page overlay div (non-authorable).
    //   cleaned.html: <div id="overlay"> (line 2)
    WebImporter.DOMUtils.remove(element, ['#overlay']);

    // Accessibility skip-links (navigation helpers, non-authorable).
    //   cleaned.html: <div id="skip-link-component"> with <div class="c-skip-link"> (lines 15-27)
    WebImporter.DOMUtils.remove(element, [
      '#skip-link-component',
      '.c-skip-link',
    ]);

    // Flockler widget navigation noise inside the social feed (embed-social block).
    // These are skip-navigation helpers/markers, not authorable content; removing
    // them before block parsing keeps the embed-social parser input clean.
    //   cleaned.html: <div class="flockler-skip-link-container"> (line 2209),
    //                 <div id="flockler-end-..."> (line 2580)
    WebImporter.DOMUtils.remove(element, [
      '.flockler-skip-link-container',
      '[id^="flockler-end-"]',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Global site chrome (header + footer) — non-authorable.
    //   cleaned.html: <div class="header_container header-container parsys ..."> (line 6)
    //                 containing <header class="c-header ..."> (line 11)
    //                 <div class="footer parsys ..."> (line 2616)
    //                 containing <footer id="onemarketing-footer-wrapper"> (line 2617)
    // ".footer.parsys" is specific to the footer wrapper and does NOT match the
    // main content wrapper (div.parsys without the "footer" class).
    WebImporter.DOMUtils.remove(element, [
      '.header_container',
      'header',
      '.footer.parsys',
      'footer',
    ]);
  }
}
