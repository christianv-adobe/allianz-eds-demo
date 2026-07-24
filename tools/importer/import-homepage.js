/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroStageParser from './parsers/hero-stage.js';
import carouselTeaserParser from './parsers/carousel-teaser.js';
import columnsFeatureParser from './parsers/columns-feature.js';
import cardsStatsParser from './parsers/cards-stats.js';
import embedSocialParser from './parsers/embed-social.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/allianz-cleanup.js';
import sectionsTransformer from './transformers/allianz-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Allianz corporate homepage with hero stage, three-column carousel, multi-column content sections, social feed integration, and footer',
  urls: [
    'https://www.allianz.com/en.html',
  ],
  blocks: [
    {
      name: 'hero-stage',
      instances: ['.stage.container .c-stage'],
    },
    {
      name: 'carousel-teaser',
      instances: [
        '.stage.container .carousel.container .js-carousel-three-column',
        '.carousel.container .c-carousel__three-column',
      ],
    },
    {
      name: 'columns-feature',
      instances: [
        '.parsys .multi-column-grid:has(.c-iframe)',
        '.parsys .multi-column-grid:has(.column.l-grid__column-large-8)',
      ],
    },
    {
      name: 'cards-stats',
      instances: ['.parsys .multi-column-grid:has(.azcom-statistics)'],
    },
    {
      name: 'embed-social',
      instances: ['.parsys .flockler-integration'],
    },
  ],
  sections: [
    {
      id: 'stage',
      name: 'Stage',
      selector: '#onemarketing-main-wrapper > div.stage.container.aem-GridColumn.aem-GridColumn--default--12',
      style: null,
      blocks: ['hero-stage', 'carousel-teaser'],
      defaultContent: [],
    },
    {
      id: 'main',
      name: 'Main',
      selector: '#onemarketing-main-wrapper > div.parsys.aem-GridColumn.aem-GridColumn--default--12',
      style: null,
      blocks: ['columns-feature', 'cards-stats', 'embed-social'],
      defaultContent: ['.parsys h2'],
    },
    {
      id: 'find-us',
      name: 'Find us in your market',
      selector: '.parsys .wrapper.container:nth-of-type(7) .c-wrapper.centeraligned',
      style: 'dark',
      blocks: [],
      defaultContent: [
        '.parsys .c-wrapper.centeraligned h2',
        '.parsys .c-wrapper.centeraligned .button.parbase',
      ],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-stage': heroStageParser,
  'carousel-teaser': carouselTeaserParser,
  'columns-feature': columnsFeatureParser,
  'cards-stats': cardsStatsParser,
  'embed-social': embedSocialParser,
};

// TRANSFORMER REGISTRY - cleanup runs first, sections after (afterTransform hook)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for block "${blockDef.name}": ${selector}`);
        return;
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        // Avoid double-processing an element matched by multiple selectors
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
