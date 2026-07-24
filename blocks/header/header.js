import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

const SEARCH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.49 4.49 0 0 1 9.5 14Z"/></svg>';
const GLOBE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8 8 0 0 1 18.92 8ZM12 4a14 14 0 0 1 1.91 4h-3.82A14 14 0 0 1 12 4ZM4.26 14a7.82 7.82 0 0 1 0-4h3.38a16.5 16.5 0 0 0-.14 2 16.5 16.5 0 0 0 .14 2Zm.82 2h2.95a15.65 15.65 0 0 0 1.38 3.56A8 8 0 0 1 5.08 16Zm2.95-8H5.08a8 8 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8ZM12 20a14 14 0 0 1-1.91-4h3.82A14 14 0 0 1 12 20Zm2.34-6H9.66a14.71 14.71 0 0 1-.16-2 14.71 14.71 0 0 1 .16-2h4.68a14.71 14.71 0 0 1 .16 2 14.71 14.71 0 0 1-.16 2Zm.25 5.56A15.65 15.65 0 0 0 16.02 16h2.95a8 8 0 0 1-4.33 3.56ZM16.36 14a16.5 16.5 0 0 0 .14-2 16.5 16.5 0 0 0-.14-2h3.38a7.82 7.82 0 0 1 0 4Z"/></svg>';

/**
 * Collapse any open desktop megamenu panels.
 * @param {Element} navSections The nav sections container
 * @param {Boolean} expanded Whether to expand (true) or collapse (false)
 */
function toggleAllNavSections(navSections, expanded = false) {
  if (!navSections) return;
  navSections.querySelectorAll(':scope .nav-drop').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggle the whole mobile nav drawer.
 * @param {Element} nav The nav element
 * @param {Element} navSections The nav sections container
 * @param {Boolean|null} forceExpanded Force a state when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, false);
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
}

function closeOnEscape(e) {
  if (e.code !== 'Escape') return;
  const nav = document.getElementById('nav');
  const navSections = nav?.querySelector('.nav-sections');
  if (!navSections) return;
  const openDrop = navSections.querySelector('.nav-drop[aria-expanded="true"]');
  if (openDrop && isDesktop.matches) {
    toggleAllNavSections(navSections);
    openDrop.querySelector('a, button')?.focus();
  } else if (!isDesktop.matches) {
    toggleMenu(nav, navSections);
    nav.querySelector('.nav-hamburger button')?.focus();
  }
}

/**
 * Wire up a single top-level section that has a megamenu.
 * @param {Element} navSection The <li> section
 * @param {Element} navSections The sections container
 */
function decorateDropdown(navSection, navSections) {
  navSection.classList.add('nav-drop');
  navSection.setAttribute('aria-expanded', 'false');

  const toggle = (force) => {
    const willOpen = force !== undefined ? force : navSection.getAttribute('aria-expanded') !== 'true';
    toggleAllNavSections(navSections, false);
    navSection.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  };

  const label = navSection.querySelector(':scope > a');
  // Desktop: hover opens, click on label still navigates. Mobile: tap label toggles panel.
  navSection.addEventListener('mouseenter', () => { if (isDesktop.matches) toggle(true); });
  navSection.addEventListener('mouseleave', () => { if (isDesktop.matches) toggle(false); });
  if (label) {
    label.addEventListener('click', (e) => {
      if (!isDesktop.matches) {
        e.preventDefault();
        toggle();
      }
    });
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment — dual fetch for local + DA/EDS
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/content/nav';
  let fragment = await loadFragment(navPath);
  if (!fragment || !fragment.firstElementChild) {
    fragment = await loadFragment('/content/nav');
  }

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Brand: strip any auto button decoration on the logo link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      brandLink.className = '';
      const bc = brandLink.closest('.button-container');
      if (bc) bc.className = '';
    }
  }

  // Sections: top-level <li> with a nested <ul> become megamenu dropdowns.
  // EDS wraps section content in a .default-content-wrapper div, so the list is
  // .nav-sections > div > ul rather than a direct child.
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const sectionsList = navSections.querySelector('ul');
    if (sectionsList) {
      [...sectionsList.children].forEach((navSection) => {
        if (navSection.tagName === 'LI' && navSection.querySelector('ul')) {
          decorateDropdown(navSection, navSections);
        }
      });
      // Append a search trigger (matches source: Search on the right)
      const searchLi = document.createElement('li');
      searchLi.className = 'nav-search';
      searchLi.innerHTML = `<button type="button" class="nav-search-toggle" aria-label="Search">${SEARCH_ICON}<span>Search</span></button>`;
      sectionsList.append(searchLi);
    }
  }

  // Tools: split into "Products & Services" + locale (EN/DE + globe) + contacts button
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const toolLinks = [...navTools.querySelectorAll('a')];
    const byText = (t) => toolLinks.find((a) => a.textContent.trim().toLowerCase() === t);
    const en = byText('en');
    const de = byText('de');
    const contacts = toolLinks.find((a) => /contacts/i.test(a.textContent));
    const products = toolLinks.find((a) => /products/i.test(a.textContent));

    if (products) products.closest('li')?.classList.add('nav-tools-products');
    // group EN/DE into a locale switcher with a globe icon
    if (en && de) {
      const localeLi = document.createElement('li');
      localeLi.className = 'nav-locale';
      localeLi.innerHTML = `<span class="nav-locale-icon" aria-hidden="true">${GLOBE_ICON}</span>`;
      en.classList.add('nav-locale-lang');
      de.classList.add('nav-locale-lang');
      localeLi.append(en.cloneNode(true));
      const sep = document.createElement('span');
      sep.className = 'nav-locale-sep';
      sep.textContent = '|';
      localeLi.append(sep);
      localeLi.append(de.cloneNode(true));
      en.closest('li')?.replaceWith(localeLi);
      de.closest('li')?.remove();
    }
    if (contacts) {
      contacts.classList.add('button', 'secondary', 'nav-contacts');
      contacts.closest('li')?.classList.add('nav-tools-contacts');
    }
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, navSections, isDesktop.matches);
    toggleAllNavSections(navSections, false);
  });
  window.addEventListener('keydown', closeOnEscape);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
