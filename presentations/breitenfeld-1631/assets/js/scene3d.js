/* 3D-диорама поля битвы при Брейтенфельде.
   Всё строится процедурно: рельеф, солдатики (InstancedMesh), пушки, деревья, дым и листья.
   Камера: кинематографичный облёт по дуге, затем плавный подъём; лёгкий параллакс от мыши. */
(function () {
  "use strict";
  var api = { ok: false, start: function () {}, stop: function () {}, resize: function () {}, setTime: function () {} };
  window.Diorama = api;
  if (!window.THREE) return;
  var T = window.THREE;

  var canvas = document.getElementById("scene");
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
  } catch (e) { return; }
  if (!renderer.getContext()) return;
  api.ok = true;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  var scene = new T.Scene();
  var FOG = new T.Color(0xe9c99a);
  scene.fog = new T.Fog(FOG, 70, 250);

  var camera = new T.PerspectiveCamera(38, 16 / 9, 0.5, 600);

  /* ---------- шум ---------- */
  function hash(x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) { return vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.28 + vnoise(x * 4.3, y * 4.3) * 0.17; }
  function height(x, z) {
    var r = Math.sqrt(x * x * 0.8 + z * z);
    var h = (fbm(x * 0.025 + 3, z * 0.025 + 7) - 0.5) * 3.2;
    var far = Math.max(0, r - 70);
    h += far * far * 0.0011 * (0.5 + fbm(x * 0.012, z * 0.012));
    h += Math.sin(x * 0.05) * 0.5;
    return h;
  }
  var rnd = (function () { var s = 12345; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();

  /* ---------- небо ---------- */
  var sunDir = new T.Vector3(0.55, 0.16, -1).normalize();
  var skyMat = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: { sun: { value: sunDir } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: [
      "uniform vec3 sun; varying vec3 vP;",
      "void main(){",
      " float h = clamp(vP.y*1.6,0.0,1.0);",
      " vec3 low = vec3(0.98,0.80,0.55); vec3 mid = vec3(0.93,0.78,0.62); vec3 top = vec3(0.56,0.62,0.74);",
      " vec3 c = mix(low, mid, smoothstep(0.0,0.35,h)); c = mix(c, top, smoothstep(0.3,1.0,h));",
      " float s = max(dot(normalize(vP), sun),0.0);",
      " c += vec3(1.0,0.78,0.45)*pow(s,8.0)*0.55 + vec3(1.0,0.95,0.8)*pow(s,300.0)*1.2;",
      " float cl = sin(vP.x*9.0+vP.z*4.0)*0.5+0.5; cl *= smoothstep(0.08,0.25,h)*smoothstep(0.7,0.3,h);",
      " c = mix(c, vec3(1.0,0.86,0.72), cl*0.18);",
      " gl_FragColor = vec4(c,1.0);",
      "}"].join("\n")
  });
  var sky = new T.Mesh(new T.SphereGeometry(400, 32, 16), skyMat);
  scene.add(sky);

  /* ---------- свет ---------- */
  var hemi = new T.HemisphereLight(0xfff0d0, 0x8a6a3a, 1.15);
  scene.add(hemi);
  var sunL = new T.DirectionalLight(0xffd29a, 2.6);
  sunL.position.copy(sunDir).multiplyScalar(120);
  sunL.position.y = 46;
  sunL.castShadow = true;
  sunL.shadow.mapSize.set(2048, 2048);
  var sc = sunL.shadow.camera; sc.left = -85; sc.right = 85; sc.top = 70; sc.bottom = -70; sc.near = 10; sc.far = 320;
  sunL.shadow.bias = -0.0018; sunL.shadow.normalBias = 0.08;
  scene.add(sunL); scene.add(sunL.target);

  /* ---------- рельеф ---------- */
  var gGeo = new T.PlaneGeometry(420, 420, 170, 170);
  gGeo.rotateX(-Math.PI / 2);
  var pos = gGeo.attributes.position, col = new Float32Array(pos.count * 3);
  var cStraw = new T.Color(0xd9b46a), cOlive = new T.Color(0xa59a52), cRust = new T.Color(0xc07a3c), cDust = new T.Color(0xe6cf98), cGreen = new T.Color(0x8d9a55);
  var tmpC = new T.Color();
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i), z = pos.getZ(i);
    var y = height(x, z); pos.setY(i, y);
    var n = fbm(x * 0.04 + 11, z * 0.04 + 5), n2 = fbm(x * 0.11, z * 0.11);
    tmpC.copy(cStraw).lerp(cOlive, smooth(0.35, 0.7, n)).lerp(cRust, smooth(0.62, 0.85, n2) * 0.55).lerp(cGreen, smooth(0.6, 0.9, fbm(x * 0.02, z * 0.02 + 40)) * 0.5);
    // утоптанные дороги
    var road = Math.abs(x * 0.25 + z * 0.35 + Math.sin(z * 0.06) * 6);
    if (road < 1.6) tmpC.lerp(cDust, 0.65 * (1 - road / 1.6));
    col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b;
  }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  gGeo.setAttribute("color", new T.BufferAttribute(col, 3));
  gGeo.computeVertexNormals();
  var ground = new T.Mesh(gGeo, new T.MeshLambertMaterial({ vertexColors: true }));
  ground.receiveShadow = true;
  scene.add(ground);

  /* река */
  (function () {
    var pts = [];
    for (var k = 0; k <= 60; k++) { var t = k / 60; pts.push(new T.Vector3(40 + t * 160 + Math.sin(t * 6) * 12, 0, -150 + t * 90 + Math.cos(t * 5) * 10)); }
    var curve = new T.CatmullRomCurve3(pts);
    var g = new T.BufferGeometry(), v = [], idx = [];
    for (k = 0; k <= 120; k++) {
      var p = curve.getPoint(k / 120), tg = curve.getTangent(k / 120), nx = -tg.z, nz = tg.x, w = 3.2;
      var y1 = height(p.x + nx * w, p.z + nz * w), y2 = height(p.x - nx * w, p.z - nz * w);
      var yy = Math.min(y1, y2) + 0.25;
      v.push(p.x + nx * w, yy, p.z + nz * w, p.x - nx * w, yy, p.z - nz * w);
      if (k < 120) { var a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    g.setAttribute("position", new T.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals();
    var m = new T.Mesh(g, new T.MeshLambertMaterial({ color: 0xbcd0d2, emissive: 0x6a7f86, emissiveIntensity: 0.35, side: T.DoubleSide }));
    scene.add(m);
  })();

  /* ---------- инстансы ---------- */
  var dummy = new T.Object3D();
  function makeInst(geo, mat, count, shadow) {
    var m = new T.InstancedMesh(geo, mat, count);
    m.castShadow = shadow !== false; m.receiveShadow = false;
    m.instanceMatrix.setUsage(T.StaticDrawUsage);
    scene.add(m); return m;
  }
  var lam = function (c) { return new T.MeshLambertMaterial({ color: c === undefined ? 0xffffff : c }); };

  /* солдатик: тело, голова, шляпа/шлем, оружие */
  var geoBody = new T.BoxGeometry(0.46, 0.82, 0.32); geoBody.translate(0, 0.62, 0);
  var geoLegs = new T.BoxGeometry(0.38, 0.3, 0.26); geoLegs.translate(0, 0.15, 0);
  var geoHead = new T.IcosahedronGeometry(0.17, 0); geoHead.translate(0, 1.18, 0);
  var geoHat = new T.CylinderGeometry(0.13, 0.3, 0.16, 7); geoHat.translate(0, 1.34, 0);
  var geoHelm = new T.SphereGeometry(0.2, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2); geoHelm.translate(0, 1.24, 0);
  var geoMusket = new T.BoxGeometry(0.05, 0.05, 1.1); geoMusket.translate(0.18, 0.95, -0.25);
  var geoPike = new T.CylinderGeometry(0.025, 0.025, 4.6, 4); geoPike.translate(0.18, 2.3, 0);

  var people = []; // {x,z,rot,coat,trim,hat:'hat'|'helm',weapon:'musket'|'pike'|null,lean}
  function addPerson(o) { o.y = height(o.x, o.z); people.push(o); }

  var SW_BLUE = [0x2c4f96, 0x2a4a8c, 0x335aa6, 0x274383];
  var SW_YEL = [0xe2b23a, 0xd8a733];
  var SAX = [0x6f8fb8, 0x7a95ba, 0x8aa0bf];
  var IMP_R = [0xb3342f, 0xa52d29, 0xc0453a];
  var IMP_W = [0xf0e6d4, 0xe7dccb];
  function pick(a) { return a[(rnd() * a.length) | 0]; }

  /* шведские бригады: две линии, 6 шеренг */
  var flags = [], cannons = [], horses = [];
  function brigade(cx, cz, files, ranks, palette, trimP, facing) {
    for (var f = 0; f < files; f++) for (var r = 0; r < ranks; r++) {
      var pikeBlock = f > files * 0.36 && f < files * 0.64; // пики в центре бригады
      addPerson({ x: cx + (f - files / 2) * 0.72 + (rnd() - 0.5) * 0.08, z: cz + r * 0.78, rot: facing,
        coat: pick(palette), trim: pick(trimP), hat: pikeBlock ? "helm" : "hat", weapon: pikeBlock ? "pike" : "musket", lean: pikeBlock ? 0 : 0.9 });
    }
    flags.push({ x: cx, z: cz + ranks * 0.78 + 0.6, c1: palette === SAX ? 0xe9eef5 : 0x2c4f96, c2: palette === SAX ? 0x6f8fb8 : 0xe2b23a, h: 4.8 });
  }
  var swFront = [6, 18, 30, 42], swSecond = [12, 24, 36];
  swFront.forEach(function (x) { brigade(x, 14, 15, 6, SW_BLUE, SW_YEL, 0); });
  swSecond.forEach(function (x) { brigade(x, 24, 13, 6, SW_BLUE, SW_YEL, 0); });
  [-44, -32, -20, -8].forEach(function (x) { brigade(x, 15, 14, 7, SAX, SAX, 0); });
  brigade(-26, 26, 14, 6, SAX, SAX, 0);

  /* терции Тилли */
  var tercioCenters = [[-30, -30], [-12, -31], [6, -30], [24, -31], [-21, -46], [15, -46]];
  tercioCenters.forEach(function (c, ti) {
    var N = 17;
    for (var a = 0; a < N; a++) for (var b = 0; b < N; b++) {
      var edge = a < 2 || b < 2 || a > N - 3 || b > N - 3;
      addPerson({ x: c[0] + (a - N / 2) * 0.7 + (rnd() - 0.5) * 0.1, z: c[1] + (b - N / 2) * 0.7 + (rnd() - 0.5) * 0.1, rot: Math.PI,
        coat: edge ? pick(IMP_R) : (rnd() < 0.55 ? pick(IMP_R) : pick(IMP_W)), trim: pick(IMP_W), hat: edge ? "hat" : "helm",
        weapon: edge ? "musket" : "pike", lean: edge ? 0.9 : 0 });
    }
    flags.push({ x: c[0] - 2, z: c[1], c1: 0xf4efe6, c2: 0xb3342f, h: 7.2, cross: true });
    flags.push({ x: c[0] + 2.5, z: c[1] + 1, c1: 0xf4efe6, c2: 0xb3342f, h: 7.0, cross: true });
  });

  /* конница */
  function squadron(cx, cz, files, ranks, coat, trim, facing) {
    for (var f = 0; f < files; f++) for (var r = 0; r < ranks; r++) {
      var x = cx + (f - files / 2) * 1.0 + (rnd() - 0.5) * 0.15, z = cz + r * 1.9 * (facing === 0 ? 1 : -1);
      horses.push({ x: x, z: z, y: height(x, z), rot: facing, c: pick([0x6b4226, 0x7a4b2a, 0x5a3a22, 0xd9cfbf, 0x3e2a1c]) });
      people.push({ x: x, z: z, y: height(x, z) + 0.95, rot: facing, coat: pick(coat), trim: pick(trim), hat: "hat", weapon: null, rider: true });
    }
  }
  [[58, 15], [70, 15], [62, 23], [74, 23]].forEach(function (p) { squadron(p[0], p[1], 10, 3, SW_BLUE, SW_YEL, 0); });
  [[-60, 16], [-72, 18], [-64, 25]].forEach(function (p) { squadron(p[0], p[1], 10, 3, SAX, SAX, 0); });
  [[-58, -30], [-71, -28], [-62, -40], [52, -29], [65, -30], [58, -40], [72, -40]].forEach(function (p) { squadron(p[0], p[1], 10, 3, [0x5b2a24, 0xa52d29, 0x3a2c22], IMP_W, Math.PI); });
  /* мушкетёры среди шведской конницы */
  [[64, 13], [76, 21]].forEach(function (p) { brigade(p[0], p[1], 6, 2, SW_BLUE, SW_YEL, 0); });

  var nP = people.length;
  var mBody = makeInst(geoBody, lam(), nP), mLegs = makeInst(geoLegs, lam(0x3b2c22), nP);
  var mHead = makeInst(geoHead, lam(0xf1c9a5), nP, false);
  var nHat = 0, nHelm = 0, nMus = 0, nPike = 0;
  people.forEach(function (p) { if (p.hat === "hat") nHat++; else nHelm++; if (p.weapon === "musket") nMus++; else if (p.weapon === "pike") nPike++; });
  var mHat = makeInst(geoHat, lam(0x2a2320), nHat, false), mHelm = makeInst(geoHelm, new T.MeshPhongMaterial({ color: 0xb9b9b4, shininess: 60, specular: 0x777777 }), nHelm, false);
  var mMus = makeInst(geoMusket, lam(0x4a3322), Math.max(1, nMus), false), mPike = makeInst(geoPike, lam(0x9b7a4a), Math.max(1, nPike));
  var c = new T.Color(), ih = 0, ie = 0, im = 0, ip = 0;
  people.forEach(function (p, k) {
    dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(0, p.rot + (rnd() - 0.5) * 0.12, 0);
    var s = 0.95 + rnd() * 0.1; dummy.scale.set(s, s, s); dummy.updateMatrix();
    mBody.setMatrixAt(k, dummy.matrix); mBody.setColorAt(k, c.setHex(p.coat));
    if (p.rider) { var d2 = dummy.clone(); d2.scale.set(0, 0, 0); d2.updateMatrix(); mLegs.setMatrixAt(k, d2.matrix); }
    else { mLegs.setMatrixAt(k, dummy.matrix); mLegs.setColorAt(k, c.setHex(p.trim === undefined ? 0x3b2c22 : (rnd() < 0.5 ? 0x3b2c22 : p.trim))); }
    mHead.setMatrixAt(k, dummy.matrix);
    if (p.hat === "hat") mHat.setMatrixAt(ih++, dummy.matrix); else mHelm.setMatrixAt(ie++, dummy.matrix);
    if (p.weapon === "musket") mMus.setMatrixAt(im++, dummy.matrix);
    else if (p.weapon === "pike") {
      var lean = (rnd() - 0.5) * 0.06;
      dummy.rotation.set(lean, p.rot, (rnd() - 0.5) * 0.06); dummy.updateMatrix(); mPike.setMatrixAt(ip++, dummy.matrix);
    }
  });
  [mBody, mLegs, mHead, mHat, mHelm, mMus, mPike].forEach(function (m) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });

  /* лошади */
  var geoHorse = new T.BoxGeometry(0.5, 0.55, 1.4); geoHorse.translate(0, 0.95, 0);
  var geoHorseHead = new T.BoxGeometry(0.26, 0.6, 0.32); geoHorseHead.rotateX(-0.6); geoHorseHead.translate(0, 1.38, -0.78);
  var geoHLegs = new T.BoxGeometry(0.42, 0.7, 1.1); geoHLegs.translate(0, 0.35, 0);
  var mH = makeInst(geoHorse, lam(), horses.length), mHH = makeInst(geoHorseHead, lam(), horses.length), mHL = makeInst(geoHLegs, lam(), horses.length);
  horses.forEach(function (h, k) {
    dummy.position.set(h.x, h.y, h.z); dummy.rotation.set(0, h.rot + (rnd() - 0.5) * 0.2, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
    [mH, mHH, mHL].forEach(function (m) { m.setMatrixAt(k, dummy.matrix); m.setColorAt(k, c.setHex(h.c)); });
  });
  [mH, mHH, mHL].forEach(function (m) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; });

  /* знамёна */
  var flagMeshes = [];
  function flagTex(c1, c2, cross) {
    var cv = document.createElement("canvas"); cv.width = 64; cv.height = 44; var g = cv.getContext("2d");
    g.fillStyle = "#" + new T.Color(c1).getHexString(); g.fillRect(0, 0, 64, 44);
    g.fillStyle = "#" + new T.Color(c2).getHexString();
    if (cross) { // бургундский крест: красный косой крест из сучковатых ветвей на белом поле
      g.strokeStyle = g.fillStyle; g.lineWidth = 7; g.lineCap = "round";
      g.beginPath(); g.moveTo(6, 4); g.lineTo(58, 40); g.moveTo(58, 4); g.lineTo(6, 40); g.stroke();
      [[18, 12], [46, 32], [46, 12], [18, 32], [32, 22]].forEach(function (k) { g.beginPath(); g.arc(k[0], k[1], 4.5, 0, 7); g.fill(); });
    }
    else { g.fillRect(18, 0, 8, 44); g.fillRect(0, 18, 64, 8); }
    var t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t;
  }
  var poleGeo = new T.CylinderGeometry(0.04, 0.04, 1, 4);
  flags.forEach(function (f) {
    var y = height(f.x, f.z);
    var pole = new T.Mesh(poleGeo, lam(0x7a5a32)); pole.scale.y = f.h; pole.position.set(f.x, y + f.h / 2, f.z); pole.castShadow = true; scene.add(pole);
    var g = new T.PlaneGeometry(1.7, 1.15, 8, 1); g.translate(0.85, 0, 0);
    var m = new T.Mesh(g, new T.MeshLambertMaterial({ map: flagTex(f.c1, f.c2, f.cross), side: T.DoubleSide }));
    m.position.set(f.x, y + f.h - 0.65, f.z); m.rotation.y = Math.PI / 2 + 0.6; scene.add(m);
    m.userData.base = g.attributes.position.array.slice(); m.userData.ph = rnd() * 6;
    flagMeshes.push(m);
  });

  /* пушки */
  var barrelGeo = new T.CylinderGeometry(0.16, 0.22, 2.0, 10); barrelGeo.rotateX(Math.PI / 2);
  var wheelGeo = new T.CylinderGeometry(0.55, 0.55, 0.1, 12); wheelGeo.rotateZ(Math.PI / 2);
  var carGeo = new T.BoxGeometry(0.4, 0.25, 1.9);
  var bronze = new T.MeshPhongMaterial({ color: 0x8a6a3a, shininess: 70, specular: 0x9a8050 });
  var ironM = new T.MeshPhongMaterial({ color: 0x3a3a3c, shininess: 40, specular: 0x555555 });
  var woodM = lam(0x6e4a2a);
  function cannon(x, z, rot, s, mat) {
    var g = new T.Group(); var y = height(x, z);
    var b = new T.Mesh(barrelGeo, mat); b.position.set(0, 0.75, -0.2); b.rotation.x = -0.06; g.add(b);
    var w1 = new T.Mesh(wheelGeo, woodM); w1.position.set(0.45, 0.55, 0.1); g.add(w1);
    var w2 = w1.clone(); w2.position.x = -0.45; g.add(w2);
    var ca = new T.Mesh(carGeo, woodM); ca.position.set(0, 0.45, 0.55); ca.rotation.x = 0.25; g.add(ca);
    g.traverse(function (o) { o.castShadow = true; });
    g.position.set(x, y, z); g.rotation.y = rot; g.scale.setScalar(s); scene.add(g);
    cannons.push({ x: x, y: y + 0.75 * s, z: z, dir: rot === 0 ? -1 : 1, next: 1 + rnd() * 6 });
  }
  [0, 12, 24, 36, 48, -38, -14].forEach(function (x) { cannon(x, 10.6, 0, 0.85, bronze); });
  [-36, -22, -4, 14, 30].forEach(function (x) { cannon(x, -19.5, Math.PI, 1.3, ironM); });

  /* деревья */
  (function () {
    var trunk = new T.CylinderGeometry(0.15, 0.22, 1.6, 5); trunk.translate(0, 0.8, 0);
    var crownC = new T.ConeGeometry(1.4, 3.6, 7); crownC.translate(0, 3.1, 0);
    var crownR = new T.IcosahedronGeometry(1.6, 0); crownR.translate(0, 2.9, 0);
    var list = [];
    for (var k = 0; k < 520; k++) {
      var a = rnd() * Math.PI * 2, r = 52 + Math.pow(rnd(), 0.7) * 120;
      var x = Math.cos(a) * r * 1.25, z = Math.sin(a) * r;
      if (Math.abs(x) < 85 && z > -55 && z < 40) continue;
      if (fbm(x * 0.03, z * 0.03) < 0.42) continue;
      list.push([x, z, 0.8 + rnd() * 0.9, rnd() < 0.4]);
    }
    for (k = 0; k < 40; k++) list.push([-95 + rnd() * 30, 30 + rnd() * 30, 0.9 + rnd() * 0.6, rnd() < 0.5]);
    var nC = 0, nR = 0; list.forEach(function (t) { if (t[3]) nC++; else nR++; });
    var mt = makeInst(trunk, lam(0x5a3f28), list.length), mc = makeInst(crownC, lam(), nC), mr = makeInst(crownR, lam(), nR);
    var cols = [0xd8862f, 0xc9562b, 0xe2a83a, 0xa83a26, 0x7d8a3c, 0xb8702a, 0x55703a];
    var ic = 0, ir = 0;
    list.forEach(function (t, k) {
      dummy.position.set(t[0], height(t[0], t[1]) - 0.1, t[1]); dummy.rotation.set(0, rnd() * 6, 0); dummy.scale.setScalar(t[2]); dummy.updateMatrix();
      mt.setMatrixAt(k, dummy.matrix);
      if (t[3]) { mc.setMatrixAt(ic, dummy.matrix); mc.setColorAt(ic++, c.setHex(rnd() < 0.6 ? 0x4f6a3a : pick(cols))); }
      else { mr.setMatrixAt(ir, dummy.matrix); mr.setColorAt(ir++, c.setHex(pick(cols))); }
    });
    [mt, mc, mr].forEach(function (m) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  })();

  /* деревня и церковь вдали */
  (function () {
    var wall = lam(0xeadcc0), roof = lam(0xa4482e);
    function house(x, z, w, d, h, r) {
      var y = height(x, z);
      var b = new T.Mesh(new T.BoxGeometry(w, h, d), wall); b.position.set(x, y + h / 2, z); b.rotation.y = r; b.castShadow = true; scene.add(b);
      var rf = new T.Mesh(new T.ConeGeometry(Math.max(w, d) * 0.78, h * 0.8, 4), roof); rf.position.set(x, y + h + h * 0.4, z); rf.rotation.y = r + Math.PI / 4; rf.castShadow = true; scene.add(rf);
    }
    for (var k = 0; k < 14; k++) house(70 + rnd() * 34, -88 - rnd() * 26, 3 + rnd() * 2, 3 + rnd() * 2, 2.4 + rnd(), rnd());
    var cx = 92, cz = -104, cy = height(cx, cz);
    var nave = new T.Mesh(new T.BoxGeometry(5, 5, 12), wall); nave.position.set(cx, cy + 2.5, cz); scene.add(nave);
    var tower = new T.Mesh(new T.BoxGeometry(3.4, 11, 3.4), wall); tower.position.set(cx, cy + 5.5, cz + 7); scene.add(tower);
    var spire = new T.Mesh(new T.ConeGeometry(2.3, 7, 6), lam(0x4b5a66)); spire.position.set(cx, cy + 14.5, cz + 7); scene.add(spire);
    var nroof = new T.Mesh(new T.ConeGeometry(4.6, 3.5, 4), roof); nroof.scale.z = 2.2; nroof.rotation.y = Math.PI / 4; nroof.position.set(cx, cy + 6.6, cz); scene.add(nroof);
    for (k = 0; k < 7; k++) house(-80 + rnd() * 20, 52 + rnd() * 12, 3, 3, 2.4, rnd());
  })();

  /* ---------- частицы: дым и блики ---------- */
  function softTex() {
    var cv = document.createElement("canvas"); cv.width = cv.height = 64; var g = cv.getContext("2d");
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(cv);
  }
  var tex = softTex();
  function pointsSystem(n, color, additive) {
    var g = new T.BufferGeometry();
    var p = new Float32Array(n * 3), a = new Float32Array(n), s = new Float32Array(n);
    g.setAttribute("position", new T.BufferAttribute(p, 3));
    g.setAttribute("aAlpha", new T.BufferAttribute(a, 1));
    g.setAttribute("aSize", new T.BufferAttribute(s, 1));
    var mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending,
      uniforms: { map: { value: tex }, color: { value: new T.Color(color) }, scale: { value: 520 } },
      vertexShader: "attribute float aAlpha; attribute float aSize; varying float vA; uniform float scale; void main(){ vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize = aSize*scale/ -mv.z; gl_Position=projectionMatrix*mv; }",
      fragmentShader: "uniform sampler2D map; uniform vec3 color; varying float vA; void main(){ vec4 t=texture2D(map, gl_PointCoord); gl_FragColor=vec4(color, t.a*vA); }"
    });
    var pts = new T.Points(g, mat); pts.frustumCulled = false; scene.add(pts);
    return { geo: g, p: p, a: a, s: s, n: n, mat: mat };
  }
  var smoke = pointsSystem(520, 0xf6efe4, false);
  var smokeP = []; for (var k = 0; k < smoke.n; k++) smokeP.push({ life: 0, max: 1, vx: 0, vy: 0, vz: 0, s0: 1 });
  var sIdx = 0;
  function puff(x, y, z, dir, big) {
    var cnt = big ? 16 : 6;
    for (var q = 0; q < cnt; q++) {
      var o = smokeP[sIdx]; var i3 = sIdx * 3; sIdx = (sIdx + 1) % smoke.n;
      smoke.p[i3] = x + (rnd() - 0.5) * 0.6; smoke.p[i3 + 1] = y + rnd() * 0.4; smoke.p[i3 + 2] = z + dir * (0.8 + rnd() * 1.2);
      o.vx = (rnd() - 0.5) * 0.6 + 0.35; o.vy = 0.35 + rnd() * 0.5; o.vz = dir * (1.2 + rnd() * 1.6) * (big ? 1 : 0.4);
      o.life = 0; o.max = (big ? 5 : 3.2) + rnd() * 2.5; o.s0 = (big ? 2.2 : 1.1) + rnd() * 1.2;
    }
  }
  /* мушкетный дымок вдоль линий */
  var lineFire = [];
  swFront.forEach(function (x) { lineFire.push({ x: x, z: 13.5, dir: -1, next: rnd() * 5 }); });
  tercioCenters.slice(0, 4).forEach(function (cc) { lineFire.push({ x: cc[0], z: cc[1] + 6.2, dir: 1, next: rnd() * 6 }); });

  var motes = pointsSystem(170, 0xffd38a, true), moteP = [];
  for (k = 0; k < motes.n; k++) {
    moteP.push({ x: (rnd() - 0.5) * 120, y: 1 + rnd() * 14, z: (rnd() - 0.5) * 90, ph: rnd() * 6, sp: 0.2 + rnd() * 0.5 });
    motes.s[k] = 0.25 + rnd() * 0.45;
  }

  /* листья */
  var leafGeo = new T.PlaneGeometry(0.6, 0.38); leafGeo.translate(0.1, 0, 0);
  var leafMat = new T.MeshLambertMaterial({ side: T.DoubleSide, alphaTest: 0.5, map: (function () {
    var cv = document.createElement("canvas"); cv.width = 64; cv.height = 40; var g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(2, 20); g.quadraticCurveTo(30, -6, 62, 20); g.quadraticCurveTo(30, 46, 2, 20); g.fill();
    g.strokeStyle = "rgba(120,80,40,.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(2, 20); g.lineTo(60, 20); g.stroke();
    var t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t; })() });
  var NL = reduce ? 60 : 260;
  var leaves = new T.InstancedMesh(leafGeo, leafMat, NL); leaves.instanceMatrix.setUsage(T.DynamicDrawUsage); leaves.frustumCulled = false; scene.add(leaves);
  var leafP = [], lc = [0xe8b23a, 0xd9932c, 0xc4482a, 0xa8301f, 0xf0c45a, 0xd8662a];
  for (k = 0; k < NL; k++) { leafP.push({ x: 0, y: 0, z: 0, ph: rnd() * 6, sp: 0.6 + rnd() * 0.9, rx: rnd() * 6, ry: rnd() * 6, w: 1 + rnd() * 2 }); leaves.setColorAt(k, c.setHex(pick(lc))); }
  leaves.instanceColor.needsUpdate = true;
  for (k = 0; k < NL; k++) { var l0 = leafP[k]; resetLeaf(l0, { x: 0, z: 20 }, true); l0.init = true; dummy.position.set(l0.x, l0.y, l0.z); dummy.rotation.set(l0.rx, l0.ry, 0); dummy.updateMatrix(); leaves.setMatrixAt(k, dummy.matrix); }
  function resetLeaf(l, around, initial) {
    l.x = around.x + (rnd() - 0.5) * 70; l.z = around.z + (rnd() - 0.5) * 70; l.y = initial ? rnd() * 24 : 18 + rnd() * 10;
  }

  /* ---------- камера ---------- */
  var target = new T.Vector3(0, 0, -6), camPos = new T.Vector3(), look = new T.Vector3();
  var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener("pointermove", function (e) { mouse.x = e.clientX / window.innerWidth * 2 - 1; mouse.y = e.clientY / window.innerHeight * 2 - 1; }, { passive: true });
  function ease(t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); }
  function easeIO(t) { t = Math.min(1, Math.max(0, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function cameraAt(t) {
    // фаза A: низкий облёт по дуге (0..16 c); фаза B: плавный подъём (15..27 c); дальше еле заметное дыхание
    var a = easeIO(t / 16), b = easeIO((t - 15) / 12);
    var ang = 1.2 - a * 1.0 - b * 0.12 + (t > 27 ? Math.sin((t - 27) * 0.08) * 0.06 : 0);
    var rad = 70 - a * 14 + b * 22;
    var hgt = 5.5 + a * 4.5 + b * 15;
    camPos.set(Math.sin(ang) * rad, hgt, Math.cos(ang) * rad - 6);
    look.set(target.x - Math.sin(ang) * 6, 3.2 - a * 0.6 + b * 1.2, target.z - 4);
  }

  /* ---------- цикл ---------- */
  /* тени статичны (войска стоят), поэтому карту теней считаем один раз */
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  var running = false, clock = new T.Clock(false), elapsed = 0, raf = 0, last = 0;
  /* адаптивное качество: если кадры медленные, снижаем плотность пикселей */
  var perf = { n: 0, sum: 0, level: 1 }, baseRatio = 1;
  function frame() {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.05, clock.getDelta());
    elapsed += dt;
    if (perf.level > 0.55) {
      perf.n++; perf.sum += dt;
      if (perf.n === 45) {
        var avg = perf.sum / perf.n; perf.n = 0; perf.sum = 0;
        if (avg > 0.024) { perf.level = Math.max(0.55, perf.level * 0.75); renderer.setPixelRatio(baseRatio * perf.level); }
      }
    }
    update(dt, elapsed);
    renderer.render(scene, camera);
  }
  function update(dt, t) {
    var tt = reduce ? 30 : t;
    cameraAt(tt);
    mouse.sx += (mouse.x - mouse.sx) * 0.04; mouse.sy += (mouse.y - mouse.sy) * 0.04;
    var px = reduce ? 0 : mouse.sx, py = reduce ? 0 : mouse.sy;
    camera.position.set(camPos.x + px * 3.2, camPos.y - py * 1.8, camPos.z);
    camera.lookAt(look.x + px * 1.2, look.y - py * 0.6, look.z);

    if (reduce) { return; }
    /* знамёна колышутся */
    for (var f = 0; f < flagMeshes.length; f++) {
      var m = flagMeshes[f], arr = m.geometry.attributes.position.array, base = m.userData.base;
      for (var i = 0; i < arr.length; i += 3) { var u = base[i]; arr[i + 2] = Math.sin(u * 3.2 - t * 3.4 + m.userData.ph) * 0.16 * u; }
      m.geometry.attributes.position.needsUpdate = true;
    }
    /* выстрелы пушек */
    for (var k = 0; k < cannons.length; k++) { var cn = cannons[k]; cn.next -= dt; if (cn.next <= 0) { puff(cn.x, cn.y, cn.z, cn.dir, true); cn.next = 4 + rnd() * 7; } }
    for (k = 0; k < lineFire.length; k++) { var lf = lineFire[k]; lf.next -= dt; if (lf.next <= 0) { for (var q = -3; q <= 3; q++) puff(lf.x + q * 1.4, 1.2, lf.z, lf.dir, false); lf.next = 5 + rnd() * 6; } }
    /* дым */
    for (k = 0; k < smoke.n; k++) {
      var o = smokeP[k], i3 = k * 3;
      if (o.life >= o.max) { smoke.a[k] = 0; continue; }
      o.life += dt; var lt = o.life / o.max;
      o.vz *= 0.97; o.vx *= 0.99;
      smoke.p[i3] += o.vx * dt; smoke.p[i3 + 1] += o.vy * dt; smoke.p[i3 + 2] += o.vz * dt;
      smoke.a[k] = Math.min(1, lt * 8) * (1 - lt) * 0.62;
      smoke.s[k] = o.s0 * (1 + lt * 3.2);
    }
    smoke.geo.attributes.position.needsUpdate = true; smoke.geo.attributes.aAlpha.needsUpdate = true; smoke.geo.attributes.aSize.needsUpdate = true;
    /* золотые блики */
    for (k = 0; k < motes.n; k++) {
      var mp = moteP[k];
      motes.p[k * 3] = mp.x + Math.sin(t * mp.sp + mp.ph) * 2; motes.p[k * 3 + 1] = mp.y + Math.sin(t * 0.7 + mp.ph) * 0.6; motes.p[k * 3 + 2] = mp.z + Math.cos(t * mp.sp + mp.ph) * 2;
      motes.a[k] = 0.25 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.2 + mp.ph * 3), 3);
    }
    motes.geo.attributes.position.needsUpdate = true; motes.geo.attributes.aAlpha.needsUpdate = true;
    /* листья вокруг камеры */
    var around = { x: camera.position.x * 0.55, z: camera.position.z * 0.55 };
    for (k = 0; k < NL; k++) {
      var l = leafP[k];
      if (l.y <= 0 && l.init) resetLeaf(l, around, false);
      if (!l.init) { resetLeaf(l, around, true); l.init = true; }
      l.y -= dt * l.sp; l.x += Math.sin(t * l.w + l.ph) * dt * 1.2 + dt * 0.9; l.z += Math.cos(t * 0.8 + l.ph) * dt * 0.6;
      if (Math.abs(l.x - around.x) > 45 || Math.abs(l.z - around.z) > 45) resetLeaf(l, around, false);
      dummy.position.set(l.x, l.y, l.z); dummy.rotation.set(l.rx + t * l.w, l.ry + t * 0.9, Math.sin(t * l.w + l.ph)); dummy.scale.setScalar(1); dummy.updateMatrix();
      leaves.setMatrixAt(k, dummy.matrix);
    }
    leaves.instanceMatrix.needsUpdate = true;
  }

  api.resize = function (cssScale) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pr = Math.max(0.5, Math.min(1.5, dpr * (cssScale || 1)));
    baseRatio = pr;
    renderer.setPixelRatio(pr * perf.level);
    renderer.setSize(1920, 1080, false);
    camera.aspect = 16 / 9; camera.updateProjectionMatrix();
    if (!running) { update(0, elapsed); renderer.render(scene, camera); }
  };
  api.start = function () {
    if (running) return; running = true;
    if (reduce) { update(0, 30); renderer.render(scene, camera); return; }
    clock.start(); raf = requestAnimationFrame(frame);
  };
  api.stop = function () { running = false; cancelAnimationFrame(raf); clock.stop(); };
  /* для PDF-кадров: показать сцену в момент времени t с прогретыми частицами */
  api.setTime = function (t) {
    api.stop(); elapsed = 0;
    for (var s = 0; s < t; s += 1 / 30) { elapsed = s; update(1 / 30, s); }
    elapsed = t; update(0, t); renderer.render(scene, camera);
  };
  api.reset = function () { elapsed = 0; };
  api.info = function () { return renderer.info.render; };
})();
