// Captain's Desk: theme toggle, dithered details, reading aids, home-page play and cozy sound.
// Everything here is progressive: the site reads fine without it.
(function () {
  "use strict";
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce;
  const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];   // Bayer 4×4
  const clamp = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const token = name => getComputedStyle(root).getPropertyValue(name).trim();
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  function hex(c) {
    const m = c.match(/^#([0-9a-f]{6})$/i);
    if (!m) return [36, 25, 15];
    const n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }

  /* ---------- dithered strips and swatches (re-made when the theme changes) ---------- */
  function swatches() {
    const ink = token("--ink");
    const c = document.createElement("canvas"); c.width = 256; c.height = 10;
    const g = c.getContext("2d"); g.fillStyle = ink;
    for (let y = 0; y < 10; y++) for (let x = 0; x < 256; x++) {
      const v = 1 - Math.abs(x - 128) / 128;
      if (v * 16 > B4[y & 3][x & 3] + 0.5) g.fillRect(x, y, 1, 1);
    }
    root.style.setProperty("--dither-url", `url(${c.toDataURL()})`);
    [[1, 0.25], [2, 0.5]].forEach(([k, lv]) => {
      const d = document.createElement("canvas"); d.width = d.height = 8;
      const dg = d.getContext("2d"); dg.fillStyle = ink;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (lv * 16 > B4[y & 3][x & 3] + 0.5) dg.fillRect(x, y, 1, 1);
      root.style.setProperty("--dz" + k, `url(${d.toDataURL()})`);
    });
  }
  swatches();

  /* ---------- cozy sound: off by default, synthesised with Web Audio, starts on the reader's click ---------- */
  const sfx = (() => {
    let ac = null, master = null, noise = null, sea = null, on = store.get("sound") === "on";
    function ctx() {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
        noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = noise.getChannelData(0); let b = 0;
        for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = i % 2 ? w : b * 3.5; }
      }
      if (ac.state === "suspended") ac.resume();
      return ac;
    }
    function env(g, t, peak, attack, decay) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    }
    function burst(t, freq, q, vol, dur) {
      const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
      n.buffer = noise; n.playbackRate.value = 0.8 + Math.random() * 0.4;
      bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = q;
      env(g, t, vol, 0.002, dur);
      n.connect(bp).connect(g).connect(master); n.start(t, Math.random()); n.stop(t + dur + 0.05);
    }
    function startSea() {
      if (sea || !on) return;
      const a = ctx(), src = a.createBufferSource(), lp = a.createBiquadFilter(), g = a.createGain();
      const lfo = a.createOscillator(), lfoAmt = a.createGain(), swell = a.createOscillator(), swellAmt = a.createGain();
      src.buffer = noise; src.loop = true;
      lp.type = "lowpass"; lp.frequency.value = 420; lp.Q.value = 0.4;
      lfo.frequency.value = 0.07; lfoAmt.gain.value = 220; lfo.connect(lfoAmt).connect(lp.frequency);
      g.gain.value = 0; swell.frequency.value = 0.11; swellAmt.gain.value = 0.018; swell.connect(swellAmt).connect(g.gain);
      g.gain.setTargetAtTime(0.035, a.currentTime, 1.5);
      src.connect(lp).connect(g).connect(master); src.start(); lfo.start(); swell.start();
      sea = { src, g, lfo, swell };
    }
    function stopSea() {
      if (!sea) return;
      const s = sea; sea = null;
      s.g.gain.cancelScheduledValues(ac.currentTime); s.g.gain.setTargetAtTime(0, ac.currentTime, 0.6);
      setTimeout(() => { try { s.src.stop(); s.lfo.stop(); s.swell.stop(); } catch (e) {} }, 3000);
    }
    return {
      get on() { return on; },
      set(v) { on = v; store.set("sound", v ? "on" : "off"); if (!v) stopSea(); },
      lap(x) {                                    // ripple click: water lapping on a hull
        if (!on) return;
        const a = ctx(), t = a.currentTime;
        const n = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain(), pn = a.createStereoPanner();
        n.buffer = noise; bp.type = "bandpass"; bp.Q.value = 1.4;
        bp.frequency.setValueAtTime(1400, t); bp.frequency.exponentialRampToValueAtTime(320, t + 0.5);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        pn.pan.value = Math.max(-0.7, Math.min(0.7, (x / innerWidth) * 2 - 1));
        n.connect(bp).connect(g).connect(pn).connect(master); n.start(t, Math.random()); n.stop(t + 0.8);
      },
      tick() { if (on) { const a = ctx(); burst(a.currentTime, 2400, 1.2, 0.09, 0.035); } },             // paper
      key() { if (on) { const a = ctx(), t = a.currentTime; burst(t, 3200, 2, 0.11, 0.02); burst(t + 0.03, 900, 1.5, 0.06, 0.05); } }, // typewriter
      tock() {                                                                                          // wooden switch
        if (!on) return;
        const a = ctx(), t = a.currentTime;
        [[196, 0.16], [294, 0.07]].forEach(([f, v], i) => {
          const o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = f;
          env(g, t + i * 0.06, v, 0.004, 0.16); o.connect(g).connect(master); o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.25);
        });
      },
      sea(want) { if (want && on) startSea(); else stopSea(); },
    };
  })();
  window.cdSfx = sfx;   // search.js uses the typewriter key

  const isHome = !!document.getElementById("plate");
  const soundBtn = document.getElementById("sound-btn");
  function paintSound() { soundBtn.setAttribute("aria-pressed", String(sfx.on)); soundBtn.textContent = sfx.on ? "♪ On" : "♪ Off"; }
  if (soundBtn) {
    soundBtn.hidden = false; paintSound();
    soundBtn.addEventListener("click", () => { sfx.set(!sfx.on); paintSound(); sfx.tock(); sfx.sea(isHome); });
  }
  document.addEventListener("click", e => {
    if (e.target.closest("#sound-btn")) return;
    if (isHome) sfx.sea(true);                                // resumes the sea after a reload, on the first click
    if (e.target.closest("#theme-btn")) sfx.tock();
    else if (e.target.closest(".copy, .try, .tag-row")) sfx.key();
    else if (e.target.closest("a, summary, .to-top")) sfx.tick();
  });

  /* ---------- theme toggle ---------- */
  const themeBtn = document.getElementById("theme-btn");
  function themeChanged() { swatches(); if (window.cdRepaint) window.cdRepaint(); }
  if (themeBtn) {
    themeBtn.hidden = false;
    themeBtn.addEventListener("click", () => {
      const dark = getComputedStyle(root).colorScheme.includes("dark");
      root.setAttribute("data-theme", dark ? "light" : "dark");
      store.set("theme", dark ? "light" : "dark");
      themeChanged();
    });
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", themeChanged);

  /* ---------- code blocks: copy ---------- */
  document.querySelectorAll(".code-win .copy").forEach(btn => {
    btn.hidden = false;
    btn.addEventListener("click", () => {
      const pre = btn.closest(".code-win").querySelector("pre");
      const text = pre.innerText;
      const done = msg => { btn.textContent = msg; setTimeout(() => (btn.textContent = "copy"), 1400); };
      const select = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done("selected"); };
      try { navigator.clipboard.writeText(text).then(() => done("copied"), select); } catch (e) { select(); }
    });
  });

  /* ---------- back to top ---------- */
  const toTop = document.getElementById("to-top");
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  /* ---------- article: dithered progress bar + contents highlight ---------- */
  const article = document.querySelector(".article");
  const pc = document.getElementById("progress");
  const heads = [...document.querySelectorAll(".prose .sec[id]")];
  const tocLinks = [...document.querySelectorAll(".toc a")];
  let prog = 0;
  function progress() {
    if (!article || !pc) return;
    const w = Math.ceil(innerWidth / 2), h = 3, g = pc.getContext("2d");
    if (pc.width !== w) { pc.width = w; pc.height = h; }
    g.clearRect(0, 0, w, h); g.fillStyle = token("--ink");
    const end = Math.round(prog * w);
    for (let y = 0; y < h; y++) for (let x = 0; x < end; x++) {
      const v = end - x <= 2 ? 1 : 0.5;          // even 50% dither, solid leading edge
      if (v * 16 > B4[y & 3][x & 3] + 0.5) g.fillRect(x, y, 1, 1);
    }
  }
  function onScroll() {
    toTop.classList.toggle("show", scrollY > 600);
    if (!article) return;
    const top = article.getBoundingClientRect().top + scrollY;
    prog = clamp((scrollY - top + innerHeight * 0.2) / Math.max(1, article.offsetHeight - innerHeight * 0.6));
    let cur = heads[0];
    heads.forEach(hd => { if (hd.getBoundingClientRect().top < innerHeight * 0.3) cur = hd; });
    tocLinks.forEach(a => a.setAttribute("aria-current", String(!!cur && a.hash === "#" + cur.id)));
    progress();
  }
  if (pc && article) pc.hidden = false;
  addEventListener("scroll", () => requestAnimationFrame(onScroll), { passive: true });
  addEventListener("resize", onScroll);
  tocLinks.forEach(a => a.addEventListener("click", e => {
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", a.hash);
  }));
  onScroll();

  /* ---------- home: dithered globe, lit from the cursor ---------- */
  const cv = document.getElementById("plate");
  let paintPlate = () => {};
  if (cv) {
    const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, buf = new Float32Array(W * H);
    const L0 = [-0.55, -0.6, 0.58];
    let L = L0.slice(), tL = L0.slice(), t = 0;
    function globe(x, y) {
      const cx = 160, cy = 58, R = 48;
      const dx = (x - cx) / R, dy = (y - cy) / R, r2 = dx * dx + dy * dy;
      let v = 0.94 - 0.1 * (y / H);
      const sh = ((x - cx - 6) / 52) ** 2 + ((y - 112) / 6) ** 2;
      if (sh < 1) v = 0.25 + 0.6 * sh;                                         // shadow
      if (r2 < 1) {
        const nz = Math.sqrt(1 - r2);
        v = 0.08 + 0.95 * Math.max(0, L[0] * dx + L[1] * dy + L[2] * nz);      // lambert
        const lat = Math.asin(-dy), lon = Math.atan2(dx, nz) + t * 0.35;
        if (Math.abs(Math.sin(lat * 6)) < 0.07 || Math.abs(Math.sin(lon * 6)) < 0.08 * (0.4 + nz)) v *= 0.35;  // graticule
        const land = Math.sin(lon * 2.1 + 1) * Math.cos(lat * 3.2) + 0.5 * Math.sin(lon * 5 + lat * 4);
        if (land > 0.75) v *= 0.55;
      } else if (r2 < 1.06) v = 0.05;                                          // outline
      return v;
    }
    paintPlate = function () {
      const ink = hex(token("--ink")), paper = hex(token("--paper"));
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) buf[y * W + x] = clamp(globe(x, y));
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {                // Atkinson error diffusion
        const i = y * W + x, o = buf[i] > 0.5 ? 1 : 0, err = (buf[i] - o) / 8;
        buf[i] = o;
        if (x + 1 < W) buf[i + 1] += err; if (x + 2 < W) buf[i + 2] += err;
        if (y + 1 < H) { if (x > 0) buf[i + W - 1] += err; buf[i + W] += err; if (x + 1 < W) buf[i + W + 1] += err; }
        if (y + 2 < H) buf[i + 2 * W] += err;
      }
      const img = ctx.createImageData(W, H), d = img.data;
      for (let i = 0; i < W * H; i++) { const k = buf[i] ? paper : ink; d[i * 4] = k[0]; d[i * 4 + 1] = k[1]; d[i * 4 + 2] = k[2]; d[i * 4 + 3] = 255; }
      ctx.putImageData(img, 0, 0);
    };
    let visible = true;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);
    function loop() {
      if (visible && !document.hidden) {
        t += 0.03;
        for (let k = 0; k < 3; k++) L[k] += (tL[k] - L[k]) * 0.18;
        paintPlate();
      }
      setTimeout(() => requestAnimationFrame(loop), 110);
    }
    paintPlate();
    if (!reduce) loop();
    if (fineHover) {
      addEventListener("mousemove", e => {
        const r = cv.getBoundingClientRect();
        const rx = ((e.clientX - r.left) / r.width * W - 160) / 110, ry = ((e.clientY - r.top) / r.height * H - 58) / 110;
        const cx = Math.max(-1.4, Math.min(1.4, rx)), cy = Math.max(-1.4, Math.min(1.4, ry)), n = Math.hypot(cx, cy, 0.75);
        tL = [cx / n, cy / n, 0.75 / n];
      });
      document.addEventListener("mouseleave", () => { tL = L0.slice(); });
    }
  }

  /* ---------- home: click ripples (fine pointer only) ---------- */
  const tc = document.getElementById("trail");
  if (cv && tc && fineHover) {
    const g = tc.getContext("2d"), ripples = [];
    let raf = 0;
    const size = () => { tc.width = Math.ceil(innerWidth / 3); tc.height = Math.ceil(innerHeight / 3); };
    function ring(cx, cy, r, w, v) {
      const R = r + w;
      for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
        const d = Math.abs(Math.hypot(x - cx, y - cy) - r);
        if (d <= w && v * (1 - d / w) * 16 > B4[y & 3][x & 3] + 0.5) g.fillRect(x, y, 1, 1);
      }
    }
    function frame() {
      raf = 0;
      const now = performance.now();
      g.clearRect(0, 0, tc.width, tc.height); g.fillStyle = token("--ink");
      for (let i = ripples.length - 1; i >= 0; i--) {
        const p = ripples[i], a = (now - p.t) / 1400;
        if (a >= 1) { ripples.splice(i, 1); continue; }
        ring(p.x, p.y, 2 + (1 - (1 - a) ** 2) * 70, 2.2, 0.75 * (1 - a));
        if (a > 0.18) ring(p.x, p.y, 2 + (1 - (1 - (a - 0.18) / 0.82) ** 2) * 42, 1.8, 0.5 * (1 - a));
      }
      if (ripples.length) raf = requestAnimationFrame(frame);
    }
    tc.hidden = false; size(); addEventListener("resize", size);
    addEventListener("mousedown", e => {
      if (e.button !== 0 || e.target.closest("a, button, input, summary")) return;
      ripples.push({ x: e.clientX / 3, y: e.clientY / 3, t: performance.now() });
      if (!raf) raf = requestAnimationFrame(frame);
      sfx.lap(e.clientX);
    });
  }

  window.cdRepaint = () => { paintPlate(); progress(); };
})();
