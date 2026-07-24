/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Allianz section breaks + section metadata.
 *
 * The homepage template defines 3 sections (see tools/importer/page-templates.json):
 *   1. stage    (#onemarketing-main-wrapper > div.stage.container...)        style: none
 *   2. main      (#onemarketing-main-wrapper > div.parsys...)                 style: none
 *   3. find-us  (.parsys .wrapper.container:nth-of-type(7) .c-wrapper.centeraligned) style: dark
 *
 * Because 2+ sections exist, this transformer inserts:
 *   - a section break (<hr>) before every section except the first, and
 *   - a "Section Metadata" block after any section that declares a `style`
 *     (here: the dark-navy "Find us in your market" band).
 *
 * It is driven entirely by payload.template.sections so it stays reusable and
 * template-agnostic. All section selectors were verified against
 * migration-work/cleaned.html (each resolves to exactly one element).
 *
 * Runs in afterTransform only (section structure is applied after block parsing).
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) {
    return;
  }

  const { document, template } = payload || {};
  const sections = template && Array.isArray(template.sections) ? template.sections : [];

  // Only meaningful when the template has 2+ sections.
  if (!document || sections.length < 2) {
    return;
  }

  // Process in reverse order so inserting nodes never shifts the position of
  // sections we have not handled yet.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (!section || !section.selector) {
      continue;
    }

    // Resolve the section's boundary element. Scope to the migrated content
    // (element) first, falling back to the document, so it works whether the
    // validator passes document.body or an isolated main.
    const sectionEl = element.querySelector(section.selector)
      || document.querySelector(section.selector);
    if (!sectionEl) {
      continue;
    }

    // Section Metadata block (only for styled sections) — placed at the end of
    // the section it describes, i.e. immediately after the section boundary
    // element so it serializes as the last item in that section.
    if (section.style) {
      const sectionMetadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      sectionEl.after(sectionMetadata);
    }

    // Section break before every non-first section, separating it from the
    // previous section's content in document order.
    if (i > 0) {
      const hr = document.createElement('hr');
      sectionEl.before(hr);
    }
  }
}
