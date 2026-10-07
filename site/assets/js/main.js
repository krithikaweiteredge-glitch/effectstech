/* Effects Tech — interaction layer (GSAP + ScrollTrigger + Lenis) */
(() => {
  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const DESK = () => innerWidth > 820;
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });
  gsap.defaults({ ease: 'expo.out', duration: 1.1 });

  /* ---- smooth scroll */
  let lenis = null;
  if (!RM && window.Lenis) {
    lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  /* ---- text splitting */
  function splitWords(el, cls) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
            const w = document.createElement('span');
            if (cls === 'sw') { w.className = 'sw'; w.textContent = part; } else { w.className = 'w'; w.innerHTML = `<span class="wi">${part.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`; }
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
  }
  $$('[data-split]').forEach((el) => splitWords(el));
  $$('[data-scrub]').forEach((el) => splitWords(el, 'sw'));
  if (!RM) gsap.set('[data-split] .wi', { y: 0, yPercent: 115, rotateX: -75, transformPerspective: 700, transformOrigin: '50% 100%' });

  /* ---- curtain + loader */
  const slats = $$('.curtain i');
  const label = $('.curtain__label span');
  const accents = { 'experiences.html': '--c-exp', 'meetings-events.html': '--c-meet', 'weddings.html': '--c-wed' };
  const names = { 'index.html': 'Effects Tech', 'experiences.html': 'Experiences', 'meetings-events.html': 'Meetings & Events', 'weddings.html': 'Weddings', 'work.html': 'Work', 'about.html': 'About', 'contact.html': 'Contact' };

  function heroIn() {
    const tl = gsap.timeline();
    tl.to('[data-hero-title] .wi', { yPercent: 0, rotateX: 0, duration: 1.5, stagger: 0.07 }, 0)
      .to('[data-hero]', { opacity: 1, y: 0, duration: 1.2, stagger: 0.09 }, 0.25)
      .to('.vhero__media img', { scale: 1, duration: 2.4, ease: 'expo.out' }, 0);
    window.__introDone = true;
    window.dispatchEvent(new Event('et:intro'));
  }
  function reveal() {
    if (RM) return heroIn();
    gsap.to(slats, { scaleY: 0, transformOrigin: 'top', duration: 1, ease: 'expo.inOut', stagger: 0.06 });
    gsap.delayedCall(0.45, heroIn);
  }
  if (html.classList.contains('is-first') && !RM) {
    try { sessionStorage.setItem('et-seen', '1'); } catch (e) {}
    const num = $('.loader__num');
    const o = { v: 0 };
    lenis && lenis.stop();
    gsap.timeline({ onComplete: () => { $('.loader').style.display = 'none'; lenis && lenis.start(); } })
      .to('.loader__mark path', { strokeDashoffset: 0, duration: 1.9, ease: 'power2.inOut', stagger: 0.25 }, 0)
      .to(o, { v: 100, duration: 2.1, ease: 'power2.inOut', onUpdate: () => { num.textContent = String(Math.round(o.v)).padStart(3, '0'); } }, 0)
      .to('.loader__bar i', { scaleX: 1, duration: 2.1, ease: 'power2.inOut' }, 0)
      .to('.loader__in', { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' }, 2.2)
      .set(slats, { scaleY: 0 }, 2.7)
      .to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, 2.7)
      .add(heroIn, 3.0);
  } else {
    reveal();
  }

  function leave(url, file) {
    if (RM) { location.href = url; return; }
    const cur = $('.curtain');
    cur.style.setProperty('--accent', `var(${accents[file] || '--c-brand'})`);
    label.textContent = names[file] || '';
    lenis && lenis.stop();
    gsap.timeline({ onComplete: () => { location.href = url; } })
      .fromTo(slats, { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1, duration: 0.75, ease: 'expo.inOut', stagger: 0.05 })
      .fromTo(label, { y: '120%', opacity: 0 }, { y: '0%', opacity: 1, duration: 0.6 }, 0.35);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button || a.target === '_blank') return;
    const raw = a.getAttribute('href');
    if (raw.startsWith('#')) {
      const t = raw === '#top' ? 0 : $(raw);
      if (t === null) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(t, { duration: 1.6 }) : (t === 0 ? scrollTo(0, 0) : t.scrollIntoView());
      return;
    }
    if (/^(mailto:|tel:|https?:)/.test(raw) || !/\.html(#.*)?$/.test(raw)) return;
    e.preventDefault();
    closeMenu();
    leave(a.href, raw.split('#')[0]);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) { gsap.set(slats, { scaleY: 0 }); gsap.set(label, { opacity: 0 }); lenis && lenis.start(); } });

  /* ---- header + menu */
  const hdr = $('.hdr');
  const burger = $('.burger');
  const menu = $('.menu');
  function closeMenu() { menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); }
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    lenis && (open ? lenis.stop() : lenis.start());
    if (open && !RM) gsap.fromTo('.menu__nav a', { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, delay: 0.25, duration: 0.8 });
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  ScrollTrigger.create({ start: 120, end: 'max', onUpdate: (s) => { if (!menu.classList.contains('is-open')) hdr.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > 400); } });

  /* ---- scroll reveals */
  if (!RM) {
    ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, stagger: 0.09 }) });
    $$('[data-split]:not([data-hero-title])').forEach((el) => {
      gsap.to($$('.wi', el), { yPercent: 0, rotateX: 0, duration: 1.4, stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-img-reveal]').forEach((el) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
      tl.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'expo.inOut' }).to($('img', el), { scale: 1, duration: 2, ease: 'expo.out' }, 0.1);
    });
    $$('[data-scrub]').forEach((el) => {
      gsap.fromTo($$('.sw', el), { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: 0.6 } });
    });
    $$('[data-parallax]').forEach((el) => {
      const s = parseFloat(el.dataset.parallax) * 40;
      gsap.fromTo(el, { yPercent: -s }, { yPercent: s, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.doors__row, .more__row').forEach((row) => {
      gsap.from(row.children, { y: 120, rotateX: 14, opacity: 0, transformPerspective: 1400, transformOrigin: '50% 100%', duration: 1.5, stagger: 0.12, scrollTrigger: { trigger: row, start: 'top 85%', once: true } });
    });
    ScrollTrigger.batch('.card', { start: 'top 92%', once: true, onEnter: (b) => gsap.from(b, { y: 70, opacity: 0, duration: 1.3, stagger: 0.1 }) });
    $$('.shot').forEach((el) => {
      gsap.fromTo(el, { rotateX: 16, scale: 0.9, transformPerspective: 1300, transformOrigin: '50% 100%' }, { rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 50%', scrub: 0.6 } });
    });
    $$('[data-vexp]').forEach((el) => {
      const words = $$('.vexp__txt > *', el);
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: '+=160%', pin: $('.vexp__pin', el), scrub: 0.7, anticipatePin: 1 } })
        .fromTo($('.vexp__frame', el), { scale: 0.42, rotateX: 34, rotateZ: -5, yPercent: 8, borderRadius: 28 }, { scale: 1, rotateX: 0, rotateZ: 0, yPercent: 0, borderRadius: 0, ease: 'power2.inOut', duration: 1 }, 0)
        .fromTo($('.vexp__frame video', el), { scale: 1.5 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
        .fromTo(words, { opacity: 0, y: 60, rotateX: -40, transformPerspective: 800 }, { opacity: 1, y: 0, rotateX: 0, stagger: 0.12, duration: 0.45, ease: 'power2.out' }, 0.55)
        .to({}, { duration: 0.25 });
    });
    $$('[data-lwall]').forEach((el) => {
      gsap.fromTo($('.lwall__plane', el), { rotateX: 44, rotateY: -30, y: 80 }, { rotateX: 20, rotateY: -8, y: -40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
    });
    const word = $('.ftr__word');
    if (word) gsap.fromTo(word, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    const ctaT = $('.cta__title');
    if (ctaT) gsap.fromTo(ctaT, { scale: 0.86 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true } });
  }

  /* ---- counters */
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    if (RM) { el.textContent = end; return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2.4, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); }, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ---- pinned horizontal gallery with 3D sway */
  $$('[data-hscroll]').forEach((sec) => {
    const track = $('.strip__track', sec);
    const items = $$('.strip__item', track);
    ScrollTrigger.matchMedia({
      '(min-width: 821px) and (prefers-reduced-motion: no-preference)': () => {
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const rot = gsap.quickTo(items, 'rotateY', { duration: 0.6, ease: 'power3.out' });
        gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: {
            trigger: sec, start: 'center center', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: (s) => rot(gsap.utils.clamp(-14, 14, s.getVelocity() / -220)),
          },
        });
      },
    });
  });

  /* ---- 3D tilt */
  if (FINE && !RM) {
    $$('[data-tilt], [data-tilt-soft]').forEach((el) => {
      const t = $('.card__media', el) || el;
      const max = el.hasAttribute('data-tilt-soft') ? 3 : 8;
      const glare = $('.card__glare', el);
      el.addEventListener('pointermove', (e) => {
        const r = t.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(t, { rotateY: px * max * 2, rotateX: -py * max * 2, transformPerspective: 1000, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
        if (glare) { glare.style.setProperty('--gx', `${(px + 0.5) * 100}%`); glare.style.setProperty('--gy', `${(py + 0.5) * 100}%`); }
      });
      el.addEventListener('pointerleave', () => gsap.to(t, { rotateX: 0, rotateY: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }));
    });
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.36, duration: 0.5, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' }));
    });

    /* ---- cursor */
    const cur = $('.cursor');
    const cl = $('.cursor__label');
    const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3.out' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3.out' });
    addEventListener('pointermove', (e) => {
      cx(e.clientX); cy(e.clientY); cur.classList.add('is-on');
      const lab = e.target.closest && e.target.closest('[data-cursor]');
      const link = e.target.closest && e.target.closest('a, button, .pick, .cap');
      cur.classList.toggle('is-label', !!lab);
      cur.classList.toggle('is-link', !lab && !!link);
      if (lab) { cl.textContent = lab.dataset.cursor; cur.style.setProperty('--accent', getComputedStyle(lab).getPropertyValue('--accent')); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));

    /* ---- capability image peek */
    $$('.caps').forEach((sec) => {
      const peek = $('.caps__peek', sec);
      const pim = $('img', peek);
      const px = gsap.quickTo(peek, 'x', { duration: 0.5, ease: 'power3.out' });
      const py = gsap.quickTo(peek, 'y', { duration: 0.5, ease: 'power3.out' });
      $$('.cap', sec).forEach((c) => {
        new Image().src = c.dataset.cap;
        c.addEventListener('pointerenter', () => { pim.src = c.dataset.cap; peek.classList.add('is-on'); });
        c.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
      });
      sec.addEventListener('pointermove', (e) => { px(e.clientX); py(e.clientY); });
    });
  }

  /* ---- 3D ring carousel */
  $$('[data-ring]').forEach((sec) => {
    const stage = $('.ring__stage', sec), wheel = $('.ring__wheel', sec), items = $$('.ring__item', wheel);
    const n = items.length, step = 360 / n;
    let r = 0, rot = 0, vel = 0, live = false, down = null, moved = 0;
    const layout = () => { r = Math.round(wheel.offsetWidth / 2 / Math.tan(Math.PI / n)) + 26; items.forEach((it, i) => { it.style.transform = `rotateY(${i * step}deg) translateZ(${r}px)`; }); };
    layout(); addEventListener('resize', layout);
    const base = RM ? 0 : 0.07;
    gsap.ticker.add(() => {
      if (!live) return;
      if (down === null) { vel += (base - vel) * 0.04; rot += vel; }
      wheel.style.transform = `translateZ(${-r * 0.5}px) rotateX(-7deg) rotateY(${rot}deg)`;
      items.forEach((it, i) => { const a = Math.abs((((i * step + rot) % 360) + 540) % 360 - 180); it.style.opacity = String(gsap.utils.clamp(0.12, 1, 1.25 - a / 95)); });
    });
    new IntersectionObserver(([e]) => { live = e.isIntersecting; }).observe(sec);
    stage.addEventListener('pointerdown', (e) => { down = e.clientX; moved = 0; });
    addEventListener('pointermove', (e) => { if (down === null) return; const dx = e.clientX - down; down = e.clientX; moved += Math.abs(dx); rot += dx * 0.22; vel = dx * 0.22; });
    addEventListener('pointerup', () => { down = null; });
    stage.addEventListener('click', (e) => { if (moved > 8) { e.preventDefault(); e.stopPropagation(); } }, true);
    if (!RM) ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onUpdate: (s) => { vel += gsap.utils.clamp(-1.2, 1.2, s.getVelocity() / 2600); } });
  });

  /* ---- work filter */
  const chips = $$('.chip');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => { const on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
    const cards = $$('.grid--wall .card');
    const show = cards.filter((c) => f === 'all' || c.dataset.v === f);
    const swap = () => {
      cards.forEach((c) => c.classList.toggle('is-out', !show.includes(c)));
      gsap.fromTo(show, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.05, clearProps: 'transform' });
      ScrollTrigger.refresh();
    };
    RM ? swap() : gsap.to(cards, { opacity: 0, y: -16, duration: 0.3, ease: 'power2.in', onComplete: swap });
  }));

  /* ---- contact form (front-end only) */
  const form = $('.form');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach((f) => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.closest('.field').classList.toggle('is-bad', bad);
      f.setAttribute('aria-invalid', String(bad));
      if (bad && ok) { f.focus(); ok = false; }
    });
    $('.form__err', form).hidden = ok;
    if (!ok) return;
    const done = $('.form__done', form);
    done.hidden = false;
    gsap.from(done, { opacity: 0, duration: 0.6 });
    gsap.from(done.children, { y: 30, opacity: 0, stagger: 0.1, delay: 0.2 });
  });

  /* ---- lazy ambience video */
  if (!RM) {
    const vio = new IntersectionObserver((es) => es.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) { if (!v.src) v.src = v.dataset.video; v.play().catch(() => {}); } else if (v.src) v.pause();
    }), { rootMargin: '200px' });
    $$('video[data-video]').forEach((v) => vio.observe(v));
  }

  /* ---- hero bokeh particles (canvas 2D) */
  $$('canvas[data-particles]').forEach((cv) => {
    if (RM) return;
    const pal = { experiences: ['255,79,139', '150,90,255', '80,160,255'], meetings: ['106,147,255', '60,200,255', '255,255,255'], weddings: ['231,184,102', '255,220,160', '255,150,90'] }[cv.dataset.particles];
    const ctx = cv.getContext('2d');
    let w, h, on = false, raf;
    const P = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: 8 + Math.random() * 46, s: 0.15 + Math.random() * 0.5, c: pal[(Math.random() * pal.length) | 0], a: 0.05 + Math.random() * 0.22, p: Math.random() * 6.28 }));
    const size = () => { const d = Math.min(devicePixelRatio, 1.5); w = cv.width = cv.clientWidth * d; h = cv.height = cv.clientHeight * d; };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      P.forEach((p) => {
        p.y -= p.s * 0.0009; if (p.y < -0.1) { p.y = 1.1; p.x = Math.random(); }
        const x = (p.x + Math.sin(t * 0.0003 + p.p) * 0.02) * w, y = p.y * h, r = p.r * (w / 1400 + 0.5);
        const a = p.a * (0.6 + 0.4 * Math.sin(t * 0.001 + p.p));
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${p.c},${a})`); g.addColorStop(0.7, `rgba(${p.c},${a * 0.5})`); g.addColorStop(1, `rgba(${p.c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill();
      });
      if (on) raf = requestAnimationFrame(draw);
    };
    size(); addEventListener('resize', size);
    new IntersectionObserver(([en]) => { on = en.isIntersecting; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(draw); }).observe(cv);
  });

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
