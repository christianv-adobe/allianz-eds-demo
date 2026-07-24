function getSlideStep(block) {
  const slides = block.querySelectorAll('.carousel-teaser-slide');
  if (slides.length < 2) return slides[0]?.offsetWidth || 1;
  const step = slides[1].offsetLeft - slides[0].offsetLeft;
  return step || slides[0].offsetWidth || 1;
}

function setActiveSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.carousel-teaser-slide');
  if (!slides.length) return;
  const idx = Math.max(0, Math.min(slideIndex, slides.length - 1));
  block.dataset.activeSlide = idx;

  const indicators = block.querySelectorAll('.carousel-teaser-slide-indicator');
  indicators.forEach((indicator, i) => {
    const button = indicator.querySelector('button');
    if (i === idx) button.setAttribute('disabled', 'true');
    else button.removeAttribute('disabled');
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-teaser-slide');
  if (!slides.length) return;
  const realSlideIndex = Math.max(0, Math.min(slideIndex, slides.length - 1));
  const activeSlide = slides[realSlideIndex];

  block.querySelector('.carousel-teaser-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
  setActiveSlide(block, realSlideIndex);
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-teaser-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1);
  });

  // Track the leading (left-most) visible slide from scroll position. This is
  // correct for a multi-up layout where several slides are visible at once.
  const slidesEl = block.querySelector('.carousel-teaser-slides');
  let ticking = false;
  const syncActive = () => {
    const step = getSlideStep(block);
    const idx = Math.round(slidesEl.scrollLeft / step);
    setActiveSlide(block, idx);
    ticking = false;
  };
  slidesEl.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(syncActive);
    }
  }, { passive: true });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-teaser-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-teaser-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-teaser-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-teaser-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-teaser-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-teaser-slides');

  let slideIndicators;
  let controls;
  if (!isSingleSlide) {
    // Single centered control row: prev arrow | dot pagination | next arrow
    controls = document.createElement('div');
    controls.classList.add('carousel-teaser-controls');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Carousel Slide Controls');

    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.classList.add('slide-prev');
    prevButton.setAttribute('aria-label', 'Previous Slide');

    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-teaser-slide-indicators');

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.classList.add('slide-next');
    nextButton.setAttribute('aria-label', 'Next Slide');

    controls.append(prevButton, slideIndicators, nextButton);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-teaser-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.append(container);
  if (controls) block.append(controls);

  if (!isSingleSlide) {
    bindEvents(block);
    setActiveSlide(block, 0);
  }
}
