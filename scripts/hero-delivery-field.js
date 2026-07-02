/* ============================================================
   Hero delivery field — "Portfolio in Motion"

   Ambient canvas animation behind the homepage hero copy:
   abstract project-delivery elements (Gantt clusters, milestone
   timelines, iso structures, burn-up curves) build to completion
   in the side margins, then emit light streaks that converge
   into the feature gallery.

   Usage (from scripts/main.js):
     import { initDeliveryField } from "./hero-delivery-field.js";
     initDeliveryField();

   Expects in the DOM:
     <section class="hero">            — mouse listeners + sizing bounds
     <canvas data-hero-field>          — the drawing surface (inside the section)
     [data-hero-gallery]               — convergence-streak target (its top edge)

   Config via data attrs on the canvas:
     data-intensity   0–10 (default 7)   density / concurrency
     data-labels      "true"|"false"     PRJ-NNN / % / M1–M5 micro-labels
     data-convergence "true"|"false"     completion streaks into the gallery

   Honors prefers-reduced-motion: draws one static completed frame, no loop.
   ============================================================ */

const TAU = Math.PI * 2;
const MONO = '11px "SF Mono", ui-monospace, Menlo, Consolas, monospace';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export class DeliveryField {
  constructor(section, canvas, galleryEl, opts = {}) {
    this.section = section;
    this.canvas = canvas;
    this.galleryEl = galleryEl;
    this.intensity = opts.intensity ?? 7;
    this.labels = opts.labels !== false;
    this.convergence = opts.convergence !== false;

    this.mouse = { x: 0.5, y: 0.5, px: -9999, py: -9999, inside: false };
    this.dust = [];
    this.actors = [];
    this.streaks = [];
    this.pulses = [];
    this.w = 0;
    this.h = 0;
    this.nextSpawn = 0;
    this.typeQueue = [];
    this.projSeq = 11;
    // Spawn slots: left/right columns, clear of the centered copy
    this.slots = [
      { fx: 0.045, fy: 0.1, free: 0 },
      { fx: 0.035, fy: 0.36, free: 0 },
      { fx: 0.06, fy: 0.6, free: 0 },
      { fx: 0.79, fy: 0.09, free: 0 },
      { fx: 0.8, fy: 0.34, free: 0 },
      { fx: 0.77, fy: 0.58, free: 0 },
    ];

    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.tick = this.tick.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onLeave = this.onLeave.bind(this);
  }

  get maxActors() {
    return clamp(Math.round(1 + this.intensity * 0.55), 1, 6);
  }

  start() {
    this.mountT = performance.now();
    this.nextSpawn = this.mountT + 500;
    this.sizeCanvas();
    this.initDust();
    this.ro = new ResizeObserver(() => {
      this.sizeCanvas();
      this.initDust();
      this.actors = [];
      this.slots.forEach((s) => (s.free = 0));
      if (this.reduced) this.staticScene();
    });
    this.ro.observe(this.section);
    if (this.reduced) {
      this.staticScene();
      return this;
    }
    this.section.addEventListener("mousemove", this.onMove);
    this.section.addEventListener("mouseleave", this.onLeave);
    this.raf = requestAnimationFrame(this.tick);
    return this;
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    this.section.removeEventListener("mousemove", this.onMove);
    this.section.removeEventListener("mouseleave", this.onLeave);
  }

  sizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = this.section.offsetWidth;
    this.h = this.section.offsetHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  initDust() {
    let n = Math.round(((this.w * this.h) / 30000) * (0.3 + this.intensity * 0.07));
    n = clamp(n, 14, 90);
    this.dust = Array.from({ length: n }, () => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      r: 0.7 + Math.random() * 1.2,
      depth: 0.4 + Math.random() * 0.6,
      ph: Math.random() * TAU,
    }));
  }

  onMove(e) {
    const r = this.section.getBoundingClientRect();
    this.mouse.px = e.clientX - r.left;
    this.mouse.py = e.clientY - r.top;
    this.mouse.x = this.mouse.px / r.width;
    this.mouse.y = this.mouse.py / r.height;
    this.mouse.inside = true;
  }

  onLeave() {
    this.mouse.inside = false;
    this.mouse.px = -9999;
    this.mouse.py = -9999;
  }

  /* ---------- actor factory ---------- */

  nextType() {
    if (!this.typeQueue.length) {
      const t = ["gantt", "timeline", "iso", "curve"];
      for (let i = t.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [t[i], t[j]] = [t[j], t[i]];
      }
      this.typeQueue = t;
    }
    return this.typeQueue.pop();
  }

  spawnActor(now) {
    const free = this.slots
      .map((s, i) => i)
      .filter(
        (i) =>
          !this.actors.some((a) => a.slot === i) && now >= this.slots[i].free
      );
    if (!free.length) return;
    const slot = free[Math.floor(Math.random() * free.length)];
    const type = this.nextType();
    const px = clamp(this.slots[slot].fx * this.w, 16, Math.max(16, this.w - 280));
    const py = clamp(this.slots[slot].fy * this.h, 60, Math.max(60, this.h - 240));
    const a = {
      type,
      slot,
      px,
      py,
      depth: 0.4 + Math.random() * 0.6,
      born: now,
      hold: 1600,
      fade: 900,
      emitted: false,
    };
    this.projSeq += 1 + Math.floor(Math.random() * 7);
    a.id = "PRJ-" + ("00" + this.projSeq).slice(-3);
    if (type === "gantt") {
      a.build = 6800 + Math.random() * 1400;
      a.bars = Array.from({ length: 4 }, () => ({
        off: Math.round(Math.random() * 44),
        len: 90 + Math.round(Math.random() * 110),
        doneAt: 0,
      }));
      a.anchor = { x: px + 120, y: py + 30 };
    } else if (type === "timeline") {
      a.build = 6000 + Math.random() * 1200;
      a.len = 250 + Math.random() * 60;
      a.n = 5;
      a.lit = [0, 0, 0, 0, 0];
      a.anchor = { x: px + a.len / 2, y: py };
    } else if (type === "iso") {
      a.build = 7400 + Math.random() * 1400;
      a.u = 21;
      a.vh = 17;
      a.boxes = [];
      for (let lv = 0; lv < 3; lv++) {
        for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          a.boxes.push({ i, j, k: lv });
        }
      }
      a.ox = px + 66;
      a.oy = py + 150;
      a.anchor = { x: a.ox, y: a.oy - 3 * a.vh - 20 };
      a.topped = 0;
    } else {
      a.build = 6400 + Math.random() * 1200;
      a.cw = 210;
      a.ch = 104;
      const gains = [];
      let total = 0;
      for (let g = 0; g < 21; g++) {
        const inc = Math.random() < 0.28 ? 0 : Math.random();
        gains.push(inc);
        total += inc;
      }
      a.ys = [0];
      let cum = 0;
      for (const g of gains) {
        cum += g / total;
        a.ys.push(cum);
      }
      a.anchor = { x: px + a.cw, y: py };
      a.doneAt = 0;
    }
    this.actors.push(a);
  }

  /* ---------- drawing helpers ---------- */

  diamond(x, y, r, style, fill) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = style;
      ctx.fill();
    } else {
      ctx.strokeStyle = style;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ring(x, y, r, alpha) {
    const ctx = this.ctx;
    ctx.strokeStyle = `rgba(151,160,255,${alpha.toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
  }

  completionPulse(now, at) {
    if (!at) return null;
    const pp = (now - at) / 650;
    return pp < 1 ? pp : null;
  }

  /* ---------- actor renderers ---------- */

  drawGantt(a, now, prog, g, ox, oy) {
    const ctx = this.ctx;
    const x = a.px + ox * a.depth;
    const y = a.py + oy * a.depth;
    if (this.labels) {
      ctx.font = MONO;
      ctx.fillStyle = `rgba(151,160,255,${(0.5 * g).toFixed(3)})`;
      ctx.fillText(a.id, x, y - 10);
    }
    a.bars.forEach((b, i) => {
      const by = y + i * 17;
      const st = i * 0.19;
      const f = easeOut(clamp((prog - st) / 0.43, 0, 1));
      ctx.fillStyle = `rgba(148,163,201,${(0.14 * g).toFixed(3)})`;
      ctx.fillRect(x + b.off, by, b.len, 4);
      if (f > 0) {
        ctx.fillStyle = `rgba(124,134,250,${(0.62 * g).toFixed(3)})`;
        ctx.fillRect(x + b.off, by, b.len * f, 4);
      }
      if (this.labels && f > 0.03 && f < 1) {
        ctx.font = MONO;
        ctx.fillStyle = `rgba(199,204,255,${(0.72 * g).toFixed(3)})`;
        ctx.fillText(Math.round(f * 100) + "%", x + b.off + b.len * f + 7, by + 5.5);
      }
      const mx = x + b.off + b.len + 9;
      const my = by + 2;
      if (f >= 1) {
        if (!b.doneAt) b.doneAt = now;
        this.diamond(mx, my, 3.5, `rgba(199,204,255,${(0.9 * g).toFixed(3)})`, true);
        const pp = this.completionPulse(now, b.doneAt);
        if (pp !== null) this.ring(mx, my, 4 + pp * 13, 0.5 * (1 - pp) * g);
      } else {
        this.diamond(mx, my, 3.5, `rgba(148,163,201,${(0.3 * g).toFixed(3)})`, false);
      }
    });
  }

  drawTimeline(a, now, prog, g, ox, oy) {
    const ctx = this.ctx;
    const x = a.px + ox * a.depth;
    const y = a.py + oy * a.depth;
    const p = easeOut(prog);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(148,163,201,${(0.14 * g).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + a.len, y);
    ctx.stroke();
    ctx.strokeStyle = `rgba(151,160,255,${(0.5 * g).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + a.len * p, y);
    ctx.stroke();
    if (this.labels) {
      ctx.font = MONO;
      ctx.fillStyle = `rgba(151,160,255,${(0.5 * g).toFixed(3)})`;
      ctx.fillText(a.id, x, y - 14);
    }
    for (let i = 0; i < a.n; i++) {
      const t = i / (a.n - 1);
      const nx = x + a.len * t;
      const last = i === a.n - 1;
      if (p >= t - 0.001) {
        if (!a.lit[i]) a.lit[i] = now;
        if (last) {
          this.diamond(nx, y, 4.5, `rgba(199,204,255,${(0.92 * g).toFixed(3)})`, true);
        } else {
          ctx.fillStyle = `rgba(199,204,255,${(0.85 * g).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(nx, y, 3, 0, TAU);
          ctx.fill();
        }
        const pp = this.completionPulse(now, a.lit[i]);
        if (pp !== null) this.ring(nx, y, 4 + pp * 14, 0.5 * (1 - pp) * g);
      } else if (last) {
        this.diamond(nx, y, 4.5, `rgba(148,163,201,${(0.32 * g).toFixed(3)})`, false);
      } else {
        ctx.strokeStyle = `rgba(148,163,201,${(0.32 * g).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(nx, y, 3, 0, TAU);
        ctx.stroke();
      }
      if (this.labels) {
        ctx.font = MONO;
        ctx.fillStyle = `rgba(148,163,201,${(0.42 * g).toFixed(3)})`;
        ctx.fillText("M" + (i + 1), nx - 6, y + 18);
      }
    }
  }

  isoPt(a, i, j, k, ox, oy) {
    return {
      x: a.ox + (i - j) * a.u + ox * a.depth,
      y: a.oy + ((i + j) * a.u) / 2 - k * a.vh + oy * a.depth,
    };
  }

  drawIso(a, now, prog, g, ox, oy) {
    const ctx = this.ctx;
    ctx.lineWidth = 1;
    let doneLv = 0;
    a.boxes.forEach((bx, m) => {
      const st = m * 0.062;
      const f = clamp((prog - st) / 0.3, 0, 1);
      if (f <= 0) return;
      if (f >= 1 && bx.k + 1 > doneLv) doneLv = bx.k + 1;
      const corn = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const c = corn.map(([di, dj]) => this.isoPt(a, bx.i + di, bx.j + dj, bx.k, ox, oy));
      const ct = corn.map(([di, dj]) => this.isoPt(a, bx.i + di, bx.j + dj, bx.k + 1, ox, oy));
      const edges = [
        [c[0], c[1]], [c[1], c[2]], [c[2], c[3]], [c[3], c[0]],
        [c[0], ct[0]], [c[1], ct[1]], [c[2], ct[2]], [c[3], ct[3]],
        [ct[0], ct[1]], [ct[1], ct[2]], [ct[2], ct[3]], [ct[3], ct[0]],
      ];
      const ep = f * 12;
      const alpha = (0.32 + (f >= 1 ? 0.08 : 0)) * g;
      ctx.strokeStyle = `rgba(151,160,255,${alpha.toFixed(3)})`;
      ctx.beginPath();
      for (let e = 0; e < 12; e++) {
        if (e + 1 <= ep) {
          ctx.moveTo(edges[e][0].x, edges[e][0].y);
          ctx.lineTo(edges[e][1].x, edges[e][1].y);
        } else if (e < ep) {
          const part = ep - e;
          ctx.moveTo(edges[e][0].x, edges[e][0].y);
          ctx.lineTo(
            edges[e][0].x + (edges[e][1].x - edges[e][0].x) * part,
            edges[e][0].y + (edges[e][1].y - edges[e][0].y) * part
          );
          break;
        }
      }
      ctx.stroke();
    });
    if (prog >= 1) {
      if (!a.topped) a.topped = now;
      const pp = this.completionPulse(now, a.topped);
      const apex = this.isoPt(a, 1, 1, 3, ox, oy);
      if (pp !== null) this.ring(apex.x, apex.y, 5 + pp * 18, 0.55 * (1 - pp) * g);
    }
    if (this.labels) {
      ctx.font = MONO;
      ctx.fillStyle = `rgba(151,160,255,${(0.5 * g).toFixed(3)})`;
      const base = this.isoPt(a, 0, 2.35, 0, ox, oy);
      ctx.fillText(`${a.id} · L${Math.max(1, doneLv)}/3`, base.x - 10, base.y + 16);
    }
  }

  drawCurve(a, now, prog, g, ox, oy) {
    const ctx = this.ctx;
    const x = a.px + ox * a.depth;
    const y = a.py + oy * a.depth;
    const baseY = y + a.ch;
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(148,163,201,${(0.18 * g).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + a.cw, baseY);
    ctx.stroke();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = `rgba(148,163,201,${(0.26 * g).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + a.cw, y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (this.labels) {
      ctx.font = MONO;
      ctx.fillStyle = `rgba(148,163,201,${(0.42 * g).toFixed(3)})`;
      ctx.fillText(a.id, x, baseY + 16);
    }
    const n = a.ys.length;
    const p = prog * (n - 1);
    const upto = Math.floor(p);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `rgba(151,160,255,${(0.55 * g).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, baseY - a.ys[0] * a.ch * 0.94);
    let hx = x;
    let hy = baseY;
    for (let i = 1; i < n; i++) {
      const sx = x + (a.cw / (n - 1)) * i;
      const sy = baseY - a.ys[i] * a.ch * 0.94;
      if (i <= upto) {
        ctx.lineTo(sx, sy);
        hx = sx;
        hy = sy;
      } else {
        const part = p - upto;
        if (part > 0 && i === upto + 1) {
          const px0 = x + (a.cw / (n - 1)) * upto;
          const py0 = baseY - a.ys[upto] * a.ch * 0.94;
          hx = px0 + (sx - px0) * part;
          hy = py0 + (sy - py0) * part;
          ctx.lineTo(hx, hy);
        }
        break;
      }
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(220,224,255,${(0.9 * g).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(hx, hy, 2.4, 0, TAU);
    ctx.fill();
    if (this.labels) {
      ctx.font = MONO;
      ctx.fillStyle = `rgba(199,204,255,${(0.75 * g).toFixed(3)})`;
      ctx.fillText(Math.round(clamp(prog, 0, 1) * 100) + "%", hx + 8, hy - 6);
    }
    if (prog >= 1) {
      if (!a.doneAt) a.doneAt = now;
      const pp = this.completionPulse(now, a.doneAt);
      if (pp !== null) this.ring(hx, hy, 4 + pp * 15, 0.55 * (1 - pp) * g);
    }
  }

  /* ---------- convergence streaks ---------- */

  qPoint(s, c, e, t) {
    const u = 1 - t;
    return {
      x: u * u * s.x + 2 * u * t * c.x + t * t * e.x,
      y: u * u * s.y + 2 * u * t * c.y + t * t * e.y,
    };
  }

  spawnStreak(now, sx, sy) {
    if (!this.galleryEl) return;
    const fr = this.galleryEl.getBoundingClientRect();
    const sr = this.section.getBoundingClientRect();
    const end = {
      x: fr.left - sr.left + fr.width * (0.15 + Math.random() * 0.7),
      y: fr.top - sr.top - 4,
    };
    if (sy > end.y - 30) return;
    const mid = { x: (sx + end.x) / 2, y: (sy + end.y) / 2 };
    const dx = end.x - sx;
    const dy = end.y - sy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const off = (Math.random() - 0.5) * Math.min(170, len * 0.5);
    const ctrl = { x: mid.x - (dy / len) * off, y: mid.y + (dx / len) * off };
    this.streaks.push({
      s: { x: sx, y: sy },
      c: ctrl,
      e: end,
      born: now,
      dur: 1250 + Math.random() * 400,
    });
  }

  drawStreaks(now) {
    const ctx = this.ctx;
    for (let k = this.streaks.length - 1; k >= 0; k--) {
      const st = this.streaks[k];
      const p = (now - st.born) / st.dur;
      if (p >= 1) {
        this.pulses.push({ x: st.e.x, y: st.e.y, born: now });
        this.streaks.splice(k, 1);
        continue;
      }
      const head = Math.min(1, p * 1.15);
      const tail = Math.max(0, head - 0.32);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const segs = 22;
      for (let i = 0; i <= segs; i++) {
        const t = tail + (head - tail) * (i / segs);
        const pt = this.qPoint(st.s, st.c, st.e, t);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      const hp = this.qPoint(st.s, st.c, st.e, head);
      const tp = this.qPoint(st.s, st.c, st.e, tail);
      const grad = ctx.createLinearGradient(tp.x, tp.y, hp.x, hp.y);
      grad.addColorStop(0, "rgba(151,160,255,0)");
      grad.addColorStop(1, "rgba(180,187,255,0.7)");
      ctx.strokeStyle = grad;
      ctx.stroke();
      ctx.fillStyle = "rgba(220,224,255,0.9)";
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 2.2, 0, TAU);
      ctx.fill();
    }
    for (let q = this.pulses.length - 1; q >= 0; q--) {
      const pu = this.pulses[q];
      const pa = (now - pu.born) / 700;
      if (pa >= 1) {
        this.pulses.splice(q, 1);
        continue;
      }
      this.ring(pu.x, pu.y, 4 + pa * 22, 0.5 * (1 - pa));
    }
  }

  /* ---------- frame ---------- */

  drawDust(now, animate, ox, oy) {
    const ctx = this.ctx;
    for (const p of this.dust) {
      if (animate) {
        p.x += p.vx;
        p.y += p.vy;
        if (this.mouse.inside) {
          const mdx = p.x - this.mouse.px;
          const mdy = p.y - this.mouse.py;
          const md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 140 && md > 0.001) {
            const f = (1 - md / 140) * 0.45;
            p.x += (mdx / md) * f;
            p.y += (mdy / md) * f;
          }
        }
        if (p.x < -20) p.x = this.w + 20;
        else if (p.x > this.w + 20) p.x = -20;
        if (p.y < -20) p.y = this.h + 20;
        else if (p.y > this.h + 20) p.y = -20;
      }
      const tw = animate ? 0.55 + 0.45 * Math.sin(now * 0.0012 + p.ph) : 0.8;
      ctx.fillStyle = `rgba(160,170,255,${(0.14 + 0.3 * tw).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x + ox * p.depth, p.y + oy * p.depth, p.r, 0, TAU);
      ctx.fill();
    }
  }

  drawActors(now, ox, oy) {
    for (let k = this.actors.length - 1; k >= 0; k--) {
      const a = this.actors[k];
      const age = now - a.born;
      if (age > a.build + a.hold + a.fade) {
        this.slots[a.slot].free = now + 700 + Math.random() * 1100;
        this.actors.splice(k, 1);
        continue;
      }
      const prog = clamp(age / a.build, 0, 1);
      let g =
        Math.min(1, age / 450) *
        (1 - clamp((age - a.build - a.hold) / a.fade, 0, 1));
      if (this.w < 1100) g *= 0.6;
      if (a.type === "gantt") this.drawGantt(a, now, prog, g, ox, oy);
      else if (a.type === "timeline") this.drawTimeline(a, now, prog, g, ox, oy);
      else if (a.type === "iso") this.drawIso(a, now, prog, g, ox, oy);
      else this.drawCurve(a, now, prog, g, ox, oy);
      if (!a.emitted && age > a.build + 250 && this.convergence) {
        a.emitted = true;
        this.spawnStreak(now, a.anchor.x + ox * a.depth, a.anchor.y + oy * a.depth);
      }
    }
  }

  tick(now) {
    this.raf = requestAnimationFrame(this.tick);
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.w, this.h);
    const ox = (this.mouse.x - 0.5) * 20;
    const oy = (this.mouse.y - 0.5) * 12;
    this.drawDust(now, true, ox, oy);
    if (this.actors.length < this.maxActors && now >= this.nextSpawn) {
      this.spawnActor(now);
      this.nextSpawn = now + 850 + Math.random() * 700;
    }
    this.drawActors(now, ox, oy);
    if (this.convergence) this.drawStreaks(now);
  }

  staticScene() {
    if (!this.ctx) return;
    const now = performance.now();
    this.actors = [];
    for (let i = 0; i < Math.min(4, this.maxActors); i++) this.spawnActor(now);
    for (const a of this.actors) {
      a.born = now - a.build - a.hold * 0.4;
      a.emitted = true;
      if (a.bars) a.bars.forEach((b) => (b.doneAt = 1));
      if (a.lit) a.lit = a.lit.map(() => 1);
      a.topped = 1;
      a.doneAt = 1;
    }
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.drawDust(now, false, 0, 0);
    this.drawActors(now, 0, 0);
    this.actors = [];
  }
}

export function initDeliveryField() {
  const canvas = document.querySelector("[data-hero-field]");
  if (!canvas) return null;
  const section = canvas.closest(".hero");
  const gallery = document.querySelector("[data-hero-gallery]");
  if (!section) return null;
  const field = new DeliveryField(section, canvas, gallery, {
    intensity: Number(canvas.dataset.intensity ?? 7),
    labels: canvas.dataset.labels !== "false",
    convergence: canvas.dataset.convergence !== "false",
  });
  return field.start();
}
