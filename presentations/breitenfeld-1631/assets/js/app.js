/* Движок презентации: масштаб 16:9, навигация, кинематографичные переходы (GSAP),
   каскадное появление, счётчики, Эстрелла-гид, шторка «до/после», схемы боя, заметки докладчика. */
(function () {
  "use strict";
  var gsap = window.gsap;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var params = new URLSearchParams(location.search);
  var PRINT = params.has("print");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || params.has("reduce");
  if (PRINT) document.body.classList.add("print-mode");

  var stage = qs("#stage"), slides = qsa(".slide"), N = slides.length;
  var cur = -1, busy = null, ctx = null, scale = 1;

  /* Картинки Эстреллы: берётся первый найденный файл из списка. */
  var GUIDE = {
    wonder: ["assets/img/estrella-wonder.png"],
    cheer: ["assets/img/estrella-cheer.png"]
  };

  /* ---------- масштаб сцены ---------- */
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    scale = Math.min(w / 1920, h / 1080);
    stage.style.transformOrigin = "50% 50%";
    stage.style.transform = "translate(-50%,-50%) scale(" + scale + ")";
    if (window.Diorama) window.Diorama.resize(scale);
  }
  window.addEventListener("resize", fit);
  fit();

  /* ---------- отсутствующие картинки → заглушка ---------- */
  qsa("figure img, .compare img").forEach(function (img) {
    var box = img.closest("figure") || img.closest(".side");
    function bad() { box.classList.add("missing"); }
    if (img.complete && img.naturalWidth === 0) bad();
    img.addEventListener("error", bad);
  });
  if (!window.Diorama || !window.Diorama.ok) qs("#s1").classList.add("no-webgl");

  /* ---------- разбивка заголовка на буквы ---------- */
  (function () {
    var h1 = qs("#s1 h1");
    qsa("span", h1).forEach(function (sp) {
      var words = sp.textContent.split(" ");
      sp.innerHTML = words.map(function (w) {
        return '<span style="display:inline-block;white-space:nowrap">' + w.split("").map(function (ch) { return '<span class="ch">' + ch + "</span>"; }).join("") + "</span>";
      }).join(" ");
    });
  })();

  /* ---------- карта Европы ---------- */
  (function () {
    var E = window.EUROPE, svg = qs("#euroMap"); if (!E || !svg) return;
    var P = E.pts, NS = "http://www.w3.org/2000/svg";
    function el(n, a, parent) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); (parent || svg).appendChild(e); return e; }
    var defs = el("defs", {});
    defs.innerHTML = '<filter id="wc" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>' +
      '<radialGradient id="seaG" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#c9d5cc"/><stop offset="1" stop-color="#9fb2ad"/></radialGradient>' +
      '<clipPath id="mapClip"><rect x="0" y="0" width="1000" height="760" rx="18"/></clipPath>';
    var g = el("g", { "clip-path": "url(#mapClip)" });
    el("rect", { x: 0, y: 0, width: 1000, height: 760, fill: "url(#seaG)" }, g);
    el("path", { d: E.land, "class": "map-land", filter: "url(#wc)" }, g);
    el("rect", { x: 1, y: 1, width: 998, height: 758, rx: 18, fill: "none", stroke: "rgba(110,75,30,.45)", "stroke-width": 3 });
    /* Священная Римская империя: условное пятно */
    el("ellipse", { cx: P.lHRE[0] + 60, cy: P.lHRE[1] - 50, rx: 175, ry: 150, fill: "rgba(126,31,42,.10)", stroke: "rgba(126,31,42,.35)", "stroke-dasharray": "6 8", "stroke-width": 2, "class": "m-hre" }, g);
    function label(t, x, y, cls, anchor) { var e = el("text", { x: x, y: y, "class": cls || "map-label", "text-anchor": anchor || "middle" }, g); e.textContent = t; return e; }
    label("ШВЕЦИЯ", 520, 70, "map-label m-l").setAttribute("style", "font-style:normal;letter-spacing:.2em;font-weight:700;fill:#1f3561");
    label("Балтийское море", P.lBaltic[0] + 10, P.lBaltic[1] + 30, "map-label m-l");
    label("Северное море", P.lNorth[0], P.lNorth[1], "map-label m-l");
    label("Франция", P.lFrance[0], P.lFrance[1], "map-label m-l");
    label("Польша", P.lPoland[0] + 110, P.lPoland[1] + 30, "map-label m-l");
    label("Священная Римская", P.lHRE[0] - 20, P.lHRE[1] + 40, "map-label m-l");
    label("империя", P.lHRE[0] - 20, P.lHRE[1] + 70, "map-label m-l");
    /* маршрут Густава Адольфа: Стокгольм → Померания (1630) → Лейпциг (1631) */
    var s = P.stockholm, pe = P.peene, l = P.leipzig;
    var d = "M" + s[0] + "," + s[1] + " C" + (s[0] - 10) + "," + (s[1] + 90) + " " + (pe[0] + 40) + "," + (pe[1] - 70) + " " + pe[0] + "," + pe[1] + " S" + (l[0] + 30) + "," + (l[1] - 40) + " " + l[0] + "," + (l[1] - 6);
    var route = el("path", { d: d, "class": "route m-route" }, g);
    el("circle", { cx: s[0], cy: s[1], r: 9, fill: "#1f3561", stroke: "#fff6e3", "stroke-width": 3, "class": "m-l" }, g);
    label("Стокгольм", s[0] + 16, s[1] + 8, "map-city m-l", "start");
    el("circle", { cx: pe[0], cy: pe[1], r: 7, fill: "#1f3561", stroke: "#fff6e3", "stroke-width": 3, "class": "m-l" }, g);
    label("высадка, 1630", pe[0] + 14, pe[1] - 8, "map-city m-l", "start").setAttribute("style", "font-size:21px;fill:#1f3561");
    /* пин Лейпцига */
    var pin = el("g", { "class": "m-pin", transform: "translate(" + l[0] + "," + l[1] + ")" }, g);
    el("circle", { r: 14, "class": "pin-ring m-ring", "transform-origin": "0 0" }, pin);
    el("circle", { r: 14, "class": "pin-ring m-ring2", "transform-origin": "0 0" }, pin);
    el("path", { d: "M0,0 C-16,-22 -22,-34 -22,-46 A22,22 0 1 1 22,-46 C22,-34 16,-22 0,0Z", fill: "#7e1f2a", stroke: "#fff6e3", "stroke-width": 3, "class": "m-drop" }, pin);
    el("circle", { cx: 0, cy: -46, r: 8, fill: "#fff6e3" }, pin);
    var lt = el("text", { x: 34, y: -40, "class": "map-city m-l", "text-anchor": "start" }, pin); lt.textContent = "Лейпциг";
    lt.setAttribute("style", "font-size:30px;fill:#7e1f2a");
    var lt2 = el("text", { x: 34, y: -12, "class": "map-label m-l", "text-anchor": "start" }, pin); lt2.textContent = "Брейтенфельд";
    lt2.setAttribute("style", "font-size:24px");
  })();

  /* ---------- шторка «до/после» ---------- */
  (function () {
    var box = qs("#compare"); if (!box) return;
    var dragging = false;
    function setCut(p) { p = Math.max(3, Math.min(97, p)); box.style.setProperty("--cut", p + "%"); box.setAttribute("aria-valuenow", Math.round(p)); }
    function fromEvent(e) { var r = box.getBoundingClientRect(); setCut((e.clientX - r.left) / r.width * 100); }
    box.addEventListener("pointerdown", function (e) { dragging = true; box.setPointerCapture(e.pointerId); gsap.killTweensOf(box); fromEvent(e); e.stopPropagation(); });
    box.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    box.addEventListener("pointerup", function () { dragging = false; });
    box.addEventListener("click", function (e) { e.stopPropagation(); });
    box.addEventListener("keydown", function (e) {
      var v = parseFloat(box.style.getPropertyValue("--cut")) || 50;
      if (e.key === "ArrowLeft") { setCut(v - 5); e.preventDefault(); e.stopPropagation(); }
      if (e.key === "ArrowRight") { setCut(v + 5); e.preventDefault(); e.stopPropagation(); }
    });
    box._setCut = setCut;
  })();

  /* ---------- викторина ---------- */
  qsa(".q").forEach(function (q) {
    function toggle(e) {
      if (e) e.stopPropagation();
      var a = qs(".qa", q), open = !q.classList.contains("open");
      q.classList.toggle("open", open); q.setAttribute("aria-expanded", open);
      if (reduce) { a.style.height = open ? "auto" : "0"; return; }
      if (open) {
        gsap.fromTo(a, { height: 0 }, { height: "auto", duration: 0.6, ease: "power3.out" });
        gsap.fromTo(qs("p", a), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.12, ease: "power3.out" });
        gsap.fromTo(q, { backgroundColor: "rgba(226,187,92,.45)" }, { backgroundColor: "rgba(255,252,242,.92)", duration: 1.1, ease: "power2.out", clearProps: "backgroundColor" });
      } else gsap.to(a, { height: 0, duration: 0.4, ease: "power2.inOut" });
    }
    q.addEventListener("click", toggle);
    q.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(e); } });
  });

  /* ---------- схемы боя ---------- */
  var NS = "http://www.w3.org/2000/svg";
  function sv(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function boardBase(svg) {
    var defs = sv("defs", {}, svg);
    defs.innerHTML = '<pattern id="hatch-' + svg.id + '" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(120,80,30,.25)" stroke-width="3"/></pattern>';
    sv("rect", { x: 0, y: 0, width: 1120, height: 820, fill: "#e8d5a6" }, svg);
    for (var i = 0; i < 22; i++) sv("circle", { cx: (i * 173) % 1120, cy: (i * 97) % 820, r: 60 + (i % 5) * 26, fill: "rgba(170,140,70," + (0.05 + (i % 3) * 0.03) + ")" }, svg);
    sv("path", { d: "M0,470 C250,450 420,500 620,470 S960,430 1120,460", stroke: "rgba(160,120,60,.35)", "stroke-width": 18, fill: "none", "stroke-linecap": "round" }, svg);
    sv("ellipse", { cx: 560, cy: 138, rx: 210, ry: 70, fill: "url(#hatch-" + svg.id + ")", stroke: "rgba(120,80,30,.35)", "stroke-width": 2 }, svg);
    var t = sv("text", { x: 560, y: 66, "text-anchor": "middle", style: "font:italic 600 26px Cormorant,serif;fill:#5a4835" }, svg); t.textContent = "холм с пушками Тилли";
    var b = sv("text", { x: 40, y: 54, style: "font:600 24px Cormorant,serif;fill:#5a4835" }, svg); b.textContent = "Брейтенфельд";
    sv("rect", { x: 40, y: 66, width: 16, height: 12, fill: "#a4482e" }, svg); sv("rect", { x: 62, y: 70, width: 12, height: 10, fill: "#a4482e" }, svg);
    var n = sv("g", { transform: "translate(1060,760)" }, svg);
    sv("path", { d: "M0,-34 L10,0 L0,-6 L-10,0Z", fill: "#5a4835", transform: "rotate(180)" }, n);
    var nt = sv("text", { x: 0, y: 46, "text-anchor": "middle", style: "font:700 20px Manrope,sans-serif;fill:#5a4835" }, n); nt.textContent = "С";
  }
  function unit(svg, cls, x, y, w, h, label, name) {
    var g = sv("g", { "class": "unit " + cls + (name ? " u-" + name : "") }, svg);
    sv("rect", { x: x, y: y, width: w, height: h, rx: 4 }, g);
    if (cls === "r" && w === h) { // терция: «лес пик»
      for (var i = 1; i < 4; i++) sv("line", { x1: x + i * w / 4, y1: y + 8, x2: x + i * w / 4, y2: y + h - 8, stroke: "rgba(255,240,220,.55)", "stroke-width": 2 }, g);
      sv("rect", { x: x + w * 0.22, y: y + h * 0.22, width: w * 0.56, height: h * 0.56, fill: "rgba(240,230,212,.35)", stroke: "none" }, g);
    }
    if (label) { var t = sv("text", { x: x + w / 2, y: y + h / 2 + 7 }, g); t.textContent = label; }
    return g;
  }
  function arrow(svg, d, cls, name) {
    var g = sv("g", { "class": "arr " + (name ? "a-" + name : "") }, svg);
    var p = sv("path", { d: d, "class": "arrow " + cls }, g);
    var len = p.getTotalLength(), e = p.getPointAtLength(len), e0 = p.getPointAtLength(len - 2);
    var ang = Math.atan2(e.y - e0.y, e.x - e0.x) * 180 / Math.PI;
    var col = { r: "#b3342f", b: "#1f3561", y: "#c58f18", s: "#6f95c6" }[cls];
    var head = sv("path", { d: "M10,0 L-22,-20 L-14,0 L-22,20Z", fill: col, transform: "translate(" + e.x + "," + e.y + ") rotate(" + ang + ")" }, g);
    p.style.strokeDasharray = len; p.style.strokeDashoffset = len; head.style.opacity = 0;
    return { g: g, p: p, head: head, len: len };
  }
  function puffs(svg, pts, name) {
    var g = sv("g", { "class": "smk " + name, opacity: 0 }, svg);
    pts.forEach(function (p) { for (var i = 0; i < 3; i++) sv("circle", { cx: p[0] + (i - 1) * 14, cy: p[1] - i * 6, r: 16 + i * 5, fill: "rgba(250,246,238,.85)" }, g); });
    return g;
  }
  function drawArrow(tl, a, at, dur) {
    tl.to(a.p, { strokeDashoffset: 0, duration: dur || 1.1, ease: "power2.inOut" }, at);
    tl.to(a.head, { opacity: 1, duration: 0.25 }, (typeof at === "number" ? at : 0) + (dur || 1.1) - 0.2);
  }
  function stepper(listId) {
    var items = qsa("#" + listId + " li");
    return function (n) { items.forEach(function (li, i) { li.classList.toggle("on", i <= n && n >= 0); li.style.opacity = ""; }); };
  }
  function buildBoard(svg) {
    boardBase(svg);
    var U = {};
    U.guns = sv("g", { "class": "u-guns" }, svg);
    [440, 500, 560, 620, 680].forEach(function (x) {
      var gg = sv("g", { "class": "gun" }, U.guns);
      sv("rect", { x: x - 16, y: 128, width: 32, height: 16, rx: 3, fill: "#5f1512" }, gg);
      sv("circle", { cx: x - 8, cy: 148, r: 6, fill: "#3b2c22" }, gg); sv("circle", { cx: x + 8, cy: 148, r: 6, fill: "#3b2c22" }, gg);
    });
    U.terc = sv("g", { "class": "u-terc" }, svg);
    [[330, 210], [450, 210], [570, 210], [690, 210], [390, 318], [630, 318]].forEach(function (p, i) { unit(U.terc, "r", p[0], p[1], 88, 88, i === 1 ? "" : ""); });
    var tl1 = sv("text", { x: 560, y: 432, "text-anchor": "middle", style: "font:700 22px Manrope,sans-serif;fill:#7e1f2a" }, U.terc); tl1.textContent = "терции Тилли";
    U.furst = sv("g", {}, svg); unit(U.furst, "r", 110, 220, 140, 40, "конница"); unit(U.furst, "r", 130, 278, 140, 40, "");
    U.papp = sv("g", {}, svg); unit(U.papp, "r", 870, 220, 160, 40, "Паппенгейм"); unit(U.papp, "r", 890, 278, 140, 40, "");
    U.sax = sv("g", {}, svg);
    [110, 176, 242, 308, 374].forEach(function (x) { unit(U.sax, "s", x, 600, 56, 30, ""); });
    unit(U.sax, "s", 60, 650, 100, 30, ""); unit(U.sax, "s", 230, 650, 100, 30, "");
    var st = sv("text", { x: 250, y: 728, "text-anchor": "middle", style: "font:700 22px Manrope,sans-serif;fill:#3e6a9e" }, U.sax); st.textContent = "саксонцы";
    U.horn = sv("g", {}, svg); unit(U.horn, "b", 462, 586, 66, 30, "Горн"); unit(U.horn, "b", 462, 636, 66, 30, "");
    U.front = sv("g", {}, svg);
    [560, 646, 732, 818].forEach(function (x) { unit(U.front, "b", x, 588, 74, 28, ""); });
    U.second = sv("g", {}, svg);
    [600, 690, 780].forEach(function (x) { unit(U.second, "b", x, 664, 74, 28, ""); });
    var swt = sv("text", { x: 790, y: 740, "text-anchor": "middle", style: "font:700 22px Manrope,sans-serif;fill:#1f3561" }, U.front); swt.textContent = "шведы";
    U.swguns = sv("g", {}, svg);
    [638, 724, 810].forEach(function (x) { sv("rect", { x: x - 9, y: 624, width: 18, height: 10, rx: 2, fill: "#1f3561" }, U.swguns); });
    U.king = sv("g", {}, svg); unit(U.king, "b", 920, 582, 84, 30, "король"); unit(U.king, "b", 1012, 582, 84, 30, ""); unit(U.king, "b", 960, 638, 84, 30, "");
    return U;
  }
  var B1 = buildBoard(qs("#board1")), B2 = buildBoard(qs("#board2"));
  var A1 = {
    pap1: arrow(qs("#board1"), "M960,330 C980,420 1000,480 1010,560", "r"),
    pap2: arrow(qs("#board1"), "M1040,570 C1060,470 1040,400 1010,340", "b"),
    fur: arrow(qs("#board1"), "M190,330 C200,420 220,500 240,580", "r"),
    ter: arrow(qs("#board1"), "M450,420 C420,480 380,530 330,585", "r"),
    flee: arrow(qs("#board1"), "M120,730 C90,762 60,784 22,800", "s")
  };
  var A2 = {
    ter: arrow(qs("#board2"), "M380,520 C430,560 460,600 450,650", "r"),
    horn: arrow(qs("#board2"), "M500,530 C470,520 440,515 410,515", "b"),
    king: arrow(qs("#board2"), "M1000,570 C1010,380 900,190 720,150", "y"),
    fire1: arrow(qs("#board2"), "M520,160 C470,250 420,300 380,360", "b"),
    fire2: arrow(qs("#board2"), "M600,160 C580,260 560,320 520,380", "b")
  };
  var pf1 = puffs(qs("#board1"), [[460, 120], [560, 120], [660, 120], [640, 612], [728, 612]], "p1");
  var pf2 = puffs(qs("#board2"), [[470, 120], [560, 120], [650, 120]], "p2");
  var lbl = function (svg, x, y, t, col) { var e = sv("text", { x: x, y: y, "text-anchor": "middle", opacity: 0, style: "font:700 italic 34px Cormorant,serif;fill:" + col }, svg); e.textContent = t; return e; };
  var x7 = lbl(qs("#board1"), 930, 470, "×7", "#7e1f2a");
  var fleeL = lbl(qs("#board1"), 360, 800, "бегство!", "#3e6a9e");
  var frontL = lbl(qs("#board2"), 470, 800, "новый фронт", "#1f3561");
  var retL = lbl(qs("#board2"), 330, 222, "Тилли отступает", "#7e1f2a");

  function battle1(tl, instant) {
    var set = stepper("steps1"); set(-1);
    var U = B1;
    tl.from([U.terc, U.furst, U.papp, U.guns], { opacity: 0, y: -30, duration: 0.7, stagger: 0.1, ease: "power3.out" }, 0.3);
    tl.from([U.sax, U.horn, U.front, U.second, U.swguns, U.king], { opacity: 0, y: 30, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 0.5);
    tl.call(set, [0], 1.4);
    tl.to(pf1, { opacity: 1, duration: 0.3, repeat: 3, yoyo: true }, 1.5);
    tl.call(set, [1], 3.4);
    tl.to(U.papp, { x: 40, y: 200, duration: 0.9, ease: "power2.in" }, 3.5);
    drawArrow(tl, A1.pap1, 3.5, 0.9);
    tl.to(U.papp, { x: 0, y: 0, duration: 0.9, ease: "power2.out" }, 4.5);
    drawArrow(tl, A1.pap2, 4.5, 0.8);
    tl.to(x7, { opacity: 1, scale: 1.0, duration: 0.4, transformOrigin: "50% 50%" }, 5.1);
    tl.call(set, [2], 6.0);
    drawArrow(tl, A1.fur, 6.1, 1.0);
    tl.to(U.furst, { y: 240, x: 30, duration: 1.4, ease: "power2.inOut" }, 6.2);
    drawArrow(tl, A1.ter, 6.6, 1.0);
    tl.to(U.terc, { x: -110, y: 120, duration: 2.0, ease: "power1.inOut" }, 6.7);
    tl.call(set, [3], 8.6);
    tl.to(U.sax, { x: -30, y: 30, duration: 1.4, ease: "power2.in" }, 8.7);
    drawArrow(tl, A1.flee, 8.9, 1.0);
    tl.to(fleeL, { opacity: 1, duration: 0.4 }, 9.3);
    tl.to(U.furst, { x: -60, y: 250, duration: 1.6, ease: "power2.inOut" }, 8.9);
  }
  function battle2(tl) {
    var set = stepper("steps2"); set(-1);
    var U = B2;
    gsap.set(U.terc, { x: -110, y: 120 }); gsap.set(qs("text", U.terc), { opacity: 0 }); gsap.set(U.sax, { opacity: 0 }); gsap.set(U.furst, { x: -60, y: 250, opacity: 0.35 }); gsap.set(U.papp, { opacity: 0.55 });
    tl.from(qs("#board2").children, { opacity: 0, duration: 0.6, stagger: 0.01 }, 0.2);
    tl.call(set, [0], 1.0);
    drawArrow(tl, A2.ter, 1.1, 1.0);
    tl.to(U.terc, { x: -70, y: 170, duration: 1.4, ease: "power1.inOut" }, 1.1);
    tl.call(set, [1], 2.8);
    tl.to(U.horn, { x: -50, y: -150, duration: 1.2, ease: "power2.inOut" }, 2.9);
    tl.to(qsa(".unit", U.second), { rotation: 90, transformOrigin: "50% 50%", x: function (i) { return -150 - i * 90; }, y: function (i) { return -150 + i * 60; }, duration: 1.4, ease: "power2.inOut", stagger: 0.08 }, 3.0);
    drawArrow(tl, A2.horn, 4.2, 0.7);
    tl.to(frontL, { opacity: 1, duration: 0.4 }, 4.6);
    tl.call(set, [2], 5.4);
    drawArrow(tl, A2.king, 5.5, 1.5);
    tl.to(U.king, { x: -250, y: -420, duration: 1.8, ease: "power2.inOut" }, 5.6);
    tl.call(set, [3], 7.6);
    tl.to(qsa(".gun rect", U.guns), { attr: { fill: "#1f3561" }, duration: 0.4, stagger: 0.08 }, 7.6);
    tl.to(pf2, { opacity: 1, duration: 0.25, repeat: 3, yoyo: true }, 8.0);
    drawArrow(tl, A2.fire1, 8.0, 0.9); drawArrow(tl, A2.fire2, 8.15, 0.9);
    tl.to(U.terc, { x: -170, y: 40, opacity: 0.3, duration: 1.8, ease: "power2.in" }, 9.0);
    tl.to(retL, { opacity: 1, duration: 0.5 }, 9.6);
  }
  function resetArrows(A) { for (var k in A) { A[k].p.style.strokeDashoffset = A[k].len; A[k].head.style.opacity = 0; } }

  /* ---------- конфетти из золотых листьев ---------- */
  var confetti = (function () {
    var cv = qs("#confetti"), g = cv.getContext("2d"), parts = [], raf = 0, on = false;
    cv.width = 1920; cv.height = 1080;
    var cols = ["#e2bb5c", "#c9952f", "#f0cf72", "#b3342f", "#d9782d", "#efd9a0"];
    function leaf(p) {
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.cos(p.f));
      g.fillStyle = p.c; g.beginPath(); g.moveTo(0, -p.s); g.quadraticCurveTo(p.s * 0.9, 0, 0, p.s); g.quadraticCurveTo(-p.s * 0.9, 0, 0, -p.s); g.fill();
      g.strokeStyle = "rgba(90,50,10,.35)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -p.s); g.lineTo(0, p.s); g.stroke(); g.restore();
    }
    function spawn(n, burst) {
      for (var i = 0; i < n; i++) parts.push({ x: burst ? 960 + (Math.random() - 0.5) * 300 : Math.random() * 1920, y: burst ? 560 : -40 - Math.random() * 600,
        vx: burst ? (Math.random() - 0.5) * 22 : (Math.random() - 0.5) * 2, vy: burst ? -10 - Math.random() * 14 : 1 + Math.random() * 2,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.12, f: Math.random() * 6, vf: 0.05 + Math.random() * 0.08, s: 9 + Math.random() * 12, c: cols[(Math.random() * cols.length) | 0] });
    }
    function tick() {
      g.clearRect(0, 0, 1920, 1080);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.vy = Math.min(p.vy + 0.22, 3.2); p.vx *= 0.985; p.x += p.vx + Math.sin(p.f) * 0.8; p.y += p.vy; p.r += p.vr; p.f += p.vf;
        if (p.y > 1120) parts.splice(i, 1); else leaf(p);
      }
      if (on && parts.length < 70) spawn(1, false);
      if (parts.length) raf = requestAnimationFrame(tick);
    }
    return {
      start: function () { if (reduce) { parts = []; spawn(40, false); parts.forEach(function (p) { p.y = Math.random() * 1000; }); g.clearRect(0, 0, 1920, 1080); parts.forEach(leaf); return; }
        on = true; spawn(160, true); spawn(40, false); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
      stop: function () { on = false; cancelAnimationFrame(raf); parts = []; g.clearRect(0, 0, 1920, 1080); },
      still: function () { parts = []; spawn(90, false); parts.forEach(function (p) { p.y = Math.random() * 1050; p.x = Math.random() * 1920; }); g.clearRect(0, 0, 1920, 1080); parts.forEach(leaf); }
    };
  })();

  /* ---------- Эстрелла ---------- */
  var guide = qs("#guide"), gimg = qs("#guide img"), bubble = qs("#bubble");
  function loadGuide(kind, cb) {
    var list = GUIDE[kind] || GUIDE.wonder, i = 0;
    function next() {
      if (i >= list.length) { cb(false); return; }
      var src = list[i++], im = new Image();
      im.onload = function () { gimg.src = src; cb(true); };
      im.onerror = next; im.src = src;
    }
    next();
  }
  function placeGuide(pos) {
    var G = { tr: { right: "60px", top: "40px", bottom: "auto", left: "auto" }, br: { right: "60px", bottom: "86px", top: "auto", left: "auto" }, tl: { right: "60px", top: "40px", bottom: "auto", left: "auto" } }[pos] || {};
    for (var k in G) guide.style[k] = G[k];
    var Bp = { tr: { right: "300px", top: "60px", bottom: "auto" }, br: { right: "300px", bottom: "190px", top: "auto" }, tl: { right: "320px", top: "70px", bottom: "auto" } }[pos] || {};
    for (k in Bp) bubble.style[k] = Bp[k];
  }
  function guideIn(tl, slide, instant) {
    var kind = slide.dataset.guide, say = slide.dataset.say || "";
    gsap.set([guide, bubble], { opacity: 0 });
    bubble.innerHTML = "";
    if (!kind || kind === "none") return;
    placeGuide(slide.dataset.pos || "br");
    loadGuide(kind, function () {});
    if (instant || reduce) {
      tl.set(guide, { opacity: 1, y: 0, scale: 1 }, instant ? 0 : 1.0);
      tl.set(bubble, { opacity: 1 }, instant ? 0 : 1.2);
      tl.call(function () { bubble.textContent = say; }, null, instant ? 0 : 1.2);
      return;
    }
    tl.fromTo(guide, { opacity: 0, y: 120, scaleY: 0.8, scaleX: 1.1, transformOrigin: "50% 100%" }, { opacity: 1, y: -28, scaleY: 1.06, scaleX: 0.96, duration: 0.45, ease: "power2.out" }, 1.2)
      .to(guide, { y: 0, scaleY: 0.94, scaleX: 1.05, duration: 0.22, ease: "power2.in" })
      .to(guide, { scaleY: 1, scaleX: 1, duration: 0.5, ease: "elastic.out(1,0.45)" });
    tl.fromTo(bubble, { opacity: 0, y: 14, scale: 0.92, transformOrigin: "90% 100%" }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" }, 1.9);
    var o = { n: 0 };
    tl.to(o, { n: say.length, duration: Math.min(2.4, say.length * 0.045), ease: "none", onUpdate: function () { bubble.innerHTML = say.slice(0, Math.round(o.n)) + '<span class="caret"></span>'; },
      onComplete: function () { bubble.textContent = say; } }, 2.2);
    tl.to(guide, { y: -6, duration: 1.8, ease: "sine.inOut", repeat: -1, yoyo: true }, 3.2);
  }

  /* ---------- счётчики ---------- */
  function fmt(v, plain) { v = Math.round(v); return plain ? String(v) : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function counters(tl, slide, at) {
    qsa(".count", slide).forEach(function (el, i) {
      var to = parseFloat(el.dataset.to), from = el.dataset.from ? parseFloat(el.dataset.from) : 0, plain = !!el.dataset.plain, o = { v: from };
      el.textContent = fmt(from, plain);
      tl.to(o, { v: to, duration: to > 100 ? 2.0 : 1.2, ease: "power3.out", onUpdate: function () { el.textContent = fmt(o.v, plain); } }, at + i * 0.15);
    });
  }

  /* ---------- построение анимации слайда ---------- */
  function build(slide, instant) {
    var tl = gsap.timeline({ paused: true });
    var id = slide.id, r = reduce;
    var Y = r ? 0 : 36;
    var kb = qsa(".a-kb img, .a-img img", slide);

    if (id === "s1") {
      var chars = qsa(".ch", slide);
      tl.from(qs(".a-kicker", slide), { opacity: 0, y: r ? 0 : 20, duration: 0.8, ease: "power3.out" }, 1.0);
      tl.from(chars, { opacity: 0, y: r ? 0 : 60, duration: r ? 0.6 : 1.0, ease: "power4.out", stagger: r ? 0 : 0.035 }, 1.3);
      tl.from(qs(".a-sub", slide), { opacity: 0, y: r ? 0 : 24, duration: 1.0, ease: "power3.out" }, r ? 1.6 : 2.6);
      tl.from(qs(".a-credits", slide).children, { opacity: 0, y: r ? 0 : 18, duration: 0.8, stagger: 0.18, ease: "power3.out" }, r ? 1.8 : 3.3);
      tl.from(qs(".a-hint", slide), { opacity: 0, duration: 1.0 }, r ? 2 : 4.2);
      return tl;
    }

    var from = function (els, vars, at) { if (els && (els.length === undefined || els.length)) tl.from(els, vars, at); };
    from(qsa(".a-kicker, .a-title", slide), { opacity: 0, y: Y, duration: 0.9, ease: "power3.out", stagger: 0.12 }, 0.15);
    from(qsa(".a-rule", slide), { scaleX: 0, duration: 0.9, ease: "power3.inOut" }, 0.45);
    from(qsa(".a-img", slide), { opacity: 0, y: r ? 0 : 30, scale: r ? 1 : 0.97, duration: 1.1, ease: "power3.out", stagger: 0.15 }, 0.35);
    from(qsa(".a-kb", slide), { opacity: 0, duration: 1.2, ease: "power2.out" }, 0.1);
    from(qsa(".a-in", slide), { opacity: 0, y: r ? 0 : 26, duration: 0.8, ease: "power3.out", stagger: 0.12 }, 0.7);
    from(qsa(".a-li", slide), { opacity: 0, x: r ? 0 : -28, duration: 0.7, ease: "power3.out", stagger: 0.22 }, 1.0);
    from(qsa(".a-card", slide), { opacity: 0, y: r ? 0 : 50, duration: 0.9, ease: "power3.out", stagger: 0.16 }, 0.6);
    from(qsa(".a-vs", slide), { opacity: 0, scale: r ? 1 : 0.4, duration: 0.8, ease: "back.out(2)" }, 1.1);
    from(qsa(".a-call", slide), { opacity: 0, y: r ? 0 : 12, duration: 0.6, ease: "power3.out", stagger: 0.3 }, 1.2);
    counters(tl, slide, 1.0);

    /* Кен Бёрнс: медленный зум и панорама */
    if (!r && !instant) kb.forEach(function (img, i) {
      gsap.fromTo(img, { scale: 1.0, xPercent: 0 }, { scale: 1.07, xPercent: i % 2 ? -1.2 : 1.2, yPercent: -0.8, duration: 22, ease: "none" });
    });

    if (id === "s2") {
      var svg = qs("#euroMap");
      tl.from(qsa(".m-l", svg), { opacity: 0, duration: 0.6, stagger: 0.05 }, 0.8);
      tl.from(qs(".m-hre", svg), { opacity: 0, scale: r ? 1 : 0.9, transformOrigin: "50% 50%", duration: 1.2 }, 0.6);
      var route = qs(".m-route", svg), L = route.getTotalLength();
      tl.fromTo(route, { strokeDasharray: "2 14", strokeDashoffset: 0, opacity: 0 }, { opacity: 1, duration: 0.2 }, 1.2);
      // «рисуем» маршрут через маску из сплошной линии
      var mask = route.cloneNode(); mask.removeAttribute("class"); mask.setAttribute("stroke", "#fff"); mask.setAttribute("stroke-width", 12); mask.setAttribute("fill", "none");
      var m = qs("#routeMask", svg);
      if (!m) { m = document.createElementNS(NS, "mask"); m.id = "routeMask"; m.setAttribute("maskUnits", "userSpaceOnUse"); qs("defs", svg).appendChild(m); m.appendChild(mask); route.setAttribute("mask", "url(#routeMask)"); }
      var mp = m.firstChild; mp.style.strokeDasharray = L; mp.style.strokeDashoffset = L;
      tl.to(mp, { strokeDashoffset: 0, duration: r ? 0.3 : 2.2, ease: "power2.inOut" }, 1.3);
      var drop = qs(".m-drop", svg);
      tl.from(drop, { y: r ? 0 : -80, opacity: 0, duration: 0.7, ease: "bounce.out" }, r ? 1.5 : 3.3);
      if (!r && !instant) {
        tl.fromTo(qs(".m-ring", svg), { scale: 1, opacity: 0.9 }, { scale: 3.4, opacity: 0, duration: 1.8, repeat: -1, ease: "power2.out" }, 3.9);
        tl.fromTo(qs(".m-ring2", svg), { scale: 1, opacity: 0.9 }, { scale: 3.4, opacity: 0, duration: 1.8, repeat: -1, ease: "power2.out" }, 4.8);
      } else gsap.set(qsa(".m-ring, .m-ring2", svg), { opacity: 0 });
      tl.from(qs(".timeline .bar", slide), { scaleX: 0, duration: 1.2, ease: "power3.inOut" }, 1.3);
      tl.from(qs(".timeline .mark", slide), { opacity: 0, y: r ? 0 : -20, duration: 0.6, ease: "back.out(2)" }, 2.3);
    }
    if (id === "s5") {
      var box = qs("#compare");
      box._setCut(50);
      if (!r && !instant) {
        var o = { v: 50 };
        tl.to(o, { v: 18, duration: 1.1, ease: "power2.inOut", onUpdate: function () { box._setCut(o.v); } }, 1.4)
          .to(o, { v: 82, duration: 1.6, ease: "power2.inOut", onUpdate: function () { box._setCut(o.v); } })
          .to(o, { v: 50, duration: 1.1, ease: "power2.inOut", onUpdate: function () { box._setCut(o.v); } });
      }
    }
    if (id === "s8") { resetArrows(A1); gsap.set([x7, fleeL], { opacity: 0 }); battle1(tl, instant); }
    if (id === "s9") { resetArrows(A2); gsap.set([frontL, retL], { opacity: 0 }); battle2(tl); }
    if (id === "s14") if (!PRINT) tl.call(function () { confetti.start(); }, null, instant ? 0 : 0.6);

    guideIn(tl, slide, instant);
    return tl;
  }

  /* ---------- навигация и переходы ---------- */
  var pageno = qs("#pageno"), bar = qs("#progress i"), veil = qs("#veil");
  var tlCur = null;
  function chrome(i) {
    pageno.innerHTML = "<b>" + String(i + 1).padStart(2, "0") + "</b> / " + N;
    gsap.to(bar, { scaleX: (i + 1) / N, duration: reduce ? 0 : 0.9, ease: "power3.inOut" });
    stage.classList.toggle("dark-chrome", !!slides[i].dataset.dark);
    try { history.replaceState(null, "", location.pathname + location.search + "#" + (i + 1)); } catch (e) {}
    notesUpdate(i);
  }
  function leave(slide) {
    if (slide.id === "s1" && window.Diorama) window.Diorama.stop();
    if (slide.id === "s14") confetti.stop();
  }
  function enter(slide) {
    if (slide.id === "s1" && window.Diorama) window.Diorama.start();
  }
  function go(i, opt) {
    opt = opt || {};
    i = Math.max(0, Math.min(N - 1, i));
    if (i === cur && !opt.force) return;
    var prev = cur >= 0 ? slides[cur] : null, next = slides[i], dir = i > cur ? 1 : -1;
    if (busy) { busy.progress(1); busy = null; }
    if (tlCur) { tlCur.kill(); tlCur = null; }
    if (ctx) { var old = ctx; ctx = null; }
    cur = i; chrome(i);

    var instant = !!opt.instant;
    var nctx = gsap.context(function () {}, next);
    var run = function () {
      nctx.add(function () { tlCur = build(next, instant); });
      if (instant) { tlCur.progress(1); } else tlCur.play(0);
    };

    if (!prev || instant || prev === next) {
      if (prev && prev !== next) { prev.classList.remove("is-active"); gsap.set(prev, { autoAlpha: 0 }); leave(prev); }
      if (old) old.revert();
      gsap.set(next, { autoAlpha: 1, scale: 1, y: 0 }); next.classList.add("is-active");
      enter(next); ctx = nctx; run();
      return;
    }
    var d = reduce ? 0.35 : 0.7;
    busy = gsap.timeline({ onComplete: function () { busy = null; } });
    gsap.set(next, { autoAlpha: 0 }); next.classList.add("is-active");
    busy.to([guide, bubble], { opacity: 0, duration: 0.25 }, 0);
    if (reduce) {
      busy.to(prev, { autoAlpha: 0, duration: d }, 0);
    } else {
      busy.to(prev, { autoAlpha: 0, scale: 1.035, y: -16 * dir, duration: d, ease: "power2.in" }, 0);
      busy.to(veil, { opacity: 0.38, duration: d * 0.8, ease: "power1.in" }, 0).to(veil, { opacity: 0, duration: 0.9, ease: "power2.out" });
    }
    busy.call(function () { prev.classList.remove("is-active"); leave(prev); if (old) old.revert(); enter(next); ctx = nctx; run(); }, null, d * 0.9);
    if (reduce) busy.to(next, { autoAlpha: 1, duration: d }, d * 0.9);
    else busy.fromTo(next, { autoAlpha: 0, scale: 0.985, y: 22 * dir }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.0, ease: "power3.out" }, d * 0.9);
  }
  function nextS() { go(cur + 1); }
  function prevS() { go(cur - 1); }

  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " " || k === "Enter") { if (k === "Enter" && e.target.closest && e.target.closest(".q")) return; e.preventDefault(); nextS(); }
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") { e.preventDefault(); prevS(); }
    else if (k === "Home") go(0);
    else if (k === "End") go(N - 1);
    else if (k === "f" || k === "F" || k === "а" || k === "А") toggleFS();
    else if (k === "s" || k === "S" || k === "ы" || k === "Ы") openNotes();
  });
  stage.addEventListener("click", function (e) {
    if (e.target.closest(".q, .compare, a, button")) return;
    nextS();
  });
  stage.addEventListener("contextmenu", function (e) { e.preventDefault(); prevS(); });
  function toggleFS() {
    var d = document;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) { var el = d.documentElement; (el.requestFullscreen || el.webkitRequestFullscreen).call(el); }
    else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  }

  /* лёгкий параллакс картинок от мыши */
  (function () {
    if (reduce) return;
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    function step() {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      var s = slides[cur]; if (s) qsa(".a-img, .a-kb", s).forEach(function (f, i) { var k = 14 + i * 6; f.style.translate = (-x * k).toFixed(2) + "px " + (-y * k).toFixed(2) + "px"; });
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(step); else raf = 0;
    }
  })();

  /* ---------- заметки докладчика ---------- */
  var notesWin = null, panel = qs("#notesPanel");
  function noteHTML(i) {
    var n = qs(".notes", slides[i]), nx = slides[i + 1] ? qs(".notes", slides[i + 1]) : null;
    var t = slides[i].querySelector("h1, h2");
    return { title: (i + 1) + ". " + (t ? t.textContent.replace(/\s+/g, " ").trim() : ""), text: n ? n.textContent.trim() : "", next: nx ? nx.textContent.trim().split(". ")[0] + "…" : "Конец презентации" };
  }
  function notesUpdate(i) {
    var d = noteHTML(i);
    if (panel.classList.contains("on")) qs(".body", panel).innerHTML = "<p style='font-weight:700;margin-bottom:6px'>" + d.title + "</p><p>" + d.text + "</p>";
    if (notesWin && !notesWin.closed) {
      try {
        var D = notesWin.document;
        D.getElementById("t").textContent = d.title; D.getElementById("x").textContent = d.text; D.getElementById("n").textContent = d.next;
        D.getElementById("c").textContent = (i + 1) + " / " + N;
      } catch (e) {}
    }
  }
  function openNotes() {
    if (notesWin && !notesWin.closed) { notesWin.focus(); return; }
    notesWin = window.open("", "notes_breitenfeld", "width=820,height=620");
    if (!notesWin) { panel.classList.toggle("on"); notesUpdate(cur); return; }
    var D = notesWin.document;
    D.open();
    D.write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Заметки докладчика</title><style>' +
      'body{margin:0;background:#1d1711;color:#f4e8cf;font:24px/1.55 system-ui,"Segoe UI",Arial,sans-serif;padding:34px 40px}' +
      'h1{font:600 22px system-ui;letter-spacing:.14em;text-transform:uppercase;color:#e2bb5c;margin:0 0 4px}' +
      '#t{font:700 34px Georgia,serif;margin:6px 0 18px;color:#fff6e3}#x{font-size:30px;line-height:1.55;margin:0 0 24px}' +
      '.row{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,240,210,.18);padding-top:16px;color:#cdbf9f;font-size:20px}' +
      '#timer{font:700 28px ui-monospace,monospace;color:#e2bb5c}button{font:600 18px system-ui;background:#3a2e22;color:#f4e8cf;border:0;border-radius:8px;padding:8px 16px;cursor:pointer;margin-left:8px}' +
      '</style></head><body><h1>Заметки докладчика <span id="c" style="float:right;color:#cdbf9f"></span></h1><div id="t"></div><p id="x"></p>' +
      '<div class="row"><div>Дальше: <span id="n"></span></div><div><span id="timer">00:00</span><button id="p">‹</button><button id="f">›</button></div></div></body></html>');
    D.close();
    var t0 = Date.now();
    var iv = notesWin.setInterval(function () {
      try { var s = Math.floor((Date.now() - t0) / 1000); D.getElementById("timer").textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); } catch (e) { clearInterval(iv); }
    }, 1000);
    D.getElementById("p").onclick = prevS; D.getElementById("f").onclick = nextS;
    D.addEventListener("keydown", function (e) { if (["ArrowRight", " ", "PageDown"].indexOf(e.key) >= 0) { e.preventDefault(); nextS(); } if (["ArrowLeft", "PageUp"].indexOf(e.key) >= 0) { e.preventDefault(); prevS(); } });
    notesUpdate(cur);
  }

  /* ---------- API для PDF и отладки ---------- */
  window.__deck = {
    count: N,
    go: function (i, instant) { go(i, { instant: !!instant, force: true }); },
    finalize: function (i) {
      go(i, { instant: true, force: true });
      var s = slides[i];
      qsa(".a-kb img, .a-img img", s).forEach(function (img) { gsap.set(img, { scale: 1.03 }); });
      if (s.id === "s8") stepper("steps1")(3);
      if (s.id === "s9") stepper("steps2")(3);
      if (s.id === "s13") qsa(".q", s).forEach(function (q) { q.classList.add("open"); qs(".qa", q).style.height = "auto"; });
      if (s.id === "s14") confetti.stop();
      if (s.id === "s1" && window.Diorama) window.Diorama.setTime(30);
      bubble.textContent = s.dataset.say || "";
    }
  };

  var start = parseInt((location.hash || "").replace("#", ""), 10);
  go(isNaN(start) ? 0 : start - 1, { instant: PRINT });
})();
