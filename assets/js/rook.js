/* The Rook — site motion and behavior.
   A flock is the brand: ambient rooks cross the sky, close passes sweep past the lens,
   and on the hero a flock assembles into one large rook in flight. A group of rooks is a "building". */
(() => {
'use strict';
const D = document, html = D.documentElement;
const $ = (s, c = D) => c.querySelector(s);
const $$ = (s, c = D) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;
let W = innerWidth, H = innerHeight, DPR = Math.min(2, devicePixelRatio || 1);

/* ---------------- header + menu */
const head = $('.site-head');
const onScroll = () => { if (head) head.classList.toggle('solid', scrollY > 24 || D.body.classList.contains('menu-open')); };
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const menuBtn = $('.menu-btn');
if (menuBtn) {
  const setMenu = open => { D.body.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', String(open)); onScroll(); };
  menuBtn.addEventListener('click', () => setMenu(!D.body.classList.contains('menu-open')));
  $$('.nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 981px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
}
$$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
const grain = $('.grain');
if (grain) try {
  const c = D.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), im = x.createImageData(128, 128);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255 | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  x.putImageData(im, 0, 0); grain.style.backgroundImage = 'url(' + c.toDataURL() + ')';
} catch (e) {}

/* ---------------- small data viz builders */
$$('.waffle').forEach(el => {
  const a = +el.dataset.a || 0, b = +el.dataset.b || 0; let h = '';
  for (let i = 0; i < 100; i++) h += i < a ? '<i class="a"></i>' : (i < a + b ? '<i class="b"></i>' : '<i></i>');
  el.innerHTML = h;
});
$$('.dots[data-on]').forEach(el => {
  const n = +el.dataset.n || 200, on = +el.dataset.on || 20; let h = '';
  for (let i = 0; i < n; i++) h += i < on ? '<i class="on"></i>' : '<i class="lit"></i>';
  el.innerHTML = h;
});
$$('.spark .ln').forEach(p => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch (e) {} });

/* ---------------- reveal + count up */
function countUp(el) {
  const to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
  const fmt = v => pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
  el.setAttribute('aria-label', fmt(to));
  if (reduce) { el.textContent = fmt(to); return; }
  const t0 = performance.now(); el.textContent = fmt(0);
  const step = now => { const t = Math.min(1, Math.max(0, (now - t0 - 350) / 1500)); el.textContent = fmt(to * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const revs = $$('.rev');
const groups = new Map();
revs.forEach(el => {
  if (el.style.getPropertyValue('--d')) return;
  const p = el.parentElement; const k = groups.get(p) || 0; groups.set(p, k + 1);
  el.style.setProperty('--d', Math.min(0.6, k * 0.08).toFixed(2) + 's');
});
const reveal = el => { el.classList.add('in'); $$('[data-count]', el).forEach(countUp); if (el.hasAttribute('data-count')) countUp(el); };
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  revs.forEach(el => io.observe(el));
} else revs.forEach(reveal);

/* ---------------- rook shapes */
/* rook in flight, M-silhouette, span 2 units (adds to current path) */
function birdPath(ctx, x, y, size, f, tilt, fingers) {
  const wy = -0.06 - 0.30 * f, ty = wy - 0.28 * f - 0.02;
  const c = Math.cos(tilt || 0) * size, s = Math.sin(tilt || 0) * size;
  const P = (px, py) => [x + px * c - py * s, y + px * s + py * c];
  const M = (px, py) => { const q = P(px, py); ctx.moveTo(q[0], q[1]); };
  const L = (px, py) => { const q = P(px, py); ctx.lineTo(q[0], q[1]); };
  const Q = (ax, ay, px, py) => { const a = P(ax, ay), q = P(px, py); ctx.quadraticCurveTo(a[0], a[1], q[0], q[1]); };
  M(0, -0.2); Q(0.065, -0.2, 0.07, -0.12);
  Q(0.26, wy - 0.05, 0.5, wy - 0.03); Q(0.76, ty - 0.03, 1.0, ty + 0.01);
  if (fingers) { L(0.93, ty + 0.07); L(0.975, ty + 0.105); L(0.905, ty + 0.13); L(0.945, ty + 0.165); L(0.87, ty + 0.18); L(0.9, ty + 0.215); L(0.83, ty + 0.21); } else L(0.9, ty + 0.17);
  Q(0.7, ty + 0.2, 0.5, wy + 0.16); Q(0.27, wy + 0.22, 0.09, 0.13);
  L(0.075, 0.25); Q(0, 0.34, -0.075, 0.25); L(-0.09, 0.13);
  Q(-0.27, wy + 0.22, -0.5, wy + 0.16);
  if (fingers) { Q(-0.7, ty + 0.2, -0.83, ty + 0.21); L(-0.9, ty + 0.215); L(-0.87, ty + 0.18); L(-0.945, ty + 0.165); L(-0.905, ty + 0.13); L(-0.975, ty + 0.105); L(-0.93, ty + 0.07); L(-1.0, ty + 0.01); }
  else { Q(-0.7, ty + 0.2, -0.9, ty + 0.17); L(-1.0, ty + 0.01); }
  Q(-0.76, ty - 0.03, -0.5, wy - 0.03); Q(-0.26, wy - 0.05, -0.07, -0.12); Q(-0.065, -0.2, 0, -0.2);
  ctx.closePath();
}
const flap = ph => Math.sin(ph);
function vPath(ctx, x, y, size, ph) {
  const f = Math.sin(ph), wy = (-0.06 - 0.3 * f) * size, ty = wy + (-0.28 * f - 0.02) * size;
  ctx.moveTo(x - size, y + ty); ctx.quadraticCurveTo(x - 0.45 * size, y + wy, x, y); ctx.quadraticCurveTo(x + 0.45 * size, y + wy, x + size, y + ty);
}
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------------- formation: a flock that assembles into a shape */
const PAL = ['#2f2d86', '#4a3cb0', '#6a55f0', '#8f7dff', '#5d7dff', '#23aaa3', '#3fd0c8', '#e0bf45', '#cc55c8', '#d9d3ff'];
const DARK = '#3d3b7c';
/* how far a point on the wing lifts as the big rook flaps, in size units */
const lift = a => a <= 0.07 ? 0 : (a <= 0.5 ? 0.30 * (a - 0.07) / 0.43 : 0.30 + 0.56 * (a - 0.5));
class Formation {
  constructor(c) {
    this.c = c; this.x = c.getContext('2d'); this.shape = c.dataset.shape || 'bird';
    this.text = c.dataset.text || 'THE ROOK'; this.birds = []; this.pts = []; this.on = false; this.vis = false; this.t0 = 0;
    this.f0 = 0.78; this.nextLift = 0; this.started = false;
  }
  layout() {
    const r = this.c.getBoundingClientRect(); this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.c.width = Math.round(this.w * DPR); this.c.height = Math.round(this.h * DPR);
    this.x.setTransform(DPR, 0, 0, DPR, 0, 0);
    this.sample();
    if (this.started) { const R = Math.random; this.birds.forEach(b => { const p = this.pts[(R() * this.pts.length) | 0]; b.u = p[0]; b.v = p[1]; b.b = p[2]; }); }
  }
  sample() {
    const w = this.w, h = this.h, mobile = w < 900, q = 0.5;
    const oc = D.createElement('canvas'); oc.width = Math.max(1, Math.round(w * q)); oc.height = Math.max(1, Math.round(h * q));
    const o = oc.getContext('2d'); o.fillStyle = '#fff';
    let cx, cy, size;
    /* on narrow screens the flock lives in the open space above the copy */
    const copy = this.c.parentElement && this.c.parentElement.querySelector('.hero-copy,.close-copy');
    const cr = this.c.getBoundingClientRect(), top0 = 84;
    const room = copy ? Math.max(160, copy.getBoundingClientRect().top - cr.top - 24 - top0) : h * 0.4;
    if (this.shape === 'bird') {
      if (mobile) { size = Math.min(w * 0.44, room * 0.62); cx = w * 0.5; cy = top0 + room * 0.52; }
      else { size = Math.min(w * 0.27, h * 0.44); cx = w * 0.69; cy = h * 0.40; }
      this.tilt = -0.035;
      o.beginPath(); birdPath(o, cx * q, cy * q, size * q, this.f0, this.tilt, true); o.fill();
    } else {
      const lines = mobile ? this.text.split(' ') : [this.text];
      const maxW = w * (mobile ? 0.84 : 0.88);
      let fs = mobile ? 140 : 260;
      const setFont = s => { o.font = '800 expanded ' + s + 'px Archivo, "Helvetica Neue", Arial, sans-serif'; try { o.letterSpacing = (s * 0.06) + 'px'; } catch (e) {} };
      setFont(fs * q);
      const widest = () => Math.max(...lines.map(l => o.measureText(l).width));
      fs = fs * Math.min(1, (maxW * q) / widest()); fs = Math.min(fs, mobile ? room * 0.42 : h * 0.3);
      setFont(fs * q);
      o.textAlign = 'center'; o.textBaseline = 'middle';
      const lh = fs * 1.02, top = mobile ? top0 + room * 0.5 - (lines.length - 1) * lh / 2 : Math.min(h * 0.32, top0 + room * 0.45);
      lines.forEach((l, i) => o.fillText(l, (w / 2) * q, (top + i * lh) * q));
      cx = w / 2; cy = top; size = fs; this.tilt = 0;
    }
    this.cx = cx; this.cy = cy; this.size = size;
    const d = o.getImageData(0, 0, oc.width, oc.height).data, cand = [];
    for (let j = 0; j < oc.height; j++) for (let i = 0; i < oc.width; i++) if (d[(j * oc.width + i) * 4 + 3] > 120) cand.push([i / q, j / q]);
    const n = this.shape === 'bird' ? (mobile ? 700 : 1500) : (mobile ? 650 : 1300);
    const R = Math.random, pts = [];
    for (let k = 0; k < n && cand.length; k++) {
      const p = cand[(R() * cand.length) | 0];
      const px = p[0] + (R() - 0.5) * 2.4, py = p[1] + (R() - 0.5) * 2.4;
      const u = (px - cx) / size, v = (py - cy) / size;
      pts.push([u, v, this.colorFor(u, v, R)]);
    }
    this.pts = pts;
  }
  colorFor(u, v, R) {
    const r = R();
    if (r < 0.06) return 8; /* magenta glints */
    if (this.shape === 'bird') {
      const a = Math.abs(u);
      if (a < 0.38 && v < 0.12 && r < 0.62) { const g = R(); return g < 0.38 ? 5 : g < 0.66 ? 6 : g < 0.8 ? 7 : 4; } /* iridescent shoulders */
      if (a > 0.8) return R() < 0.5 ? 1 : 2; /* deep wingtips */
      const g = R(); return g < 0.3 ? 2 : g < 0.62 ? 3 : g < 0.84 ? 4 : 1;
    }
    const t = (u + 4) / 8, g = R();
    if (g < 0.18) return 5 + (R() < 0.5 ? 0 : 1);
    if (g < 0.24) return 7;
    return t < 0.5 ? (R() < 0.5 ? 3 : 2) : (R() < 0.5 ? 3 : 4);
  }
  target(b, t) {
    if (this.shape !== 'bird') return [this.cx + b.u * this.size + Math.sin(t * 0.6 + b.u * 2) * 1.5, this.cy + b.v * this.size + Math.cos(t * 0.5 + b.v * 3) * 1.5];
    /* the big rook flaps slowly: wing points lift in proportion to their distance from the body */
    const f = this.f0 + 0.24 * Math.sin(t * TAU / 4.6);
    const dy = -(f - this.f0) * lift(Math.abs(b.u)), bob = Math.sin(t * 0.55) * 6;
    return [this.cx + b.u * this.size, this.cy + (b.v + dy) * this.size + bob];
  }
  spawn(p, R, fromLeft) {
    const w = this.w, h = this.h, left = fromLeft !== undefined ? fromLeft : R() < 0.72;
    return {
      u: p[0], v: p[1], b: p[2],
      x: left ? -30 - R() * w * 0.45 : w * (0.15 + R() * 0.85), y: left ? h * (0.05 + R() * 0.9) : (R() < 0.5 ? -30 - R() * 220 : h + 30 + R() * 220),
      vx: left ? 380 + R() * 420 : (R() - 0.5) * 260, vy: left ? (R() - 0.6) * 200 : 0,
      ph: R() * TAU, phs: 12 + R() * 8, delay: R() * 0.8, size: 2.4 + R() * 2.4, fly: false, gone: false, born: 0
    };
  }
  start(now) {
    if (!this.pts.length) return;
    const R = Math.random;
    this.birds = this.pts.map(p => { const b = this.spawn(p, R); if (b.vy === 0) b.vy = b.y < 0 ? 300 + R() * 200 : -(300 + R() * 200); return b; });
    this.t0 = now; this.on = true; this.started = true; this.nextLift = now + 4200;
  }
  leave() {
    if (!this.on) return; this.on = false;
    const t = (performance.now() - this.t0) / 1000;
    for (const b of this.birds) { if (!b.fly && t < b.delay) b.gone = true; if (b.gone) continue; b.fly = true; const a = -0.5 + (Math.random() - 0.5) * 0.9, v = 380 + Math.random() * 380; b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v; }
  }
  update(dt, now) {
    const t = (now - this.t0) / 1000, TG = 0.9;
    for (const b of this.birds) {
      if (b.gone) continue;
      if (b.fly) { b.vy -= 40 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.ph += dt * b.phs; if (b.x > this.w + 60 || b.x < -60 || b.y < -60 || b.y > this.h + 60) b.gone = true; continue; }
      const tb = t - b.born - b.delay;
      if (tb < 0) continue;
      const [tx, ty] = this.target(b, t);
      if (tb < TG) {
        const a = Math.sin(b.y * 0.007 + t * 2.1 + b.ph) * 1.1 + Math.cos(b.x * 0.004 - t * 1.3);
        b.vx += Math.cos(a) * 280 * dt + (tx - b.x) * 0.9 * dt; b.vy += Math.sin(a) * 280 * dt + (ty - b.y) * 0.9 * dt;
      } else {
        const k = Math.min(1, (tb - TG) / 0.9), K = 6 + 40 * k * k, C = 2 * Math.sqrt(K) * 0.9;
        b.vx += ((tx - b.x) * K - b.vx * C) * dt; b.vy += ((ty - b.y) * K - b.vy * C) * dt;
      }
      const sp = Math.hypot(b.vx, b.vy); if (sp > 1150) { b.vx *= 1150 / sp; b.vy *= 1150 / sp; }
      b.x += b.vx * dt; b.y += b.vy * dt; b.ph += dt * (sp < 50 ? 5 : b.phs);
    }
    /* the building is never finished: a rook leaves, another arrives to take its place */
    if (this.on && now > this.nextLift) {
      this.nextLift = now + 260 + Math.random() * 520;
      const live = this.birds.filter(b => !b.fly && !b.gone && (t - b.born - b.delay) > 3);
      if (live.length) {
        const b = live[(Math.random() * live.length) | 0];
        b.fly = true; const a = -0.75 + (Math.random() - 0.5) * 0.6, v = 220 + Math.random() * 240; b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v; b.size *= 1.15;
        const nb = this.spawn([b.u, b.v, b.b], Math.random, true); nb.born = t; nb.delay = 0; this.birds.push(nb);
      }
    }
    if (this.birds.length > this.pts.length * 1.4) this.birds = this.birds.filter(b => !b.gone);
    if (!this.on && this.birds.length && this.birds.every(b => b.gone)) this.birds = [];
  }
  draw(now) {
    const o = this.x, t = (now - this.t0) / 1000;
    o.clearRect(0, 0, this.w, this.h);
    if (!this.birds.length) return;
    const lit = PAL.map(() => []), dark = [], fly = PAL.map(() => []);
    const sweep = ((t * 0.16) % 1.6) * 2 - 1.6; /* a light band crossing the wings */
    for (const b of this.birds) {
      if (b.gone || (!b.fly && t - b.born - b.delay < 0)) continue;
      if (b.fly) { fly[b.b].push(b); continue; }
      const [tx, ty] = this.target(b, t), dx = tx - b.x, dy = ty - b.y;
      if (dx * dx + dy * dy < 900) { const s = b.u + b.v * 0.6; lit[Math.abs(s - sweep) < 0.12 && b.b < 5 ? 9 : b.b].push(b); }
      else dark.push(b);
    }
    o.lineCap = 'round'; o.lineWidth = 1.9;
    o.strokeStyle = DARK; o.beginPath(); for (const b of dark) vPath(o, b.x, b.y, b.size, b.ph); o.stroke();
    lit.forEach((l, i) => { if (!l.length) return; o.strokeStyle = PAL[i]; o.beginPath(); for (const b of l) vPath(o, b.x, b.y, b.size, b.ph); o.stroke(); });
    fly.forEach((l, i) => { if (!l.length) return; o.strokeStyle = PAL[i]; o.beginPath(); for (const b of l) vPath(o, b.x, b.y, b.size * 1.1, b.ph); o.stroke(); });
  }
  still() {
    /* reduced motion: the finished shape, drawn once */
    const o = this.x; o.clearRect(0, 0, this.w, this.h); o.lineCap = 'round'; o.lineWidth = 1.9;
    const by = PAL.map(() => []); const R = rng(7);
    this.pts.forEach(p => by[p[2]].push({ x: this.cx + p[0] * this.size, y: this.cy + p[1] * this.size, s: 2.4 + R() * 2.4, ph: R() * TAU }));
    by.forEach((l, i) => { if (!l.length) return; o.strokeStyle = PAL[i]; o.beginPath(); for (const b of l) vPath(o, b.x, b.y, b.s, b.ph); o.stroke(); });
  }
}
const forms = $$('canvas.formation').map(c => new Formation(c));

/* ---------------- sky: ambient flocks far behind the page */
const sky = $('#sky'), sx = sky && sky.getContext('2d');
const amb = {
  birds: [], next: 0,
  spawn(now) {
    const n = 3 + (Math.random() * 5 | 0), right = Math.random() < 0.72, y0 = H * (0.12 + Math.random() * 0.55), sp = 55 + Math.random() * 60, size = 3 + Math.random() * 4.5;
    for (let i = 0; i < n; i++) this.birds.push({ x: right ? -30 - i * (16 + Math.random() * 22) : W + 30 + i * (16 + Math.random() * 22), y: y0 + (Math.random() - 0.5) * 60, vx: (right ? 1 : -1) * sp * (0.9 + Math.random() * 0.2), vy: -sp * 0.12 * Math.random(), size: size * (0.75 + Math.random() * 0.5), ph: Math.random() * TAU, phs: 8 + Math.random() * 4, w: Math.random() * TAU });
    this.next = now + 7000 + Math.random() * 7000;
  },
  update(dt, now) {
    if (now > this.next) this.spawn(now);
    for (const b of this.birds) { b.x += b.vx * dt; b.w += dt * 1.1; b.y += (b.vy + Math.sin(b.w) * 8) * dt; b.ph += dt * b.phs; }
    this.birds = this.birds.filter(b => b.x > -260 && b.x < W + 260 && b.y > -60);
  },
  draw() {
    if (!sx) return; sx.clearRect(0, 0, W, H);
    if (!this.birds.length) return;
    sx.lineCap = 'round'; sx.strokeStyle = '#2a2a5c'; sx.lineWidth = 1.6;
    sx.beginPath(); for (const b of this.birds) if (b.size < 5.5) vPath(sx, b.x, b.y, b.size, b.ph); sx.stroke();
    sx.fillStyle = '#2a2a5c'; sx.beginPath(); for (const b of this.birds) if (b.size >= 5.5) birdPath(sx, b.x, b.y, b.size, flap(b.ph), b.vx < 0 ? 0.08 : -0.08, false); sx.fill();
  }
};

/* ---------------- near passes: rooks crossing close to the lens */
const nearC = $('#near'), nx = nearC && nearC.getContext('2d');
const near = {
  birds: [], running: false, last: 0,
  small(dir) {
    const n = 3 + (Math.random() * 3 | 0), y0 = H * (0.25 + Math.random() * 0.4);
    for (let i = 0; i < n; i++) this.birds.push({ x: dir > 0 ? -60 - i * (40 + Math.random() * 70) : W + 60 + i * (40 + Math.random() * 70), y: y0 + (Math.random() - 0.5) * H * 0.3, vx: dir * (980 + Math.random() * 480), vy: -(60 + Math.random() * 160), size: 11 + Math.random() * 18, ph: Math.random() * TAU, phs: 16 + Math.random() * 6 });
    this.run();
  },
  big(dir) {
    const n = W < 700 ? 22 : 48;
    for (let i = 0; i < n; i++) this.birds.push({ x: dir > 0 ? -140 - Math.random() * W * 0.7 : W + 140 + Math.random() * W * 0.7, y: H * (0.35 + Math.random() * 0.95), vx: dir * (1150 + Math.random() * 700), vy: -(360 + Math.random() * 420), size: 12 + Math.pow(Math.random(), 2.3) * (W < 700 ? 64 : 112), ph: Math.random() * TAU, phs: 15 + Math.random() * 6 });
    this.run();
  },
  run() { if (!nx || this.running) return; this.running = true; this.last = performance.now(); requestAnimationFrame(t => this.loop(t)); },
  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    nx.clearRect(0, 0, W, H);
    for (const b of this.birds) { b.x += b.vx * dt; b.y += b.vy * dt; b.ph += dt * b.phs; }
    this.birds = this.birds.filter(b => b.x > -400 && b.x < W + 400 && b.y > -260);
    this.birds.sort((a, b) => a.size - b.size);
    for (const b of this.birds) {
      const tilt = Math.atan2(b.vy, Math.abs(b.vx)) * 0.35 * Math.sign(b.vx);
      if (b.size > 40) { nx.globalAlpha = 0.28; nx.fillStyle = '#03020a'; nx.beginPath(); birdPath(nx, b.x - b.vx * 0.016, b.y - b.vy * 0.016, b.size, flap(b.ph - 0.4), tilt, true); nx.fill(); }
      nx.globalAlpha = 0.95; nx.fillStyle = '#04030c'; nx.beginPath(); birdPath(nx, b.x, b.y, b.size, flap(b.ph), tilt, b.size > 16); nx.fill();
      if (b.size > 26) { nx.globalAlpha = 0.55; nx.strokeStyle = '#6a55f0'; nx.lineWidth = 1; nx.stroke(); }
    }
    nx.globalAlpha = 1;
    if (this.birds.length) requestAnimationFrame(t => this.loop(t)); else { this.running = false; nx.clearRect(0, 0, W, H); }
  }
};

/* ---------------- rookery: a tree of nests with rooks circling */
const rk = {
  c: $('#rookery'), x: null, bg: null, w: 0, h: 0, birds: [], vis: false,
  layout() {
    if (!this.c) return;
    const r = this.c.getBoundingClientRect(); this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.c.width = Math.round(this.w * DPR); this.c.height = Math.round(this.h * DPR);
    this.x = this.c.getContext('2d'); this.bg = this.tree();
    const R = rng(21); this.birds = [];
    for (let i = 0; i < 11; i++) this.birds.push({ a: R() * TAU, w: (0.18 + R() * 0.22) * (R() < 0.5 ? -1 : 1), rx: this.w * (0.16 + R() * 0.28), ry: this.h * (0.03 + R() * 0.06), cy: this.h * (0.1 + R() * 0.12), size: this.w * (0.016 + R() * 0.016), ph: R() * TAU });
    this.frame(0, true);
  },
  tree() {
    const w = this.w, h = this.h, oc = D.createElement('canvas');
    oc.width = Math.round(w * DPR); oc.height = Math.round(h * DPR);
    const o = oc.getContext('2d'); o.scale(DPR, DPR);
    o.fillStyle = '#1a1950'; o.beginPath(); o.arc(w * 0.5, h * 0.38, Math.min(w * 0.46, h * 0.36), 0, TAU); o.fill();
    o.fillStyle = '#232167'; o.beginPath(); o.arc(w * 0.5, h * 0.38, Math.min(w * 0.3, h * 0.24), 0, TAU); o.fill();
    const R = rng(5), nests = [];
    o.lineCap = 'round';
    const br = (x, y, len, ang, wid, d) => {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len, mx = (x + x2) / 2 + (R() - 0.5) * len * 0.2, my = (y + y2) / 2 + (R() - 0.5) * len * 0.2;
      o.strokeStyle = 'rgba(143,125,255,.45)'; o.lineWidth = wid + 1.4; o.beginPath(); o.moveTo(x - 1, y); o.quadraticCurveTo(mx - 1, my, x2 - 1, y2); o.stroke();
      o.strokeStyle = '#070818'; o.lineWidth = wid; o.beginPath(); o.moveTo(x, y); o.quadraticCurveTo(mx, my, x2, y2); o.stroke();
      if (d >= 3 && d <= 5 && R() < 0.3) nests.push([x2, y2, w * (0.022 + R() * 0.018)]);
      if (d === 0) return;
      const n = d > 5 ? 2 : (R() < 0.5 ? 2 : 3);
      for (let i = 0; i < n; i++) br(x2, y2, len * (0.72 + R() * 0.1), ang + (i - (n - 1) / 2) * (0.42 + R() * 0.25) + (R() - 0.5) * 0.25, wid * 0.68, d - 1);
    };
    br(w * 0.47, h * 1.02, h * 0.19, -Math.PI / 2 + (R() - 0.5) * 0.12, w * 0.05, 8);
    for (const [x0, y0, r] of nests) {
      o.fillStyle = '#05060f'; o.beginPath(); o.ellipse(x0, y0 + 2, r * 1.05, r * 0.62, 0, 0, TAU); o.fill();
      for (let k = 0; k < 34; k++) { const a = R() * TAU, rr = r * (0.5 + R() * 0.7); o.strokeStyle = 'rgba(5,6,15,' + (0.6 + R() * 0.4).toFixed(2) + ')'; o.lineWidth = 0.8 + R() * 1.4; o.beginPath(); o.moveTo(x0 + Math.cos(a) * rr, y0 + Math.sin(a) * rr * 0.55); o.lineTo(x0 + Math.cos(a + 1.1) * rr, y0 + Math.sin(a + 1.1) * rr * 0.55 + R() * 3); o.stroke(); }
    }
    return oc;
  },
  frame(dt, force) {
    if (!this.x || !(this.vis || force)) return;
    const o = this.x; o.setTransform(DPR, 0, 0, DPR, 0, 0); o.clearRect(0, 0, this.w, this.h);
    o.drawImage(this.bg, 0, 0, this.w, this.h);
    o.fillStyle = '#05060f'; o.beginPath();
    for (const b of this.birds) { if (!reduce) { b.a += b.w * dt; b.ph += dt * 9; } birdPath(o, this.w * 0.5 + Math.cos(b.a) * b.rx, b.cy + Math.sin(b.a) * b.ry, b.size, flap(b.ph), Math.cos(b.a) * 0.15 * Math.sign(b.w), b.size > 12); }
    o.fill();
  }
};

/* ---------------- visibility triggers */
const io2 = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  const f = forms.find(x => x.c === e.target);
  if (f) {
    f.vis = e.isIntersecting;
    if (reduce) { if (e.isIntersecting) f.still(); return; }
    if (e.isIntersecting && !f.on) f.start(performance.now()); else if (!e.isIntersecting && f.on) f.leave();
  }
  if (rk.c === e.target) rk.vis = e.isIntersecting;
}), { threshold: 0.18 }) : null;
if (io2) { forms.forEach(f => io2.observe(f.c)); if (rk.c) io2.observe(rk.c); }

let lastY = scrollY, dir = 1;
addEventListener('scroll', () => { const y = scrollY; if (Math.abs(y - lastY) > 2) dir = y > lastY ? 1 : -1; lastY = y; }, { passive: true });
if (!reduce && 'IntersectionObserver' in window) {
  const passes = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const kind = e.target.dataset.pass; passes.unobserve(e.target);
    if (kind === 'flock') near.big(dir); else near.small(dir);
  }), { threshold: 0.35 });
  $$('[data-pass]').forEach(el => passes.observe(el));
}

/* ---------------- sizing + loop */
function resize() {
  DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  [sky, nearC].forEach(c => { if (!c) return; c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0); });
  forms.forEach(f => { f.layout(); if (reduce && f.vis) f.still(); });
  rk.layout();
}
let rt = 0, lastW = W;
addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => {
    const widthChanged = innerWidth !== lastW; lastW = innerWidth;
    resize();
    if (widthChanged && !reduce) forms.forEach(f => { if (f.vis) f.start(performance.now()); });
  }, 180);
});
const boot = () => {
  resize();
  forms.forEach(f => { const r = f.c.getBoundingClientRect(); if (r.bottom > 0 && r.top < H) { f.vis = true; reduce ? f.still() : f.start(performance.now()); } });
};
(D.fonts && D.fonts.load ? D.fonts.load('800 expanded 100px Archivo').catch(() => {}) : Promise.resolve()).then(boot, boot);

const bars = $('.bars');
if (bars && !reduce) {
  let seen = false; try { seen = sessionStorage.getItem('rook-bars') === '1'; sessionStorage.setItem('rook-bars', '1'); } catch (e) {}
  if (!seen) { bars.classList.add('run'); setTimeout(() => bars.classList.remove('run'), 1700); }
}

if (!reduce) {
  let last = performance.now(), on = true;
  amb.next = last + 2800;
  D.addEventListener('visibilitychange', () => { on = !D.hidden; last = performance.now(); });
  const loop = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (on) {
      amb.update(dt, now); amb.draw();
      for (const f of forms) if (f.vis || f.birds.length) { f.update(dt, now); f.draw(now); }
      rk.frame(dt);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
})();
