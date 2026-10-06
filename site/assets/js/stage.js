/* Effects Tech — WebGL scenes for the home page
   1. Hero: a truss rig with moving-head beams that re-colour per vertical
   2. Fly-through: scroll-driven camera travelling down a corridor of real productions
   3. Showreel: shader transitions between photographs */
import * as THREE from '../vendor/three.module.min.js';

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGL = document.documentElement.classList.contains('webgl');
const DPR = Math.min(devicePixelRatio || 1, 1.75);
const lerp = (a, b, t) => a + (b - a) * t;
const C = (h) => new THREE.Color(h);
const PAL = {
  home: [C('#22c3c4'), C('#eaffff'), C('#3d7dff')],
  experiences: [C('#ff4f8b'), C('#9a5cff'), C('#4fb0ff')],
  meetings: [C('#6a93ff'), C('#39d0ff'), C('#ffffff')],
  weddings: [C('#e7b866'), C('#ffe2b0'), C('#ff8a4a')],
};
const inView = (el, cb) => new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: '80px' }).observe(el);
const pointer = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function trussGeometry(len, s = 0.42, step = 0.85) {
  const p = []; const h = s / 2; const n = Math.round(len / step); const x0 = -len / 2;
  const corners = [[-h, -h], [h, -h], [h, h], [-h, h]];
  corners.forEach(([y, z]) => p.push(x0, y, z, x0 + len, y, z));
  for (let i = 0; i <= n; i++) {
    const x = x0 + (len * i) / n;
    for (let k = 0; k < 4; k++) { const a = corners[k], b = corners[(k + 1) % 4]; p.push(x, a[0], a[1], x, b[0], b[1]); }
    if (i < n) { const x2 = x0 + (len * (i + 1)) / n; const f = i % 2 ? 1 : -1; p.push(x, -h * f, h, x2, h * f, h, x, -h * f, -h, x2, h * f, -h, x, h, -h * f, x2, h, h * f); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
}

/* ------------------------------------------------------------ 1. HERO RIG */
function heroStage() {
  const sec = document.querySelector('[data-stage]'); if (!sec || !hasGL) return;
  const canvas = sec.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR); renderer.setClearColor(0x050608, 1);
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x050608, 0.03);
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const glow = glowTexture();

  const steel = new THREE.LineBasicMaterial({ color: 0x8fa6bd, transparent: true, opacity: 0.32 });
  const rows = [{ z: 1.5, y: 8.2, n: 7, w: 30 }, { z: -4, y: 8.8, n: 6, w: 30 }, { z: -10, y: 9.4, n: 5, w: 30 }];
  rows.forEach((r) => {
    const t = new THREE.LineSegments(trussGeometry(r.w), steel); t.position.set(0, r.y, r.z); scene.add(t);
    [-1, 1].forEach((sd) => { const leg = new THREE.LineSegments(trussGeometry(r.y, 0.42), steel); leg.rotation.z = Math.PI / 2; leg.position.set((sd * r.w) / 2, r.y / 2, r.z); scene.add(leg); });
  });

  const beamMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color() }, uI: { value: 0 } },
    vertexShader: 'varying vec3 vN;varying vec3 vV;varying float vY;void main(){vY=uv.y;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform vec3 uColor;uniform float uI;varying vec3 vN;varying vec3 vV;varying float vY;void main(){float rim=pow(abs(dot(normalize(vN),normalize(vV))),2.4);float fall=pow(vY,1.35);float a=rim*fall*uI;gl_FragColor=vec4(uColor,a);}',
  });
  const L = 22;
  const coneG = new THREE.CylinderGeometry(0.07, 1.9, L, 40, 1, true); coneG.translate(0, -L / 2, 0);
  const poolG = new THREE.CircleGeometry(1, 40);
  const beams = [];
  rows.forEach((r, ri) => {
    for (let i = 0; i < r.n; i++) {
      const x = ((i + 0.5) / r.n - 0.5) * (r.w - 4);
      const pivot = new THREE.Object3D(); pivot.position.set(x, r.y - 0.3, r.z);
      const mat = beamMat(); pivot.add(new THREE.Mesh(coneG, mat));
      const lens = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); lens.scale.setScalar(1.5); pivot.add(lens);
      const mirror = new THREE.Object3D(); mirror.position.set(x, -(r.y - 0.3), r.z); mirror.scale.y = -1;
      const mmat = beamMat(); mirror.add(new THREE.Mesh(coneG, mmat));
      const pool = new THREE.Mesh(poolG, new THREE.MeshBasicMaterial({ map: glow, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2;
      scene.add(pivot, mirror, pool);
      beams.push({ pivot, mirror, mat, mmat, lens, pool, on: 0, ph: Math.random() * 6.28, sp: 0.25 + Math.random() * 0.35, ci: (i + ri) % 3, fan: (x / r.w) * 1.1, row: ri, col: new THREE.Color() });
    }
  });

  const N = 1600; const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 44; pos[i * 3 + 1] = Math.random() * 12; pos[i * 3 + 2] = (Math.random() - 0.7) * 30; }
  const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const haze = new THREE.Points(hg, new THREE.PointsMaterial({ size: 0.09, map: glow, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(haze);

  let target = PAL.home; const state = { scroll: 0, master: 0 };
  document.querySelectorAll('[data-rig]').forEach((a) => {
    const set = () => { target = PAL[a.dataset.rig]; }; const unset = () => { target = PAL.home; };
    a.addEventListener('pointerenter', set); a.addEventListener('focus', set); a.addEventListener('pointerleave', unset); a.addEventListener('blur', unset);
  });
  const lightsUp = () => beams.forEach((b, i) => gsap.to(b, { on: 1, duration: 1.6, delay: 0.2 + b.row * 0.35 + Math.abs(b.fan) * 0.9 + Math.random() * 0.15, ease: 'power2.out' }));
  if (RM) beams.forEach((b) => { b.on = 1; });
  else if (window.__introDone) lightsUp(); else addEventListener('et:intro', lightsUp, { once: true });
  ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => { state.scroll = s.progress; } });

  const resize = () => { const w = sec.clientWidth, h = sec.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 62 : 40; cam.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);
  const dir = new THREE.Vector3(); const px = { x: 0, y: 0 }; let live = true;
  inView(sec, (v) => { live = v; });
  const clock = new THREE.Clock();
  const frame = () => {
    requestAnimationFrame(frame); if (!live) return;
    const t = RM ? 4 : clock.getElapsedTime(); const s = state.scroll;
    px.x = lerp(px.x, pointer.x, 0.04); px.y = lerp(px.y, pointer.y, 0.04);
    cam.position.set(px.x * 1.6, 2.4 + s * 4 - px.y * 0.5, 17 - s * 7);
    cam.lookAt(px.x * 0.4, 4.2 - s * 1.5, -3);
    beams.forEach((b) => {
      b.col.lerp(target[b.ci], 0.045);
      const pan = Math.sin(t * b.sp + b.ph) * 0.42 + b.fan * (0.5 + s * 1.4) + px.x * 0.3;
      const tilt = Math.cos(t * b.sp * 0.8 + b.ph) * 0.3 + 0.12 + px.y * 0.12 - s * 0.5;
      b.pivot.rotation.set(tilt, 0, pan); b.mirror.rotation.set(tilt, 0, pan);
      const I = b.on * (0.5 + 0.12 * Math.sin(t * 2.1 + b.ph)) * (1 - s * 0.5);
      b.mat.uniforms.uColor.value.copy(b.col); b.mat.uniforms.uI.value = I;
      b.mmat.uniforms.uColor.value.copy(b.col); b.mmat.uniforms.uI.value = I * 0.2;
      b.lens.material.color.copy(b.col); b.lens.material.opacity = b.on;
      dir.set(0, -1, 0).applyQuaternion(b.pivot.quaternion);
      const k = b.pivot.position.y / -dir.y;
      b.pool.position.set(b.pivot.position.x + dir.x * k, 0.02, b.pivot.position.z + dir.z * k);
      b.pool.scale.setScalar(Math.min(k * 0.12, 3.4)); b.pool.material.color.copy(b.col); b.pool.material.opacity = b.on * 0.5;
    });
    haze.rotation.y = t * 0.012; haze.position.y = Math.sin(t * 0.2) * 0.3;
    renderer.render(scene, cam);
  };
  frame();
}

/* ------------------------------------------------------- 2. FLY-THROUGH */
function flyThrough() {
  const sec = document.querySelector('[data-fly]'); if (!sec || !hasGL) return;
  const data = JSON.parse(sec.querySelector('.fly__data').textContent);
  const canvas = sec.querySelector('canvas');
  const cap = sec.querySelector('.fly__link'), capMeta = sec.querySelector('.fly__meta'), capTitle = sec.querySelector('.fly__title');
  const bar = sec.querySelector('.fly__prog i'), head = sec.querySelector('.fly__head');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(DPR); renderer.setClearColor(0x050608, 1);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x050608, 8, 34);
  const cam = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
  const D = 10, W = 7.2, H = 4.05, START = 9;
  const loader = new THREE.TextureLoader();
  const planeG = new THREE.PlaneGeometry(W, H);
  const edgeG = new THREE.EdgesGeometry(planeG);
  const panels = data.map((d, i) => {
    const side = i % 2 ? 1 : -1;
    const g = new THREE.Group(); g.position.set(side * 5.1, 2.9 + (i % 3) * 0.25, -i * D); g.rotation.y = -side * 0.5;
    const mat = new THREE.MeshBasicMaterial({ color: 0x15181d });
    loader.load(d.src, (tx) => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; mat.map = tx; mat.color.set(0xffffff); mat.needsUpdate = true; ref.material.map = tx; ref.material.needsUpdate = true; });
    const mesh = new THREE.Mesh(planeG, mat);
    const col = PAL[d.v][0];
    const edge = new THREE.LineSegments(edgeG, new THREE.LineBasicMaterial({ color: col })); edge.scale.setScalar(1.025);
    const ref = new THREE.Mesh(planeG, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 })); ref.scale.y = -1; ref.position.y = -2 * g.position.y;
    const bar2 = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.05), new THREE.MeshBasicMaterial({ color: col })); bar2.position.y = H / 2 + 0.22;
    g.add(mesh, edge, ref, bar2); scene.add(g);
    return { g, side, base: -side * 0.5 };
  });
  const end = START - (data.length - 1) * D;

  const gate = new THREE.LineBasicMaterial({ color: 0x8fa6bd, transparent: true, opacity: 0.3 });
  const gateG = trussGeometry(16, 0.4);
  for (let z = 4; z > end - 12; z -= D / 2) {
    const top = new THREE.LineSegments(gateG, gate); top.position.set(0, 7.2, z); scene.add(top);
    [-1, 1].forEach((sd) => { const leg = new THREE.LineSegments(trussGeometry(7.2, 0.4), gate); leg.rotation.z = Math.PI / 2; leg.position.set(sd * 8, 3.6, z); scene.add(leg); });
  }
  const grid = new THREE.GridHelper(260, 130, 0x1b2a33, 0x10161b); grid.position.z = end / 2; scene.add(grid);
  const N = 2200, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 26; pos[i * 3 + 1] = Math.random() * 9; pos[i * 3 + 2] = START + 4 + Math.random() * (end - START - 20); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.07, map: glowTexture(), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })));

  let p = 0, sp = 0, idx = -1, live = false;
  ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (s) => { p = s.progress; } });
  const setCap = (i) => {
    idx = i; const d = data[i];
    gsap.to(cap, { opacity: 0, y: 14, duration: 0.25, ease: 'power2.in', onComplete: () => {
      capMeta.textContent = `${String(i + 1).padStart(2, '0')} / ${String(data.length).padStart(2, '0')} — ${d.meta}`; capTitle.textContent = d.title; cap.href = d.href; cap.dataset.accent = d.v;
      gsap.to(cap, { opacity: 1, y: 0, duration: 0.6 });
    } });
  };
  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 78 : 52; cam.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);
  inView(sec, (v) => { live = v; if (v) resize(); });
  const px = { x: 0, y: 0 }; let cx = 0, lx = 0;
  const frame = () => {
    requestAnimationFrame(frame); if (!live) return;
    sp = RM ? p : lerp(sp, p, 0.07);
    px.x = lerp(px.x, pointer.x, 0.05); px.y = lerp(px.y, pointer.y, 0.05);
    const z = lerp(START, end, sp); const f = (START - z) / D; const i = Math.max(0, Math.min(data.length - 1, Math.round(f)));
    if (i !== idx) setCap(i);
    const near = panels[i];
    cx = lerp(cx, -near.side * 0.5, 0.035); lx = lerp(lx, near.g.position.x * 0.5, 0.05);
    cam.position.set(cx + px.x * 0.5, 2.9 + Math.sin(f * Math.PI * 2) * 0.1 - px.y * 0.3, z);
    cam.lookAt(lx + px.x * 0.6, 2.9 - px.y * 0.4, z - 9);
    cam.rotation.z += (p - sp) * 0.9;
    panels.forEach((pn, k) => { const d = Math.abs(k - f); pn.g.rotation.y = lerp(pn.g.rotation.y, pn.base * (d < 0.6 ? 0.55 : 1), 0.06); });
    bar.style.transform = `scaleX(${sp})`; head.style.opacity = String(Math.max(0, 1 - sp * 14));
    renderer.render(scene, cam);
  };
  frame();
}

/* ------------------------------------------------------------- 3. REEL */
function reel() {
  const el = document.querySelector('[data-reel]'); if (!el || !hasGL) return;
  const srcs = JSON.parse(el.dataset.reel); const canvas = el.querySelector('canvas');
  const ticksEl = el.querySelector('.reel__ticks'), tc = el.querySelector('.reel__tc');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false }); renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const blank = new THREE.DataTexture(new Uint8Array([5, 6, 8, 255]), 1, 1); blank.needsUpdate = true;
  const u = { tA: { value: blank }, tB: { value: blank }, aA: { value: 1.78 }, aB: { value: 1.78 }, uC: { value: 1.9 }, uMix: { value: 0 }, uT: { value: 0 }, uZa: { value: 0 }, uZb: { value: 0 }, uP: { value: new THREE.Vector2() } };
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}',
    fragmentShader: `precision highp float;varying vec2 vUv;uniform sampler2D tA,tB;uniform float aA,aB,uC,uMix,uT,uZa,uZb;uniform vec2 uP;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
vec2 cov(vec2 uv,float ia,float z){vec2 s=uC>ia?vec2(1.,ia/uC):vec2(uC/ia,1.);return (uv-.5)*s/(1.06+z*.12)+.5+uP*.012;}
void main(){float no=n(vUv*vec2(3.,5.)+uT*.04)*.6+n(vUv*14.)*.4;float th=uMix*1.6-.3;float m=1.-smoothstep(th-.14,th+.14,vUv.x*.7+no*.3);
float e=m*(1.-m)*4.;vec2 d=vec2(no-.5,0.)*.18;
vec2 ua=cov(vUv+d*uMix,aA,uZa),ub=cov(vUv-d*(1.-uMix),aB,uZb);
vec3 a=vec3(texture2D(tA,ua+vec2(e*.012,0.)).r,texture2D(tA,ua).g,texture2D(tA,ua-vec2(e*.012,0.)).b);
vec3 b=vec3(texture2D(tB,ub+vec2(e*.012,0.)).r,texture2D(tB,ub).g,texture2D(tB,ub-vec2(e*.012,0.)).b);
vec3 c=mix(a,b,m)+e*.16;float v=smoothstep(1.25,.35,length(vUv-.5)*1.5);c*=mix(.55,1.,v);c+=(h(vUv*900.+uT)-.5)*.045;gl_FragColor=vec4(c,1.);}`,
  })));
  const loader = new THREE.TextureLoader(); const tex = [];
  const load = (i) => new Promise((res) => { if (tex[i]) return res(tex[i]); loader.load(srcs[i], (t) => { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; tex[i] = t; res(t); }); });
  const ticks = srcs.map((_, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Scene ${i + 1}`); b.innerHTML = '<i></i>'; b.addEventListener('click', () => go(i)); ticksEl.appendChild(b); return b.firstChild; });
  let cur = 0, busy = false, live = false, hold = null; const HOLD = 4.2;
  const asp = (t) => t.image.width / t.image.height;
  const play = () => {
    ticks.forEach((t, k) => gsap.set(t, { scaleX: k < cur ? 1 : 0 }));
    hold && hold.kill();
    hold = gsap.timeline({ onComplete: () => go((cur + 1) % srcs.length) })
      .fromTo(ticks[cur], { scaleX: 0 }, { scaleX: 1, duration: HOLD, ease: 'none' }, 0)
      .fromTo(u.uZa, { value: u.uZa.value }, { value: 1, duration: HOLD + 1.6, ease: 'none' }, 0);
    load((cur + 1) % srcs.length);
    if (!live) hold.pause();
  };
  async function go(i) {
    if (busy || i === cur) return; busy = true; hold && hold.kill();
    const t = await load(i); u.tB.value = t; u.aB.value = asp(t); u.uZb.value = 0;
    gsap.to(u.uZb, { value: 0.25, duration: 1.5, ease: 'none' });
    gsap.to(u.uMix, { value: 1, duration: RM ? 0.01 : 1.5, ease: 'power2.inOut', onComplete: () => {
      u.tA.value = t; u.aA.value = u.aB.value; u.uZa.value = u.uZb.value; u.uMix.value = 0; cur = i; busy = false; play();
    } });
  }
  load(0).then((t) => { u.tA.value = t; u.aA.value = asp(t); play(); });
  let sx = null;
  el.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) sx = e.clientX; });
  addEventListener('pointerup', (e) => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go((cur + (dx < 0 ? 1 : srcs.length - 1)) % srcs.length); });
  el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); u.uP.value.set((e.clientX - r.left) / r.width - 0.5, 0.5 - (e.clientY - r.top) / r.height); });
  const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); u.uC.value = w / h; };
  resize(); addEventListener('resize', resize);
  inView(el, (v) => { live = v; if (hold) v ? hold.play() : hold.pause(); if (v) resize(); });
  const t0 = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame); if (!live) return;
    const s = (now - t0) / 1000; u.uT.value = s;
    const fr = Math.floor((s * 25) % 25), ss = Math.floor(s % 60), mm = Math.floor(s / 60);
    tc.textContent = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
    renderer.render(scene, cam);
  };
  requestAnimationFrame(frame);
}

[heroStage, flyThrough, reel].forEach((fn) => { try { fn(); } catch (err) { console.error(err); document.documentElement.classList.remove('webgl'); } });
