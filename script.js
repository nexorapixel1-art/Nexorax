/* =====================================================
   NEXORA: script.js (no dependencies, no build step)
   ===================================================== */

/* >>> EDIT THIS: put your real email address between the quotes.
   Until you do, the contact form will not open an email draft. <<< */
const CONTACT_EMAIL = "YOUR-EMAIL@EXAMPLE.COM"; // PLACEHOLDER, replace before launch

(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const fineMQ = matchMedia("(hover: hover) and (pointer: fine)");
  const deskMQ = matchMedia("(min-width: 900px)");
  const html = document.documentElement;

  /* ---------- Hero entrance ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("ready")));

  /* ---------- Footer year ---------- */
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Scroll reveals ---------- */
  const reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 60 + "ms"; io.observe(el); });
  } else reveals.forEach((el) => el.classList.add("in"));

  /* ---------- Navigation ---------- */
  const nav = $("#nav"), menu = $("#menu"), menuBtn = $("#menu-btn");
  const menuLinks = $$("a", menu);
  const setMenu = (open, returnFocus) => {
    if (open === menu.classList.contains("open")) return; // nothing to change
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    html.style.overflow = open ? "hidden" : "";
    if (open) requestAnimationFrame(() => { if (menuLinks[0]) menuLinks[0].focus(); }); // move focus into the menu
    else if (returnFocus) menuBtn.focus(); // restore focus to the button
  };
  menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (!menu.classList.contains("open")) return;
    if (e.key === "Escape") { setMenu(false, true); return; }
    if (e.key !== "Tab") return;
    // keep Tab / Shift+Tab inside the open menu (menu button + menu links)
    const ring = [menuBtn].concat(menuLinks), last = ring[ring.length - 1], active = document.activeElement;
    if (e.shiftKey && active === menuBtn) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); menuBtn.focus(); }
    else if (ring.indexOf(active) === -1) { e.preventDefault(); menuBtn.focus(); }
  });
  matchMedia("(min-width: 821px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });

  /* ---------- One rAF-throttled scroll loop ---------- */
  let lastY = scrollY, ticking = false;
  const parallaxEls = $$("[data-parallax]");
  const wrap = $("#pj-wrap"), track = $("#pj-track");
  const stepsWrap = $("#steps-wrap"), railBar = $("#rail-bar");
  let pinned = false;

  function onScroll() {
    ticking = false;
    const y = scrollY;
    // nav: hide on scroll down, show on scroll up
    nav.classList.toggle("solid", y > 40);
    const menuOpen = menu.classList.contains("open");
    if (!menuOpen) {
      if (y > lastY + 6 && y > 120) nav.classList.add("hide");
      else if (y < lastY - 6 || y <= 120) nav.classList.remove("hide");
    }
    lastY = y;
    // subtle parallax: desktop, fine pointer, motion allowed, only near the hero
    if (fineMQ.matches && !reduceMQ.matches && y < innerHeight * 1.2) {
      parallaxEls.forEach((el) => { el.style.translate = "0 " + (y * parseFloat(el.dataset.parallax) * -1).toFixed(1) + "px"; });
    }
    // horizontal project track driven by vertical scroll
    if (pinned) {
      const r = wrap.getBoundingClientRect();
      const range = wrap.offsetHeight - innerHeight;
      const p = clamp(-r.top / range, 0, 1);
      track.style.transform = "translate3d(" + (-p * (track.scrollWidth - innerWidth)).toFixed(1) + "px,0,0)";
    }
    // process progress line
    if (stepsWrap && railBar) {
      const r = stepsWrap.getBoundingClientRect();
      railBar.style.setProperty("--p", clamp((innerHeight * 0.65 - r.top) / r.height, 0, 1).toFixed(3));
      railBar.style.transform = "scaleY(" + clamp((innerHeight * 0.65 - r.top) / r.height, 0, 1).toFixed(3) + ")";
    }
  }
  const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  addEventListener("scroll", requestTick, { passive: true });

  /* ---------- Desktop pinned horizontal projects ---------- */
  function setupPin() {
    const on = deskMQ.matches && !reduceMQ.matches;
    if (on) {
      pinned = true;
      const dist = Math.max(0, track.scrollWidth - innerWidth);
      wrap.style.setProperty("--hh", innerHeight + dist + "px");
    } else {
      pinned = false;
      wrap.style.removeProperty("--hh");
      track.style.transform = "";
    }
    onScroll();
  }
  setupPin();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(setupPin, 150); });
  deskMQ.addEventListener("change", setupPin);
  reduceMQ.addEventListener("change", setupPin);
  document.fonts && document.fonts.ready.then(setupPin);

  // keep keyboard focus visible while the track is pinned
  track.addEventListener("focusin", (e) => {
    if (!pinned) return;
    const card = e.target.closest(".pj");
    if (!card) return;
    const dist = track.scrollWidth - innerWidth;
    const target = clamp(card.offsetLeft - (innerWidth - card.offsetWidth) / 2, 0, dist);
    const top = wrap.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (target / dist) * (wrap.offsetHeight - innerHeight), behavior: reduceMQ.matches ? "auto" : "smooth" });
  });

  /* ---------- Mobile carousel dots ---------- */
  const dotsBox = $("#pj-dots"), cards = $$(".pj", track);
  cards.forEach(() => dotsBox.appendChild(document.createElement("i")));
  const dots = $$("i", dotsBox);
  function updateDots() {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bd = Infinity;
    cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
    dots.forEach((d, i) => d.classList.toggle("on", i === best));
  }
  let dt; track.addEventListener("scroll", () => { clearTimeout(dt); dt = setTimeout(updateDots, 40); }, { passive: true });
  updateDots();

  /* ---------- Services accordion ---------- */
  $$(".svc-btn").forEach((b) => b.addEventListener("click", () => {
    const open = b.getAttribute("aria-expanded") === "true";
    $$(".svc-btn").forEach((o) => o.setAttribute("aria-expanded", "false"));
    b.setAttribute("aria-expanded", String(!open));
  }));

  /* ---------- Counters ---------- */
  const counters = $$("[data-count]");
  function runCounter(el) {
    const end = +el.dataset.count, suf = el.dataset.suffix || "";
    if (reduceMQ.matches) { el.textContent = end + suf; return; }
    const t0 = performance.now(), dur = 1200;
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
    }), { threshold: 0.6 });
    counters.forEach((c) => { if (!reduceMQ.matches) c.textContent = "0" + (c.dataset.suffix || ""); co.observe(c); });
  }

  /* ---------- Magnetic buttons (desktop, subtle) ---------- */
  $$("[data-magnetic]").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      if (!fineMQ.matches || reduceMQ.matches || e.pointerType !== "mouse") return;
      const r = b.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 8;
      b.style.transform = "translate(" + clamp(x, -6, 6).toFixed(1) + "px," + clamp(y, -4, 4).toFixed(1) + "px)";
    });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });

  /* ---------- Demo modal ---------- */
  const dlg = $("#demo"), dBody = $("#demo-body"), dTitle = $("#demo-title");
  let opener = null;

  const demos = {
    dashboard: { title: "Pulse Analytics", render: demoDashboard },
    booking: { title: "Slotly Booking", render: demoBooking },
    store: { title: "Form & Fabric Store", render: demoStore }
  };

  $$("[data-demo]").forEach((b) => b.addEventListener("click", () => {
    const d = demos[b.dataset.demo]; if (!d) return;
    opener = b; dTitle.textContent = d.title;
    const host = document.createElement("div"); // fresh node per open, so listeners never stack up
    dBody.textContent = ""; dBody.appendChild(host); d.render(host);
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    html.style.overflow = "hidden";
  }));
  const closeDlg = () => { if (dlg.open) (dlg.close ? dlg.close() : dlg.removeAttribute("open")); };
  $("#demo-close").addEventListener("click", closeDlg);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDlg(); });
  dlg.addEventListener("close", () => { html.style.overflow = ""; dBody.innerHTML = ""; if (opener) opener.focus(); });

  /* Demo 1: dashboard */
  function demoDashboard(root) {
    const data = {
      7: [42, 58, 51, 74, 69, 88, 80],
      30: [40, 46, 52, 49, 61, 66, 58, 72, 78, 85],
      90: [30, 34, 38, 41, 47, 52, 55, 61, 66, 70, 79, 90]
    };
    root.innerHTML =
      '<div class="demo-row" role="group" aria-label="Time range">' +
      [7, 30, 90].map((n) => '<button class="chip" data-r="' + n + '" aria-pressed="false">Last ' + n + " days</button>").join("") +
      '</div><div class="kpis"><div><b id="k1"></b><span>Total visits (k)</span></div><div><b id="k2"></b><span>Average</span></div><div><b id="k3"></b><span>Peak</span></div></div>' +
      '<div class="bars" id="bars" role="img" aria-label="Bar chart of demo visits"></div>';
    const bars = $("#bars", root);
    function draw(r) {
      $$(".chip", root).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.r === String(r))));
      const v = data[r], max = Math.max(...v), sum = v.reduce((a, b) => a + b, 0);
      $("#k1", root).textContent = sum; $("#k2", root).textContent = (sum / v.length).toFixed(1); $("#k3", root).textContent = max;
      bars.innerHTML = v.map((n) => '<i style="height:100%;transform:scaleY(0)" data-s="' + (n / max).toFixed(2) + '"></i>').join("");
      requestAnimationFrame(() => requestAnimationFrame(() => $$("i", bars).forEach((i) => { i.style.transform = "scaleY(" + i.dataset.s + ")"; })));
      bars.setAttribute("aria-label", "Bar chart, " + v.length + " data points, demo data");
    }
    root.addEventListener("click", (e) => { const c = e.target.closest("[data-r]"); if (c) draw(c.dataset.r); });
    draw(7);
  }

  /* Demo 2: booking flow (built with DOM methods and textContent, no HTML strings) */
  function demoBooking(root) {
    const services = ["Strategy call (30 min)", "Design review (45 min)", "Project kickoff (60 min)"];
    const times = ["09:00", "10:30", "13:00", "15:30"];
    const st = { step: 1, svc: "", time: "", name: "", err: "" };
    const make = (tag, props, text) => {
      const n = document.createElement(tag);
      if (props) Object.keys(props).forEach((k) => {
        if (k === "class") n.className = props[k];
        else if (k === "style") n.style.cssText = props[k];
        else n.setAttribute(k, props[k]);
      });
      if (text != null) n.textContent = text;
      return n;
    };
    const btn = (label, attr, cls) => {
      const props = Object.assign({ type: "button" }, attr);
      if (cls) props["class"] = cls;
      return make("button", props, label);
    };
    function render() {
      root.textContent = "";
      if (st.step <= 3) root.appendChild(make("p", { "class": "idx", style: "margin-bottom:16px" }, "Step " + st.step + " of 3"));
      if (st.step === 1) {
        const list = make("div", { "class": "list" });
        services.forEach((s) => {
          const b = make("button", { type: "button", "class": "item", "data-svc": s });
          b.appendChild(make("span", null, s));
          b.appendChild(make("span", null, st.svc === s ? "Selected" : "Choose"));
          list.appendChild(b);
        });
        root.appendChild(list);
      } else if (st.step === 2) {
        const row = make("div", { "class": "demo-row", role: "group", "aria-label": "Available times" });
        times.forEach((t) => row.appendChild(btn(t, { "data-time": t, "aria-pressed": String(st.time === t) }, "chip")));
        root.appendChild(row);
        root.appendChild(btn("Back", { "data-back": "" }, "btn ghost"));
        root.appendChild(document.createTextNode(" "));
        root.appendChild(btn("Continue", { "data-next": "" }, "btn primary"));
      } else if (st.step === 3) {
        const field = make("div", { "class": "field" });
        const inp = make("input", { id: "b-name", type: "text", placeholder: " " });
        inp.value = st.name; // property assignment, never parsed as HTML
        field.appendChild(inp);
        field.appendChild(make("label", { "for": "b-name" }, "Your name"));
        root.appendChild(field);
        root.appendChild(make("p", { "class": "ok", style: "color:#ff8a7a;min-height:1.5em", role: "alert" }, st.err));
        root.appendChild(btn("Back", { "data-back": "" }, "btn ghost"));
        root.appendChild(document.createTextNode(" "));
        root.appendChild(btn("Confirm booking", { "data-confirm": "" }, "btn primary"));
      } else {
        root.appendChild(make("p", { "class": "ok", role: "status" },
          "Demo booking confirmed for " + st.name + ": " + st.svc + " at " + st.time + ". This is a demo. Nothing is saved or sent."));
        root.appendChild(btn("Start over", { "data-reset": "" }, "btn ghost"));
      }
      const f = $("[data-next],[data-confirm],[data-reset],.chip,.item,#b-name", root); // keep keyboard flow sensible
      if (st.step === 3) $("#b-name", root).focus();
      else if (f && st.step !== 1) f.focus();
    }
    root.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest("[data-svc]")) { st.svc = t.closest("[data-svc]").dataset.svc; st.step = 2; render(); }
      else if (t.closest("[data-time]")) { st.time = t.closest("[data-time]").dataset.time; $$("[data-time]", root).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.time === st.time))); }
      else if (t.closest("[data-next]")) { if (st.time) { st.step = 3; render(); } else { $$("[data-time]", root)[0].focus(); } }
      else if (t.closest("[data-back]")) { st.step--; render(); }
      else if (t.closest("[data-confirm]")) {
        st.name = $("#b-name", root).value.trim();
        if (!st.name) { st.err = "Enter your name to confirm."; render(); return; }
        st.err = ""; st.step = 4; render();
      } else if (t.closest("[data-reset]")) { st.step = 1; st.svc = st.time = st.name = st.err = ""; render(); }
    });
    render();
  }

  /* Demo 3: store with cart */
  function demoStore(root) {
    const items = [
      { id: "lamp", name: "Linen desk lamp", price: 64 },
      { id: "mug", name: "Stoneware mug", price: 18 },
      { id: "tote", name: "Canvas tote", price: 27 }
    ];
    const qty = { lamp: 0, mug: 0, tote: 0 };
    let done = false, focusKey = "";
    function render() {
      const total = items.reduce((s, i) => s + i.price * qty[i.id], 0);
      const count = items.reduce((s, i) => s + qty[i.id], 0);
      root.innerHTML =
        '<div class="list">' + items.map((i) =>
          '<div class="item"><span>' + i.name + "<br><small style='color:var(--muted)'>$" + i.price + '</small></span><span class="qty">' +
          '<button data-dec="' + i.id + '" aria-label="Remove one ' + i.name + '">&minus;</button><span aria-live="polite">' + qty[i.id] + '</span>' +
          '<button data-inc="' + i.id + '" aria-label="Add one ' + i.name + '">+</button></span></div>').join("") +
        '</div><div class="sum"><span>Total (' + count + " items)</span><span>$" + total + "</span></div>" +
        '<div style="margin-top:16px"><button class="btn primary" data-pay ' + (count ? "" : "disabled style='opacity:.4'") + '>Checkout (demo)</button></div>' +
        (done ? '<p class="ok" role="status">This is a demo, so no order was placed and no payment was taken.</p>' : "");
      const f = focusKey && $('[' + focusKey + ']', root); if (f) f.focus();
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      done = false;
      if (b.dataset.inc) { qty[b.dataset.inc]++; focusKey = 'data-inc="' + b.dataset.inc + '"'; }
      else if (b.dataset.dec) { qty[b.dataset.dec] = Math.max(0, qty[b.dataset.dec] - 1); focusKey = 'data-dec="' + b.dataset.dec + '"'; }
      else if (b.hasAttribute("data-pay")) { done = true; focusKey = "data-pay"; }
      render();
    });
    render();
  }

  /* ---------- Contact form (mailto fallback) ---------- */
  const form = $("#contact-form"), status = $("#form-status");
  const rules = {
    name: (v) => (v.trim() ? "" : "Enter your name."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address."),
    message: (v) => (v.trim().length >= 10 ? "" : "Tell us a little more (at least 10 characters).")
  };
  const errIds = { name: "e-name", email: "e-email", message: "e-msg" };
  function check(inp) {
    const msg = rules[inp.name](inp.value);
    $("#" + errIds[inp.name]).textContent = msg;
    inp.closest(".field").toggleAttribute("data-bad", !!msg);
    inp.setAttribute("aria-invalid", String(!!msg));
    return !msg;
  }
  const fields = $$("input,textarea", form);
  fields.forEach((i) => i.addEventListener("blur", () => { if (i.value) check(i); }));
  fields.forEach((i) => i.addEventListener("input", () => { if (i.closest(".field").hasAttribute("data-bad")) check(i); }));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.textContent = "";
    const bad = fields.filter((i) => !check(i));
    if (bad.length) { bad[0].focus(); return; }
    if (/YOUR-EMAIL|EXAMPLE\.COM/i.test(CONTACT_EMAIL)) {
      status.textContent = "The site owner has not set a contact email yet. Edit CONTACT_EMAIL at the top of script.js.";
      return;
    }
    const d = Object.fromEntries(fields.map((i) => [i.name, i.value.trim()]));
    const subject = "Project enquiry from " + d.name;
    const body = d.message + "\n\n" + d.name + "\n" + d.email;
    status.textContent = "Your email app should open with a draft. Nothing is sent or stored by this site until you press send in your email app.";
    location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });

  /* ---------- 3D scene: one shared canvas, lit object, scroll-driven scenes, adaptive quality ---------- */
  (function scene3D() {
    const canvas = $("#hero-3d");
    if (!canvas) return;
    try { const t = document.createElement("canvas"); if (!(t.getContext("webgl2") || t.getContext("webgl"))) return; } catch (e) { return; } // no WebGL: SVG shapes remain
    let still = reduceMQ.matches; // reduced motion: one static frame, no loop, no scroll-driven movement

    /* Adaptive quality: 0 = low-end, 1 = mid, 2 = capable. Starts from device hints, then drops if frames are slow. */
    const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
    const score = (mem >= 8 ? 2 : mem >= 4 ? 1 : 0) + (cores >= 8 ? 2 : cores >= 6 ? 1 : 0) + (matchMedia("(pointer: coarse)").matches ? -1 : 1);
    let tier = (navigator.connection && navigator.connection.saveData) ? 0 : score >= 3 ? 2 : score >= 1 ? 1 : 0;
    const CFG = [
      { dpr: 1, shards: 6, parts: 90, fps: 30, detail: 1 },
      { dpr: 1.25, shards: 10, parts: 180, fps: 60, detail: 1 },
      { dpr: 1.75, shards: 16, parts: 320, fps: 60, detail: 2 }
    ];

    /* Scenes. Pose = [posX,posY,posZ, rotX,rotY,rotZ, scale, camX,camY,camZ, spread, ringTilt, canvasOpacity] */
    const SECTIONS = ["#top", "#services", "#projects", "#why", "#process", "#contact", ".foot"].map((q) => $(q));
    const POSES = [
      [2.3, 0, 0,      0.15, 0.0, 0,    1.0,  0, 0, 7,       1.0, 0.0, 1.0],   // hero: lit object, right of headline
      [-3.0, -0.3, -1.5, 0.6, 1.7, 0.3, 1.25, 0.8, 0.3, 7.5, 2.6, 1.2, 0.55],  // services: swings left, shards burst outward
      [3.0, 0.4, 1.0,  -0.3, 3.4, -0.2, 1.5,  -0.6, -0.2, 5.6, 1.3, 0.4, 0.8],  // work: camera dollies in close
      [-2.4, 0, -2,    -0.9, 4.6, 0.7,  0.95, 1.2, 0.4, 7.2, 0.6, 1.5, 0.5],   // why: tight, tilted, camera swings right
      [2.0, -0.8, -3.5, 0.5, 6.0, -0.5, 1.7,  -1.2, 0.2, 8.8, 3.0, 0.9, 0.45], // process: far and wide, large orbit
      [1.6, -1.0, -1.0, 0.2, 7.5, 0.1,  1.35, 0, 0.5, 6.2, 1.7, 0.2, 0.85],    // contact: settles low, calm
      [0, -3.4, -3.5,  0.6, 8.2, 0,     0.8,  0, 0, 8,       1.0, 0.0, 0.3]    // footer: sinks away
    ];
    const menuEl = $("#menu"), dlgEl = $("#demo");
    const covered = () => !!((menuEl && menuEl.classList.contains("open")) || (dlgEl && dlgEl.open)); // full-screen overlays hide the canvas

    async function start() {
      let THREE;
      try { THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"); } catch (e) { return; }
      let R;
      try { R = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: tier === 2, powerPreference: "low-power" }); } catch (e) { return; }
      const cfg = () => CFG[tier];
      const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
      const scene = new THREE.Scene();
      const group = new THREE.Group(); scene.add(group);

      /* lights: key, lime accent, cool rim, soft ambient (no shadows anywhere) */
      scene.add(new THREE.AmbientLight(0x8fa3ad, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(3, 4, 5); scene.add(key);
      const lime = new THREE.PointLight(0xD4FF3A, 30, 0, 2); lime.position.set(-3, -1, 3); scene.add(lime);
      const rim = new THREE.PointLight(0x3ab0c4, 45, 0, 2); rim.position.set(2, 2, -4); scene.add(rim);

      /* main object: faceted lit solid + wire overlay + two rings + orbiting shards */
      const Mat = tier === 0 ? THREE.MeshLambertMaterial : THREE.MeshStandardMaterial;
      const solidMat = new Mat({ color: 0x1b2227, flatShading: true });
      if (tier > 0) { solidMat.metalness = 0.25; solidMat.roughness = 0.4; solidMat.emissive = new THREE.Color(0x1a2200); solidMat.emissiveIntensity = 0.6; }
      const geo = new THREE.IcosahedronGeometry(1.5, cfg().detail);
      group.add(new THREE.Mesh(geo, solidMat));
      const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: 0xD4FF3A, transparent: true, opacity: 0.5 }));
      wire.scale.setScalar(1.012); group.add(wire);
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.012, 6, 128), new THREE.MeshBasicMaterial({ color: 0xD4FF3A, transparent: true, opacity: 0.55 }));
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.008, 6, 128), new THREE.MeshBasicMaterial({ color: 0xF3F1EC, transparent: true, opacity: 0.3 }));
      group.add(ring1, ring2);
      const shardGeo = new THREE.TetrahedronGeometry(0.17);
      const shardMats = [new Mat({ color: 0xD4FF3A, flatShading: true }), new Mat({ color: 0x2a343b, flatShading: true })];
      const shards = [];
      for (let i = 0; i < cfg().shards; i++) {
        const m = new THREE.Mesh(shardGeo, shardMats[i % 2]); group.add(m);
        shards.push({ m: m, r: 1.9 + Math.random() * 1.3, ph: Math.random() * 6.283, sp: 0.15 + Math.random() * 0.25, inc: Math.random() * 3 });
      }

      /* ambient particles: one draw call, drifts with scroll for depth */
      const N = cfg().parts, arr = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const r = 3 + Math.random() * 4, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
        arr[i * 3] = r * Math.sin(ph) * Math.cos(th); arr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.8; arr[i * 3 + 2] = r * Math.cos(ph) - 3;
      }
      const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xF3F1EC, size: 0.045, transparent: true, opacity: 0.5 }));
      scene.add(pts);

      /* state */
      let W = 0, H = 0, wide = true, poses = POSES, tops = [], cur = POSES[0].slice();
      let mx = 0, my = 0, tx = 0, ty = 0, raf = 0, lastDraw = 0, t0 = 0, fpsCap = cfg().fps, acc = 0, nAcc = 0;
      let alive = true, dead = false, running = false, loopId = 0, losses = 0, restoreTimer = 0;
      const tgt = new Array(13).fill(0);

      function setTier(n) {
        tier = n; fpsCap = cfg().fps;
        R.setPixelRatio(Math.min(devicePixelRatio || 1, cfg().dpr));
        R.setSize(W, H, false);
        shards.forEach((s, i) => { s.m.visible = i < cfg().shards; });
        pg.setDrawRange(0, Math.min(N, cfg().parts));
      }
      function measure() { tops = SECTIONS.map((el) => el ? el.getBoundingClientRect().top + scrollY : 0); }
      function layout(force) {
        if (!alive) return;
        const w = innerWidth, h = innerHeight;
        if (!force && w === W && Math.abs(h - H) < 120) return; // ignore mobile address-bar resizes
        W = w; H = h; wide = w / h > 1;
        cam.aspect = w / h; cam.fov = wide ? 45 : 58; cam.updateProjectionMatrix();
        // phones: object sits nearly centred, smaller, and much dimmer so it never competes with text
        poses = POSES.map((p, i) => { const q = p.slice(); if (!wide) { q[0] *= 0.3; q[6] *= 0.75; q[12] = Math.min(q[12] * 0.7, i === 0 ? 0.5 : 0.3); if (i === 0) q[1] = 1.7; } return q; });
        R.setPixelRatio(Math.min(devicePixelRatio || 1, cfg().dpr)); R.setSize(w, h, false);
        measure(); draw(performance.now(), 0.016, true);
      }

      /* scroll progress -> interpolated target pose (holds each pose, then moves to the next) */
      function target(out) {
        let i = 0; const y = scrollY + H * 0.45;
        while (i < tops.length - 2 && y >= tops[i + 1]) i++;
        const span = Math.max(1, tops[i + 1] - tops[i]);
        let t = clamp((y - tops[i]) / span, 0, 1);
        t = clamp((t - 0.25) / 0.6, 0, 1); t = t * t * (3 - 2 * t);
        for (let k = 0; k < 13; k++) out[k] = poses[i][k] + (poses[i + 1][k] - poses[i][k]) * t;
      }
      function frame(now, dt, snap) {
        const el = still ? 1 : clamp((now - t0) / 2400, 0, 1), e = 1 - Math.pow(1 - el, 3); // cinematic entrance
        if (still) { for (let k = 0; k < 13; k++) cur[k] = poses[0][k]; }
        else { target(tgt); const f = snap ? 1 : 1 - Math.exp(-dt * 4); for (let k = 0; k < 13; k++) cur[k] += (tgt[k] - cur[k]) * f; }
        const s = still ? 0 : now / 1000;
        mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
        group.position.set(cur[0], cur[1], cur[2]);
        group.rotation.set(cur[3] + s * 0.07 + my * 0.3, cur[4] + s * 0.12 + mx * 0.45 + (still ? 0 : scrollY * 0.0012) + (1 - e) * 2.5, cur[5]);
        group.scale.setScalar(cur[6] * (0.3 + 0.7 * e));
        cam.position.set(cur[7] + mx * 0.35, cur[8] - my * 0.2, cur[9] + (1 - e) * 5); cam.lookAt(0, 0, 0);
        const sp = cur[10];
        ring1.rotation.set(cur[11] + 0.2, s * 0.2, 0); ring1.scale.setScalar(0.7 + 0.3 * sp);
        ring2.rotation.set(cur[11] * 0.5 + 1.0, 0, s * 0.15); ring2.scale.setScalar(0.7 + 0.3 * sp);
        for (let i = 0; i < shards.length; i++) {
          const d = shards[i]; if (!d.m.visible) continue;
          const a = d.ph + s * d.sp, r = d.r * sp;
          d.m.position.set(Math.cos(a) * r, Math.sin(a * 0.7 + d.inc) * r * 0.6, Math.sin(a) * r);
          d.m.rotation.set(a * 2, a * 1.3, 0);
        }
        pts.rotation.y = s * 0.02; pts.position.y = still ? 0 : scrollY * 0.0015;
        canvas.style.opacity = (cur[12] * e).toFixed(3);
        R.render(scene, cam);
      }
      function draw(now, dt, snap) { try { frame(now, dt, snap); } catch (e) { giveUp(); } } // any render error -> SVG fallback

      /* ONE loop at a time: every start gets a new id, and stale callbacks exit immediately */
      function sync() {
        const go = alive && !document.hidden && !still && !covered(); // hidden tab, reduced motion or an open overlay: no loop at all
        if (go && !running) {
          running = true; lastDraw = 0; acc = 0; nAcc = 0;
          const id = ++loopId;
          const step = (now) => {
            if (id !== loopId) return;
            raf = requestAnimationFrame(step);
            if (now - lastDraw < 1000 / fpsCap - 2) return; // frame cap (30 fps on low-end)
            const dt = Math.min(0.05, (now - (lastDraw || now)) / 1000) || 0.016; lastDraw = now;
            draw(now, dt, false);
            if (alive && now - t0 > 3000) { // adaptive quality: step down if the device can't hold ~40 fps
              acc += dt; nAcc++;
              if (nAcc === 100) {
                const avg = acc / nAcc; acc = 0; nAcc = 0;
                if (fpsCap === 60 && avg > 0.026 && tier > 0) setTier(tier - 1);
                else if (tier === 0 && avg > 0.045 && fpsCap > 20) fpsCap = 20;
              }
            }
          };
          raf = requestAnimationFrame(step);
        } else if (!go && running) { running = false; loopId++; cancelAnimationFrame(raf); }
      }
      function giveUp() {
        if (dead) return; dead = true; alive = false; sync(); clearTimeout(restoreTimer);
        html.classList.remove("has3d"); canvas.style.opacity = "0"; canvas.style.display = "none";
        try { R.dispose(); } catch (e) {}
      }

      /* events */
      let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => layout(false), 150); });
      if ("ResizeObserver" in window) new ResizeObserver(measure).observe(document.body); // page height changes (pinned section, fonts)
      document.addEventListener("visibilitychange", sync);
      // Overlays: the mobile menu (class "open") and the demo <dialog> (attribute "open") fully cover the canvas.
      // Watch those changes so the loop is cancelled the moment one opens and resumes (one loop) when it closes.
      if ("MutationObserver" in window) {
        const mo = new MutationObserver(sync);
        if (menuEl) mo.observe(menuEl, { attributes: true, attributeFilter: ["class"] });
        if (dlgEl) mo.observe(dlgEl, { attributes: true, attributeFilter: ["open"] });
      } else setInterval(sync, 400); // very old browsers: sync() is idempotent, so polling is safe
      reduceMQ.addEventListener("change", () => { still = reduceMQ.matches; if (!alive) return; layout(true); sync(); }); // static frame <-> animated
      if (fineMQ.matches) addEventListener("pointermove", (ev) => {
        if (ev.pointerType !== "mouse" || still) return;
        tx = ev.clientX / innerWidth * 2 - 1; ty = ev.clientY / innerHeight * 2 - 1;
      }, { passive: true });
      canvas.addEventListener("webglcontextlost", (ev) => {
        ev.preventDefault(); losses++;
        alive = false; sync();
        html.classList.remove("has3d"); canvas.style.opacity = "0"; // SVG shapes show while the context is gone
        clearTimeout(restoreTimer); restoreTimer = setTimeout(giveUp, 3000); // not restored in 3s: stay on SVG
        if (losses > 3) giveUp(); // repeated losses: stop trying
      });
      canvas.addEventListener("webglcontextrestored", () => {
        if (dead) return;
        clearTimeout(restoreTimer); alive = true;
        layout(true); // three.js re-initialises itself first; we re-render and resume
        if (!alive) return;
        html.classList.add("has3d"); sync();
      });

      t0 = performance.now();
      setTier(tier); layout(true);
      html.classList.add("has3d");
      sync();
    }
    if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 1500 }); else setTimeout(start, 400);
  })();
})();
