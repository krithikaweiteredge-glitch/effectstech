// Static site generator: node build.mjs  ->  writes HTML into ./site
import { writeFileSync, readFileSync } from 'node:fs';
import { site, verticals, projects, capabilities, process as steps } from './src/data.mjs';

import { india, cityXY } from './src/india.mjs';

const dims = JSON.parse(readFileSync('./site/assets/img/dims.json', 'utf8'));
const V = verticals;
const vlist = Object.values(V);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const cover = (p) => p.coverSrc || `work/${p.slug}-${p.cover}.webp`;
const shots = (p) => Array.from({ length: p.n }, (_, i) => `work/${p.slug}-${i + 1}.webp`);
const href = (p) => `work-${p.slug}.html`;

function img(src, alt = '', { cls = '', eager = false, sizes = '100vw' } = {}) {
  const d = dims[src] || [1280, 720];
  return `<img src="assets/img/${src}" alt="${esc(alt)}" width="${d[0]}" height="${d[1]}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" sizes="${sizes}"${cls ? ` class="${cls}"` : ''}>`;
}

const logo = (cls = '') => `<svg class="logo-mark ${cls}" viewBox="0 0 460 305" fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M452 72V8H7v289h253v-57H76v-55h144v-60H7"/><path d="M72 70h298v227h-70V128"/></svg>`;

const arrow = `<svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19 19 5M8 5h11v11"/></svg>`;

function head({ title, desc, image }) {
  const t = title ? `${title} — Effects Tech` : 'Effects Tech — Experiences beyond expectations';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:image" content="assets/img/${image || 'work/lakme-fashion-2.webp'}">
<meta name="theme-color" content="#07080a">
<link rel="icon" href="assets/img/brand/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Outfit:wght@300..600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/main.css">
<script>(function(d){var c=d.classList;c.add('js');try{if(!sessionStorage.getItem('et-seen'))c.add('is-first')}catch(e){}try{var k=document.createElement('canvas');if(k.getContext('webgl2')||k.getContext('webgl'))c.add('webgl')}catch(e){}})(document.documentElement)</script>
</head>`;
}

function header(active, sub) {
  const link = (file, label, key) => `<a href="${file}" class="nav__link${active === key ? ' is-active' : ''}"${active === key ? ' aria-current="page"' : ''}><span>${label}</span></a>`;
  return `
<a class="skip" href="#main">Skip to content</a>
<div class="curtain" aria-hidden="true">${'<i></i>'.repeat(6)}<div class="curtain__label"><span></span></div></div>
<div class="loader" aria-hidden="true">
  <div class="loader__in">${logo('loader__mark')}<div class="loader__row"><span class="loader__txt">House lights down</span><span class="loader__num">000</span></div><div class="loader__bar"><i></i></div></div>
</div>
<div class="cursor" aria-hidden="true"><span class="cursor__label"></span></div>
<header class="hdr">
  <a href="index.html" class="brand" aria-label="Effects Tech home">${logo()}<span class="brand__txt">Effects Tech${sub ? `<small>${sub}</small>` : ''}</span></a>
  <nav class="nav" aria-label="Primary">
    ${link(V.experiences.file, 'Experiences', 'experiences')}
    ${link(V.meetings.file, 'Meetings &amp; Events', 'meetings')}
    ${link(V.weddings.file, 'Weddings', 'weddings')}
    ${link('work.html', 'Work', 'work')}
    ${link('about.html', 'About', 'about')}
  </nav>
  <a href="contact.html" class="btn btn--sm hdr__cta" data-magnetic><span>Start a project</span></a>
  <button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><i></i><i></i></button>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <nav class="menu__nav" aria-label="Mobile">
    ${[[V.experiences.file, 'Experiences', '01'], [V.meetings.file, 'Meetings &amp; Events', '02'], [V.weddings.file, 'Weddings', '03'], ['work.html', 'Work', '04'], ['about.html', 'About', '05'], ['contact.html', 'Contact', '06']].map(([f, l, n]) => `<a href="${f}"><small>${n}</small><span>${l}</span></a>`).join('\n    ')}
  </nav>
  <div class="menu__foot"><a href="mailto:${site.email}">${site.email}</a><span>${site.phones[0]}</span></div>
</div>`;
}

function cta(title = 'Think events.<br><em>Think Effects Tech.</em>', video = 'stage-lights') {
  return `
<section class="cta theme-dark">
  <video class="cta__video" muted loop playsinline preload="none" data-video="assets/video/${video}.mp4" aria-hidden="true"></video>
  <div class="cta__glow" aria-hidden="true"></div>
  <p class="eyebrow" data-reveal>Next cue — yours</p>
  <h2 class="cta__title" data-split>${title}</h2>
  <a href="contact.html" class="btn btn--xl" data-magnetic data-reveal><span>Start a project</span>${arrow}</a>
</section>`;
}

function footer() {
  return `
<footer class="ftr theme-dark">
  <div class="ftr__top">
    <div class="ftr__brand">${logo()}<p>Experience design and event production.<br>Mumbai, India.</p></div>
    <div class="ftr__col"><h3>Verticals</h3>${vlist.map((v) => `<a href="${v.file}">${v.name}</a>`).join('')}</div>
    <div class="ftr__col"><h3>Company</h3><a href="work.html">Work</a><a href="about.html">About</a><a href="contact.html">Contact</a></div>
    <div class="ftr__col"><h3>Studio</h3><p>${site.address.join('<br>')}</p><a href="mailto:${site.email}">${site.email}</a><a href="tel:+91${site.phones[0].replace(/\D/g, '').slice(1)}">${site.phones[0]}</a></div>
    <div class="ftr__col"><h3>Follow</h3>${site.social.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`).join('')}</div>
  </div>
  <div class="ftr__word" aria-hidden="true">Effects Tech</div>
  <div class="ftr__base"><span>© ${new Date().getFullYear()} Effects Tech. All rights reserved.</span><a href="#top" class="totop">Back to top ↑</a></div>
</footer>
<script src="assets/vendor/gsap.min.js"></script>
<script src="assets/vendor/ScrollTrigger.min.js"></script>
<script src="assets/vendor/lenis.min.js"></script>
<script src="assets/js/main.js"></script>`;
}

function page({ file, title, desc, image, active, vertical = '', theme = 'dark', sub = '', body, scripts = '' }) {
  const html = `${head({ title, desc, image })}
<body id="top" class="theme-${theme}" data-vertical="${vertical}" data-page="${active}">
${header(active, sub)}
<main id="main">
${body}
</main>
${footer()}
${scripts}
</body>
</html>
`;
  writeFileSync(`./site/${file}`, html);
}

const card = (p, i = 0) => `
<a href="${href(p)}" class="card" data-v="${p.v}" data-tilt data-cursor="View" data-accent="${p.v}">
  <div class="card__media">${img(cover(p), p.title, { sizes: '(min-width: 900px) 40vw, 92vw' })}<span class="card__glare" aria-hidden="true"></span></div>
  <div class="card__meta"><span class="tag">${V[p.v].name}</span><span class="tag tag--ghost">${p.type}</span></div>
  <h3 class="card__title">${p.title}</h3>
  <p class="card__place">${p.place}</p>
</a>`;

const marquee = (items, cls = '') => {
  const row = items.map((t) => `<span>${t}</span><i aria-hidden="true">✦</i>`).join('');
  return `<div class="marquee ${cls}"><div class="marquee__track">${row}${row.replace(/<span>/g, '<span aria-hidden="true">')}</div></div>`;
};

const logoWall = () => {
  const tile = ([f, n], hid) => `<div class="ltile"${hid ? ' aria-hidden="true"' : ''}><img src="assets/img/logos/${f}.jpg" alt="${hid ? '' : esc(n)}" width="200" height="155" loading="lazy"></div>`;
  const row = (items, cls) => `<div class="lrow ${cls}"><div class="lrow__track">${items.map((l) => tile(l)).join('')}${items.map((l) => tile(l, true)).join('')}${items.map((l) => tile(l, true)).join('')}</div></div>`;
  return `<div class="lwall" data-lwall><div class="lwall__plane">${row(site.logos.slice(0, 6), '')}${row(site.logos.slice(6), 'lrow--rev')}${row(site.logos.slice(3, 9), 'lrow--slow')}</div></div>`;
};

const mapSection = () => {
  const cities = Object.keys(cityXY).map((name) => {
    const list = projects.filter((p) => p.place === name);
    const [x, y] = cityXY[name];
    return { name, id: name.toLowerCase().replace(/\s+/g, '-'), list, x, y, studio: name === 'Mumbai', accent: name === 'Mumbai' ? '' : list[0].v };
  });
  const hub = cities.find((c) => c.studio);
  const arc = (c) => { const mx = (hub.x + c.x) / 2, my = (hub.y + c.y) / 2, dx = c.x - hub.x, dy = c.y - hub.y; return `M${hub.x},${hub.y} Q${(mx - dy * 0.28).toFixed(1)},${(my + dx * 0.28).toFixed(1)} ${c.x},${c.y}`; };
  return `
<section class="imap" data-imap>
  <div class="sec-head sec-head--split">
    <div><p class="eyebrow" data-reveal>Cue 06 — On the map</p><h2 class="h-xl" data-split>One studio.<br><em>Stages across India.</em></h2></div>
    <p class="sec-head__side" data-reveal>Built in Mumbai, loaded onto trucks, and raised wherever the night is happening.</p>
  </div>
  <div class="imap__grid">
    <div class="imap__stage" aria-hidden="true">
      <div class="imap__tilt">
        <svg viewBox="0 0 ${india.w} ${india.h}" class="imap__svg">
          <defs><pattern id="imap-dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.25" fill="currentColor"/></pattern></defs>
          <path class="imap__land" d="${india.path}" fill="url(#imap-dots)"/>
          <path class="imap__edge" d="${india.path}" pathLength="1"/>
          ${cities.filter((c) => !c.studio).map((c) => `<path class="imap__arc" data-arc="${c.id}" d="${arc(c)}" pathLength="1"/>`).join('')}
          ${cities.map((c) => `<circle class="imap__ring" data-pulse="${c.id}" cx="${c.x}" cy="${c.y}" r="10"/>`).join('')}
        </svg>
        ${cities.map((c) => `<div class="imap__pin" data-pin="${c.id}"${c.accent ? ` data-accent="${c.accent}"` : ''} style="left:${((c.x / india.w) * 100).toFixed(2)}%;top:${((c.y / india.h) * 100).toFixed(2)}%;--h:${{ mumbai: 70, hyderabad: 120, udaipur: 150, 'greater-noida': 100 }[c.id] || 100}px"><i class="imap__beam"></i><span class="imap__label">${c.name}${c.studio ? '<small>Studio</small>' : ''}</span></div>`).join('')}
      </div>
    </div>
    <div class="imap__side">
      <div class="imap__tabs" role="tablist" aria-label="Cities">
        ${cities.map((c, i) => `<button class="imap__tab${i === 0 ? ' is-on' : ''}" role="tab" id="imap-tab-${c.id}" aria-controls="imap-panel-${c.id}" aria-selected="${i === 0}" data-city="${c.id}"${c.accent ? ` data-accent="${c.accent}"` : ''}><span>${c.name}</span><small>${c.studio ? 'Studio · ' : ''}${c.list.length} production${c.list.length === 1 ? '' : 's'}</small></button>`).join('')}
      </div>
      ${cities.map((c, i) => `<div class="imap__panel${i === 0 ? ' is-on' : ''}" role="tabpanel" id="imap-panel-${c.id}" aria-labelledby="imap-tab-${c.id}"${i === 0 ? '' : ' hidden'}>
        ${c.list.map((p) => `<a href="${href(p)}" class="imap__item" data-accent="${p.v}">${img(cover(p), '', { sizes: '120px' })}<span><small>${V[p.v].name} · ${p.type}</small>${p.title}</span>${arrow}</a>`).join('')}
      </div>`).join('')}
      <a href="work.html" class="link"><span>All productions</span>${arrow}</a>
    </div>
  </div>
</section>`;
};

const statsBlock = () => `
<section class="stats">
  ${site.stats.map((s) => `<div class="stat" data-reveal><div class="stat__n"><span data-count="${s.n}">0</span>${s.suffix}</div><p>${s.label}</p></div>`).join('')}
</section>`;

/* ------------------------------------------------------------------ HOME */
const featured = ['lakme-fashion', 'chudhary-wedding-hyderabad', 'ibm-think-summit', 'mughal-e-azam', 'ruia-wedding-udaipur', 'rohit-bal-ajsk-tarun-tahliani', 'cognizant-global-account-planning-summit', 'boinipally-sangeet-and-wedding-hyderabad', 'zubin-mehta-conert', 'gq-and-vogue'].map((s) => projects.find((p) => p.slug === s));
const flyData = featured.map((p) => ({ src: `assets/img/${cover(p)}`, title: p.title, meta: `${V[p.v].name} — ${p.place}`, href: href(p), v: p.v }));
const reelData = ['work/lakme-fashion-2.webp', 'work/chudhary-wedding-hyderabad-7.webp', 'work/mughal-e-azam-5.webp', 'work/tata-motors-ace-1.webp', 'work/rohit-bal-ajsk-tarun-tahliani-4.webp', 'work/boinipally-sangeet-and-wedding-hyderabad-2.webp', 'work/enchanted-valley-carnival-2.webp', 'work/ruia-wedding-udaipur-4.webp'].map((s) => `assets/img/${s}`);

page({
  file: 'index.html',
  title: '',
  desc: 'Effects Tech is an experience design and event production house in Mumbai — fashion shows, summits, concerts, theatre and weddings, built by one in-house team for over 18 years.',
  active: 'home',
  body: `
<section class="hero" data-stage>
  <div class="hero__fallback">${img('work/lakme-fashion-2.webp', '', { eager: true })}</div>
  <canvas class="hero__canvas" aria-hidden="true"></canvas>
  <div class="hero__shade" aria-hidden="true"></div>
  <div class="hero__body">
    <p class="eyebrow" data-hero>Experience design &amp; production · Mumbai</p>
    <h1 class="hero__title" data-split data-hero-title>Experiences <em>beyond</em><br>expectations.</h1>
    <div class="hero__row">
      <p class="hero__lede" data-hero>We design, build and run India’s most ambitious live moments — the stage, the light, the sound, and everything that holds them up.</p>
      <div class="hero__btns" data-hero>
        <a href="work.html" class="btn" data-magnetic><span>See the work</span>${arrow}</a>
        <a href="#reel" class="btn btn--ghost" data-magnetic><span>Watch the reel</span></a>
      </div>
    </div>
  </div>
  <div class="hero__rig" data-hero>
    <span class="hero__rigLabel">Choose a stage</span>
    ${vlist.map((v) => `<a href="${v.file}" class="rig" data-rig="${v.key}" data-accent="${v.key}"><small>${v.no}</small><b>${v.name}</b><span>${v.short}</span></a>`).join('\n    ')}
  </div>
</section>

<section class="manifesto">
  <p class="eyebrow" data-reveal>Cue 01 — Who we are</p>
  <p class="manifesto__txt" data-scrub>For over eighteen years we have built the rooms people remember. Fashion weeks and summits. Concert stages and wedding nights. One team — set, light, sound, video and structure — under one roof.</p>
  <a href="about.html" class="link" data-reveal><span>Our story</span>${arrow}</a>
</section>

<section class="doors">
  <div class="sec-head">
    <p class="eyebrow" data-reveal>Cue 02 — Three stages</p>
    <h2 class="h-xl" data-split>One house.<br><em>Three stages.</em></h2>
  </div>
  <div class="doors__row">
    ${vlist.map((v) => `
    <a href="${v.file}" class="door" data-accent="${v.key}" data-cursor="Enter" data-tilt-soft>
      <div class="door__media">${img(v.panel, v.full, { sizes: '(min-width: 900px) 50vw, 92vw' })}</div>
      <div class="door__shade" aria-hidden="true"></div>
      <div class="door__body">
        <span class="door__no">${v.no}</span>
        <h3 class="door__name"><small>Effects Tech</small>${v.name}</h3>
        <p class="door__txt">${v.short}</p>
        <span class="door__go">Enter ${arrow}</span>
      </div>
    </a>`).join('')}
  </div>
</section>

<section class="fly" data-fly>
  <div class="fly__sticky">
    <canvas class="fly__canvas" aria-hidden="true"></canvas>
    <div class="fly__head">
      <p class="eyebrow">Cue 03 — Selected work</p>
      <h2 class="h-lg">Walk through<br><em>the work.</em></h2>
    </div>
    <div class="fly__cap"><a href="#" class="fly__link" data-cursor="View"><span class="fly__meta"></span><span class="fly__title"></span></a></div>
    <div class="fly__prog" aria-hidden="true"><i></i></div>
    <p class="fly__hint" aria-hidden="true">Keep scrolling — the camera moves with you</p>
  </div>
  <ul class="fly__list">
    ${featured.map((p) => `<li><a href="${href(p)}">${p.title}</a></li>`).join('')}
  </ul>
  <script type="application/json" class="fly__data">${JSON.stringify(flyData)}</script>
</section>

<section class="reel" id="reel">
  <div class="sec-head sec-head--split">
    <div><p class="eyebrow" data-reveal>Cue 04 — Showreel</p><h2 class="h-xl" data-split>Eighteen years<br><em>in ninety seconds.</em></h2></div>
    <p class="sec-head__side" data-reveal>Runways, summits, symphonies and sangeets — a cut of the nights we have built.</p>
  </div>
  <div class="reel__frame" data-reel='${JSON.stringify(reelData)}' data-cursor="Drag" data-tilt-soft>
    <canvas class="reel__canvas" aria-hidden="true"></canvas>
    <div class="reel__fallback">${img('work/lakme-fashion-2.webp', 'Showreel still')}</div>
    <div class="reel__hud" aria-hidden="true"><span class="reel__rec"><i></i>REEL</span><span class="reel__tc">00:00:00</span></div>
    <div class="reel__ticks" role="tablist" aria-label="Reel scenes"></div>
  </div>
</section>

<section class="caps">
  <div class="sec-head">
    <p class="eyebrow" data-reveal>Cue 05 — In-house</p>
    <h2 class="h-xl" data-split>Everything a show needs,<br><em>under one roof.</em></h2>
  </div>
  <ul class="caps__list">
    ${capabilities.map(([n, d, s], i) => `<li class="cap" data-cap="assets/img/${s}"><span class="cap__no">${String(i + 1).padStart(2, '0')}</span><h3 class="cap__name">${n}</h3><p class="cap__txt">${d}</p></li>`).join('\n    ')}
  </ul>
  <div class="caps__peek" aria-hidden="true"><img alt="" src="assets/img/${capabilities[0][2]}"></div>
</section>

${statsBlock()}

${mapSection()}

<section class="assoc">
  <p class="eyebrow" data-reveal>In good company</p>
  ${logoWall()}
</section>

${cta()}`,
  scripts: '<script type="module" src="assets/js/stage.js"></script>',
});

/* -------------------------------------------------------------- VERTICALS */
for (const v of vlist) {
  const mine = projects.filter((p) => p.v === v.key);
  const others = vlist.filter((o) => o.key !== v.key);
  page({
    file: v.file,
    title: v.full,
    desc: v.lede,
    image: v.hero,
    active: v.key,
    vertical: v.key,
    theme: v.key === 'weddings' ? 'light' : 'dark',
    sub: v.name,
    body: `
<section class="vhero theme-dark">
  <div class="vhero__media" data-parallax="0.25">${img(v.hero, v.full, { eager: true })}</div>
  <div class="vhero__shade" aria-hidden="true"></div>
  ${v.key === 'weddings' ? '<video class="vhero__video" muted loop playsinline preload="none" data-video="assets/video/bokeh.mp4" aria-hidden="true"></video>' : ''}
  <canvas class="vhero__fx" data-particles="${v.key}" aria-hidden="true"></canvas>
  <div class="vhero__body">
    <p class="eyebrow" data-hero><a href="index.html">Effects Tech</a> / ${v.no} / ${v.name}</p>
    <h1 class="vhero__title" data-split data-hero-title>${v.h1.join('<br>')}</h1>
    <p class="vhero__lede" data-hero>${v.lede}</p>
  </div>
  <div class="vhero__foot" data-hero><span>Scroll</span><i></i><span>${mine.length} productions inside</span></div>
</section>

<section class="intro">
  <p class="eyebrow" data-reveal>${v.full}</p>
  <h2 class="h-xl intro__title" data-split>${v.introTitle}</h2>
  <div class="intro__grid">
    <p class="intro__txt" data-reveal>${v.intro}</p>
    <div class="intro__img" data-img-reveal data-tilt>${img(v.gallery[0], '', { sizes: '(min-width: 900px) 45vw, 92vw' })}</div>
  </div>
</section>

<section class="vexp theme-dark" data-vexp>
  <div class="vexp__pin">
    <div class="vexp__frame"><video muted loop playsinline preload="none" data-video="assets/video/${v.video}.mp4" aria-hidden="true"></video><div class="vexp__shade" aria-hidden="true"></div></div>
    <div class="vexp__txt"><p class="eyebrow">In motion</p><h2 class="h-xl">${v.vline}</h2></div>
  </div>
</section>

<section class="svc">
  <div class="sec-head"><p class="eyebrow" data-reveal>What we do</p><h2 class="h-lg" data-split>Services</h2></div>
  <ul class="svc__list">
    ${v.services.map(([n, d], i) => `<li class="svc__row" data-reveal><span class="svc__no">${String(i + 1).padStart(2, '0')}</span><h3 class="svc__name">${n}</h3><p class="svc__txt">${d}</p><span class="svc__ic">${arrow}</span></li>`).join('\n    ')}
  </ul>
</section>

<section class="strip" data-hscroll>
  <div class="strip__track">
    <div class="strip__lead"><p class="eyebrow">Gallery</p><h2 class="h-lg">Seen from<br><em>the floor.</em></h2></div>
    ${v.gallery.slice(1).map((s, i) => `<figure class="strip__item strip__item--${i % 3}">${img(s, `${v.name} production photograph`, { sizes: '60vw' })}</figure>`).join('')}
  </div>
</section>

<section class="vwork">
  <div class="sec-head sec-head--split"><div><p class="eyebrow" data-reveal>Selected productions</p><h2 class="h-xl" data-split>Recent <em>work.</em></h2></div><a href="work.html" class="link" data-reveal><span>All work</span>${arrow}</a></div>
  <div class="grid">${mine.slice(0, 6).map(card).join('')}</div>
</section>

<section class="proc">
  <div class="sec-head"><p class="eyebrow" data-reveal>How a show comes together</p><h2 class="h-lg" data-split>Four steps, <em>one team.</em></h2></div>
  <ol class="proc__list">
    ${steps.map(([n, d], i) => `<li class="proc__step" data-reveal><span class="proc__no">${String(i + 1).padStart(2, '0')}</span><h3>${n}</h3><p>${d}</p></li>`).join('')}
  </ol>
</section>

<section class="more">
  <p class="eyebrow" data-reveal>Also from Effects Tech</p>
  <div class="more__row">
    ${others.map((o) => `<a href="${o.file}" class="more__item theme-dark" data-accent="${o.key}" data-cursor="Enter"><div class="more__media">${img(o.panel, o.full, { sizes: '50vw' })}</div><div class="more__body"><small>${o.no}</small><h3>${o.name}</h3><p>${o.short}</p></div></a>`).join('')}
  </div>
</section>

${v.key === 'weddings' ? cta('Tell us about<br><em>your day.</em>', 'candles') : cta()}`,
  });
}

/* ------------------------------------------------------------------ WORK */
page({
  file: 'work.html',
  title: 'Work',
  desc: 'Selected productions by Effects Tech — fashion shows, summits, theatre, concerts and weddings across India.',
  active: 'work',
  body: `
<section class="phead">
  <p class="eyebrow" data-hero>Work — ${projects.length} productions</p>
  <h1 class="phead__title" data-split data-hero-title>Extravagance,<br><em>engineered.</em></h1>
  <p class="phead__lede" data-hero>A selection from more than a thousand productions — filter by the stage that interests you.</p>
</section>
<section class="ring" data-ring aria-label="Featured productions carousel">
  <div class="ring__stage"><div class="ring__wheel">
    ${featured.map((p) => `<a href="${href(p)}" class="ring__item" data-accent="${p.v}" draggable="false">${img(cover(p), p.title, { sizes: '30vw' })}<span><small>${V[p.v].name}</small>${p.title}</span></a>`).join('')}
  </div></div>
  <p class="ring__hint" aria-hidden="true">Drag to spin · scroll to speed up</p>
</section>
<section class="wall">
  <div class="filter" role="group" aria-label="Filter work">
    <button class="chip is-on" data-filter="all" aria-pressed="true">All <sup>${projects.length}</sup></button>
    ${vlist.map((v) => `<button class="chip" data-filter="${v.key}" data-accent="${v.key}" aria-pressed="false">${v.name} <sup>${projects.filter((p) => p.v === v.key).length}</sup></button>`).join('')}
  </div>
  <div class="grid grid--wall">${projects.map(card).join('')}</div>
</section>
${cta()}`,
});

/* -------------------------------------------------------------- PROJECTS */
projects.forEach((p, i) => {
  const next = projects[(i + 1) % projects.length];
  const v = V[p.v];
  const all = shots(p).filter((s) => s !== cover(p));
  page({
    file: href(p),
    title: p.title,
    desc: `${p.title} — ${p.blurb}`,
    image: cover(p),
    active: 'work',
    vertical: p.v,
    body: `
<section class="vhero vhero--case theme-dark">
  <div class="vhero__media" data-parallax="0.25">${img(cover(p), p.title, { eager: true })}</div>
  <div class="vhero__shade" aria-hidden="true"></div>
  <div class="vhero__body">
    <p class="eyebrow" data-hero><a href="work.html">Work</a> / ${v.name}</p>
    <h1 class="vhero__title vhero__title--case" data-split data-hero-title>${p.title}</h1>
  </div>
</section>
<section class="case">
  <dl class="case__meta" data-reveal>
    <div><dt>Stage</dt><dd><a href="${v.file}">${v.name}</a></dd></div>
    <div><dt>Format</dt><dd>${p.type}</dd></div>
    <div><dt>Location</dt><dd>${p.place}</dd></div>
    <div><dt>Scope</dt><dd>Design · Build · Light · Sound</dd></div>
  </dl>
  <p class="case__lede" data-scrub>${p.blurb}</p>
</section>
<section class="shots">
  ${all.map((s, k) => `<figure class="shot shot--${k % 3 === 0 ? 'full' : 'half'}" data-img-reveal>${img(s, `${p.title} — photograph ${k + 1}`, { sizes: k % 3 === 0 ? '92vw' : '(min-width: 900px) 46vw, 92vw' })}</figure>`).join('\n  ')}
</section>
<a href="${href(next)}" class="next theme-dark" data-cursor="Next" data-accent="${next.v}">
  <div class="next__media">${img(cover(next), next.title)}</div>
  <div class="next__body"><p class="eyebrow">Next production</p><h2 class="h-xl">${next.title}</h2></div>
</a>`,
  });
});

/* ----------------------------------------------------------------- ABOUT */
page({
  file: 'about.html',
  title: 'About',
  desc: 'With over 18 years of turnkey event production, Effects Tech is one of India’s leading production houses — sound, light, video, set and structure under one roof.',
  active: 'about',
  image: 'brand/about-1.webp',
  body: `
<section class="phead">
  <p class="eyebrow" data-hero>About Effects Tech</p>
  <h1 class="phead__title" data-split data-hero-title>We build the<br><em>best experiences.</em></h1>
</section>
<section class="wide" data-img-reveal><div data-parallax="0.15">${img('brand/about-1.webp', 'A couple beneath a ceiling of light at a wedding produced by Effects Tech', { eager: true })}</div></section>
<section class="story">
  <p class="eyebrow" data-reveal>The house</p>
  <p class="manifesto__txt" data-scrub>With over eighteen years of turnkey event production, Effects Tech is one of India’s leading production houses — a pool of talented professionals and an expansive infrastructure, equipped to take on events and exhibitions of any magnitude.</p>
  <div class="story__cols">
    <p data-reveal>Led by some of the best in the business, Effects Tech puts expert teams of sound, light and video professionals at your disposal. Whether it is fabrication, sound and light design or trussing, it is handled by our own people.</p>
    <p data-reveal>Our roster spans corporate conferences, fashion shows, brand launches, themed events, live shows, road shows and promotions for leading event companies and corporate houses.</p>
  </div>
</section>
${statsBlock()}
<section class="founder">
  <div class="founder__img" data-img-reveal data-tilt><img src="assets/img/brand/sarosh-patel.png" alt="Sarosh Patel, founder of Effects Tech" width="400" height="400" loading="lazy"></div>
  <div class="founder__body">
    <p class="eyebrow" data-reveal>Meet the founder</p>
    <h2 class="h-xl" data-split>Sarosh <em>Patel</em></h2>
    <p data-reveal>Sarosh started out twenty-five years ago with an event production company and moved into set design as the projects grew larger. Last-minute changes — a new location, a new request, a designer rethinking the idea on site — forced the team to find creative fixes on the spot.</p>
    <p data-reveal>Over time, repeat partners began asking for the design as well as the build. Before long, Effects Tech was doing both, all the time.</p>
  </div>
</section>
<section class="caps caps--plain">
  <div class="sec-head"><p class="eyebrow" data-reveal>What is in-house</p><h2 class="h-xl" data-split>One team,<br><em>every discipline.</em></h2></div>
  <ul class="caps__list">
    ${capabilities.map(([n, d, s], i) => `<li class="cap" data-cap="assets/img/${s}"><span class="cap__no">${String(i + 1).padStart(2, '0')}</span><h3 class="cap__name">${n}</h3><p class="cap__txt">${d}</p></li>`).join('\n    ')}
  </ul>
  <div class="caps__peek" aria-hidden="true"><img alt="" src="assets/img/${capabilities[0][2]}"></div>
</section>
<section class="assoc"><p class="eyebrow" data-reveal>Our success lies in our associations</p>${logoWall()}</section>
${cta()}`,
});

/* --------------------------------------------------------------- CONTACT */
page({
  file: 'contact.html',
  title: 'Contact',
  desc: 'Start a project with Effects Tech — Mumbai studio address, phone and enquiry form.',
  active: 'contact',
  body: `
<section class="phead phead--contact">
  <p class="eyebrow" data-hero>Contact</p>
  <h1 class="phead__title" data-split data-hero-title>Let’s build<br><em>your next night.</em></h1>
</section>
<section class="contact">
  <form class="form" novalidate data-reveal>
    <fieldset class="form__pick">
      <legend>What are you planning?</legend>
      ${vlist.map((v, i) => `<label class="pick" data-accent="${v.key}"><input type="radio" name="stage" value="${v.name}"${i === 0 ? ' checked' : ''}><span>${v.name}</span></label>`).join('')}
    </fieldset>
    <div class="form__grid">
      <label class="field"><span>Your name</span><input type="text" name="name" autocomplete="name" required></label>
      <label class="field"><span>Company / family</span><input type="text" name="org" autocomplete="organization"></label>
      <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>
      <label class="field"><span>Phone</span><input type="tel" name="phone" autocomplete="tel"></label>
      <label class="field"><span>Event date (if known)</span><input type="text" name="date" placeholder="e.g. February 2027"></label>
      <label class="field"><span>City / venue</span><input type="text" name="city"></label>
      <label class="field field--full"><span>Tell us about it</span><textarea name="message" rows="4" required></textarea></label>
    </div>
    <p class="form__err" role="alert" hidden>Please add your name, a valid email and a few words about the event.</p>
    <button class="btn btn--xl" type="submit" data-magnetic><span>Send enquiry</span>${arrow}</button>
    <div class="form__done" role="status" hidden><h2 class="h-lg">Thank you.</h2><p>Your enquiry is noted. Someone from the team will be in touch shortly.</p></div>
  </form>
  <aside class="cinfo">
    <div data-reveal><h2>Studio</h2><p>${site.address.join('<br>')}</p></div>
    <div data-reveal><h2>Call</h2><p>${site.phones.join('<br>')}</p></div>
    <div data-reveal><h2>Write</h2><p><a href="mailto:${site.email}">${site.email}</a></p></div>
    ${site.people.map((p) => `<div data-reveal><h2>${p.role}</h2><p>${p.name}<br><a href="mailto:${p.email}">${p.email}</a></p></div>`).join('')}
  </aside>
</section>`,
});

console.log(`Built ${7 + projects.length} pages into ./site`);
