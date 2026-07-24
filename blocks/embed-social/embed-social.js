/*
 * Embed (social) Block — variant of the Block Collection embed block
 * Show videos and social posts directly on your page
 * https://www.hlx.live/developer/block-collection/embed
 *
 * Variant intent: embed a third-party social feed (e.g. Flockler) via a URL.
 * Flockler feeds are script-based: the embed URL returns a JavaScript file that
 * renders posts into a container element with id `flockler-embed-<uuid>`. We
 * create that container plus a graceful fallback panel, then inject the script.
 * The vanilla provider config (YouTube/Vimeo/Twitter) is preserved for reuse;
 * any other URL falls back to a responsive iframe embed.
 */

const loadScript = (url, callback, type) => {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.src = url;
  if (type) {
    script.setAttribute('type', type);
  }
  script.onload = callback;
  head.append(script);
  return script;
};

const getDefaultEmbed = (url) => `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;

const embedYoutube = (url, autoplay) => {
  const usp = new URLSearchParams(url.search);
  const suffix = autoplay ? '&muted=1&autoplay=1' : '';
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return embedHTML;
};

const embedVimeo = (url, autoplay) => {
  const [, video] = url.pathname.split('/');
  const suffix = autoplay ? '?muted=1&autoplay=1' : '';
  const embedHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}"
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return embedHTML;
};

const embedTwitter = (url) => {
  if (!url.href.startsWith('https://twitter.com')) {
    url.href = url.href.replace('https://x.com', 'https://twitter.com');
  }
  const embedHTML = `<blockquote class="twitter-tweet"><a href="${url.href}"></a></blockquote>`;
  loadScript('https://platform.twitter.com/widgets.js');
  return embedHTML;
};

/*
 * Flockler social feed. The embed URL returns a script that renders posts into
 * `#flockler-embed-<uuid>`. We show a subtle loading panel until the feed
 * renders so the block never looks broken (e.g. when the third-party script is
 * blocked or slow), then reveal the feed once real content appears.
 */
const loadFlockler = (block, url) => {
  if (block.classList.contains('embed-social-is-loaded')) {
    return;
  }
  const uuid = url.pathname.split('/').filter(Boolean).pop();
  block.textContent = '';

  const fallback = document.createElement('div');
  fallback.className = 'embed-social-fallback';
  fallback.innerHTML = '<p>Loading social feed…</p>';

  const container = document.createElement('div');
  container.className = 'embed-social-feed';
  container.id = `flockler-embed-${uuid}`;

  block.append(fallback, container);

  // Reveal the feed / hide the fallback once Flockler injects visible content
  // (ignore the <script>/<style> nodes it appends first).
  const observer = new MutationObserver(() => {
    const hasContent = [...container.children]
      .some((child) => child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE');
    if (hasContent) {
      block.classList.add('embed-social-has-feed');
      observer.disconnect();
    }
  });
  observer.observe(container, { childList: true, subtree: true });

  loadScript(url.href);
  block.classList.add('embed-social-is-loaded');
};

const loadEmbed = (block, link, autoplay) => {
  if (block.classList.contains('embed-social-is-loaded')) {
    return;
  }

  const EMBEDS_CONFIG = [
    {
      match: ['youtube', 'youtu.be'],
      embed: embedYoutube,
    },
    {
      match: ['vimeo'],
      embed: embedVimeo,
    },
    {
      match: ['twitter', 'x.com'],
      embed: embedTwitter,
    },
  ];
  const config = EMBEDS_CONFIG.find((e) => e.match.some((match) => link.includes(match)));
  const url = new URL(link);
  if (config) {
    block.innerHTML = config.embed(url, autoplay);
    block.classList = `block embed-social embed-social-${config.match[0]}`;
  } else {
    block.innerHTML = getDefaultEmbed(url);
    block.classList = 'block embed-social';
  }
  block.classList.add('embed-social-is-loaded');
};

export default function decorate(block) {
  const anchor = block.querySelector('a');
  if (!anchor) {
    return;
  }
  const link = anchor.href;

  // Script-based social feed (Flockler): inject as soon as decorated so the
  // container is present when the feed script runs.
  if (link.includes('flockler')) {
    loadFlockler(block, new URL(link));
    return;
  }

  const placeholder = block.querySelector('picture');
  block.textContent = '';

  if (placeholder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'embed-social-placeholder';
    wrapper.innerHTML = '<div class="embed-social-placeholder-play"><button type="button" title="Play"></button></div>';
    wrapper.prepend(placeholder);
    wrapper.addEventListener('click', () => {
      loadEmbed(block, link, true);
    });
    block.append(wrapper);
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadEmbed(block, link);
      }
    });
    observer.observe(block);
  }
}
