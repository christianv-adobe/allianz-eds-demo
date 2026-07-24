/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-stage.js
  function parse(element, { document }) {
    const bgImage = element.querySelector(
      ".c-stage__image img, picture.c-stage__image img, img.abovethefoldimage, picture img"
    );
    const heading = element.querySelector(
      ".headline h1, .headline h2, .c-stage__content h1, .c-stage__content h2, h1, h2"
    );
    let ctaLinks = Array.from(element.querySelectorAll(".button.parbase a"));
    if (!ctaLinks.length) {
      ctaLinks = Array.from(element.querySelectorAll('a.c-button, a[class*="button"]'));
    }
    if (!bgImage && !heading && !ctaLinks.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) {
      cells.push([bgImage]);
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    ctaLinks.forEach((a) => contentCell.push(a));
    if (contentCell.length) {
      cells.push([contentCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-stage", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-teaser.js
  function parse2(element, { document }) {
    const slides = Array.from(
      element.querySelectorAll(".c-carousel__three-column__slide, .swiper-slide")
    );
    const cells = [];
    slides.forEach((slide) => {
      const teaser = slide.querySelector(".c-teaser") || slide;
      const link = teaser.querySelector("a.c-teaser__link-area, a[href]");
      const href = link ? link.getAttribute("href") : null;
      const img = teaser.querySelector("picture img, img.c-image__img, img");
      const heading = teaser.querySelector("h1, h2, h3, h4, h5, h6");
      const copyContainer = teaser.querySelector(".c-carousel__content--teaser .c-copy, .c-copy");
      const copyEls = [];
      if (copyContainer) {
        Array.from(copyContainer.querySelectorAll(":scope > p, :scope > div")).forEach((el) => {
          if (el.textContent && el.textContent.replace(/ /g, "").trim().length) {
            copyEls.push(el);
          }
        });
      }
      if (!img && !heading && !copyEls.length) return;
      if (heading && href) {
        const a = document.createElement("a");
        a.setAttribute("href", href);
        while (heading.firstChild) a.appendChild(heading.firstChild);
        heading.appendChild(a);
      }
      const contentCell = [];
      if (heading) contentCell.push(heading);
      copyEls.forEach((el) => contentCell.push(el));
      cells.push([img || "", contentCell.length ? contentCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-feature.js
  function parse3(element, { document }) {
    const row = element.querySelector(":scope > div > .l-grid__row") || element.querySelector(".l-grid__row");
    if (!row) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const columns = Array.from(row.children).filter((c) => c.classList.contains("column"));
    if (!columns.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rowCells = columns.map((col) => {
      const iframe = col.querySelector("iframe, .c-iframe");
      if (iframe) {
        const src = iframe.getAttribute("src") || iframe.getAttribute("data-src");
        if (src) {
          const a = document.createElement("a");
          a.setAttribute("href", src);
          a.textContent = src;
          return [a];
        }
      }
      const picture = col.querySelector("picture");
      const heading = col.querySelector("h1, h2, h3, h4, h5, h6");
      if (picture && !heading) {
        const img = picture.querySelector("img") || picture;
        return [img];
      }
      const parts = [];
      if (heading) parts.push(heading);
      col.querySelectorAll(".text .c-copy, :scope > .c-copy, .c-copy").forEach((copy) => {
        if (copy.closest(".link")) return;
        if (copy.textContent && copy.textContent.replace(/\s+/g, " ").trim().length) {
          if (!parts.includes(copy)) parts.push(copy);
        }
      });
      const seen = /* @__PURE__ */ new Set();
      col.querySelectorAll(".link a[href], a.c-link[href], a.c-button[href], a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (!href || seen.has(href)) return;
        const inPushedCopy = parts.some((p) => p !== a && p.contains && p.contains(a));
        if (inPushedCopy) return;
        seen.add(href);
        parts.push(a);
      });
      if (!parts.length) return [col];
      return [parts];
    });
    const cells = [rowCells.map((cell) => Array.isArray(cell) && cell.length === 1 ? cell[0] : cell)];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stats.js
  function parse4(element, { document }) {
    const row = element.querySelector(":scope > div > .l-grid__row") || element.querySelector(".l-grid__row");
    if (!row) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const stats = Array.from(row.children).filter((c) => c.classList.contains("column"));
    if (!stats.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    stats.forEach((stat) => {
      const contentCell = [];
      const valueEl = stat.querySelector(".azcom-statistics .statistic, .statistic");
      if (valueEl && valueEl.textContent.trim()) {
        const h = document.createElement("h3");
        h.textContent = valueEl.textContent.trim();
        contentCell.push(h);
      }
      stat.querySelectorAll(".text .c-copy").forEach((copy) => {
        if (copy.textContent && copy.textContent.replace(/\s+/g, " ").trim().length) {
          contentCell.push(copy);
        }
      });
      if (!contentCell.length) return;
      cells.push([contentCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-stats", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed-social.js
  function parse5(element, { document }) {
    const embedEl = element.querySelector('[id^="flockler-embed-"]') || element.querySelector(".flockler-integration-container [id]") || element.querySelector('[id*="flockler-embed"]');
    let hash = null;
    if (embedEl && embedEl.id) {
      const m = embedEl.id.match(/flockler-embed-([a-z0-9]+)/i);
      if (m) [, hash] = m;
    }
    if (!hash) {
      const skip = element.querySelector('a[href*="flockler-end-"]');
      if (skip) {
        const m = (skip.getAttribute("href") || "").match(/flockler-end-([a-z0-9]+)/i);
        if (m) [, hash] = m;
      }
    }
    if (!hash) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const embedUrl = `https://plugins.flockler.com/embed/${hash}`;
    const link = document.createElement("a");
    link.setAttribute("href", embedUrl);
    link.textContent = embedUrl;
    const cells = [[link]];
    const block = WebImporter.Blocks.createBlock(document, { name: "embed-social", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/allianz-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        'link[href*="onetrust"]'
      ]);
      WebImporter.DOMUtils.remove(element, ["#overlay"]);
      WebImporter.DOMUtils.remove(element, [
        "#skip-link-component",
        ".c-skip-link"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".flockler-skip-link-container",
        '[id^="flockler-end-"]'
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".header_container",
        "header",
        ".footer.parsys",
        "footer"
      ]);
    }
  }

  // tools/importer/transformers/allianz-sections.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) {
      return;
    }
    const { document, template } = payload || {};
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (!document || sections.length < 2) {
      return;
    }
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section || !section.selector) {
        continue;
      }
      const sectionEl = element.querySelector(section.selector) || document.querySelector(section.selector);
      if (!sectionEl) {
        continue;
      }
      if (section.style) {
        const sectionMetadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        sectionEl.after(sectionMetadata);
      }
      if (i > 0) {
        const hr = document.createElement("hr");
        sectionEl.before(hr);
      }
    }
  }

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Allianz corporate homepage with hero stage, three-column carousel, multi-column content sections, social feed integration, and footer",
    urls: [
      "https://www.allianz.com/en.html"
    ],
    blocks: [
      {
        name: "hero-stage",
        instances: [".stage.container .c-stage"]
      },
      {
        name: "carousel-teaser",
        instances: [
          ".stage.container .carousel.container .js-carousel-three-column",
          ".carousel.container .c-carousel__three-column"
        ]
      },
      {
        name: "columns-feature",
        instances: [
          ".parsys .multi-column-grid:has(.c-iframe)",
          ".parsys .multi-column-grid:has(.column.l-grid__column-large-8)"
        ]
      },
      {
        name: "cards-stats",
        instances: [".parsys .multi-column-grid:has(.azcom-statistics)"]
      },
      {
        name: "embed-social",
        instances: [".parsys .flockler-integration"]
      }
    ],
    sections: [
      {
        id: "stage",
        name: "Stage",
        selector: "#onemarketing-main-wrapper > div.stage.container.aem-GridColumn.aem-GridColumn--default--12",
        style: null,
        blocks: ["hero-stage", "carousel-teaser"],
        defaultContent: []
      },
      {
        id: "main",
        name: "Main",
        selector: "#onemarketing-main-wrapper > div.parsys.aem-GridColumn.aem-GridColumn--default--12",
        style: null,
        blocks: ["columns-feature", "cards-stats", "embed-social"],
        defaultContent: [".parsys h2"]
      },
      {
        id: "find-us",
        name: "Find us in your market",
        selector: ".parsys .wrapper.container:nth-of-type(7) .c-wrapper.centeraligned",
        style: "dark",
        blocks: [],
        defaultContent: [
          ".parsys .c-wrapper.centeraligned h2",
          ".parsys .c-wrapper.centeraligned .button.parbase"
        ]
      }
    ]
  };
  var parsers = {
    "hero-stage": parse,
    "carousel-teaser": parse2,
    "columns-feature": parse3,
    "cards-stats": parse4,
    "embed-social": parse5
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
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
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
