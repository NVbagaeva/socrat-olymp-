/**
 * Шейдеры заставки (GLSL ES 3.00, WebGL2).
 *
 * Цвета — только из палитры сайта (styles/tokens.css), в шейдер они
 * вписаны числами:
 *   голубое стекло  --blue-300 #9bc0f2, --blue-200 #d7e5fa, --blue-100 #e8f0fc,
 *                   --blue-400 #5d8ce8, --ice #f5f9ff;
 *   контур          --navy-900 #0b1f45;
 *   тёплый акцент   --terracotta #e07a2f — рёбра, тычинки, сердцевина;
 *                   в самых ярких местах он выгорает до белого.
 *
 * Всё рисуется с премультиплицированной альфой: blend(ONE, 1 − srcA).
 * Свечение пишет цвет при нулевой альфе — это чистое сложение света,
 * поверх страницы такие пиксели светятся, а не закрашивают её.
 */

const PALETTE = /* glsl */ `
const vec3 GOLD = vec3(0.878, 0.478, 0.184);
const vec3 HOT = vec3(1.0, 0.86, 0.66);
const vec3 BLUE400 = vec3(0.365, 0.549, 0.910);
const vec3 BLUE300 = vec3(0.608, 0.753, 0.949);
const vec3 BLUE200 = vec3(0.843, 0.898, 0.980);
const vec3 BLUE100 = vec3(0.910, 0.941, 0.988);
const vec3 ICE = vec3(0.961, 0.976, 1.0);
const vec3 NAVY = vec3(0.043, 0.122, 0.271);
`;

export const MESH_VS = /* glsl */ `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 aExtra;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform vec3 uCam;
#ifdef GROW
uniform float uGrow;
#endif
out vec3 vPos;
out vec3 vNormal;
out vec4 vExtra;
out float vFacing;
void main() {
  vec3 p = aPos;
#ifdef GROW
  /* Тычинка растёт из корня: aExtra.xyz — корень, aExtra.w — задержка. */
  float g = clamp((uGrow - aExtra.w) / 0.6, 0.0, 1.0);
  g = g * g * (3.0 - 2.0 * g);
  p = mix(aExtra.xyz, aPos, g);
#endif
  vec4 wp = uModel * vec4(p, 1.0);
  vPos = wp.xyz;
  vNormal = mat3(uModel) * aNormal;
  vExtra = aExtra;
  /* Смотрит ли пластина (её ось z) на камеру — для тусклых задних рёбер. */
  vFacing = dot(normalize(mat3(uModel)[2]), normalize(uCam - wp.xyz));
  gl_Position = uViewProj * wp;
}
`;

const ENV = /* glsl */ `
/* Окружение для отражений: светлая студия — мягкий голубой горизонт,
   белый верх и несколько софтбоксов. Дают белые блики стекла. */
vec3 env(vec3 r) {
  vec3 c = mix(BLUE400 * 0.7, BLUE200 * 0.95, smoothstep(-0.6, 0.8, r.y));
  c += 1.1 * pow(max(dot(r, normalize(vec3(-0.55, 0.65, 0.55))), 0.0), 48.0);
  c += 0.8 * pow(max(dot(r, normalize(vec3(0.7, 0.45, 0.5))), 0.0), 80.0);
  c += 0.5 * smoothstep(0.95, 0.99, dot(r, normalize(vec3(0.05, 0.95, 0.3))));
  return c;
}
`;

export const GLASS_FS = /* glsl */ `
precision highp float;
${PALETTE}
${ENV}
in vec3 vPos;
in vec3 vNormal;
in vec4 vExtra;
in float vFacing;
uniform vec3 uCam;
uniform vec3 uCore;
uniform float uCoreI;
uniform float uAlpha;
uniform float uTime;
#ifdef REFRACT
uniform sampler2D uBack;
uniform vec2 uRes;
uniform mat4 uView;
#endif
out vec4 o;

void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCam - vPos);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float F = 0.04 + 0.96 * pow(1.0 - ndv, 4.0);
  vec3 R = reflect(-V, N);
  vec3 spec = env(R);

  vec3 toCore = uCore - vPos;
  float dc = length(toCore);
  vec3 L = toCore / max(dc, 1e-4);
  /* Тёплый свет ядра просвечивает стекло вблизи сердцевины. */
  float warm = uCoreI * exp(-dc * 2.6);
  float key = 0.6 + 0.4 * max(dot(N, normalize(vec3(-0.35, 0.85, 0.45))), 0.0);

#ifdef PLATE
  /* Кристалл: прозрачное голубое стекло, внутренние отражения — блики
     по возмущённой нормали и тонкие линии граней внутри пластины. */
  vec2 q = vExtra.xy;
  float side = vExtra.z;
  vec3 N2 = normalize(N + 0.45 * vec3(sin(q.x * 9.0 + side), sin(q.y * 11.0 - side), cos((q.x - q.y) * 7.0)));
  vec3 inner = env(reflect(-V, N2));
  float lines = 0.0;
  for (int i = 0; i < 3; i++) {
    float a = float(i) * 2.0944 + 0.35;
    float d = dot(q, vec2(cos(a), sin(a))) * 4.4 + side * 0.31 + float(i) * 0.17;
    lines += smoothstep(0.035, 0.0, abs(fract(d) - 0.5));
  }
  float shimmer = 0.55 + 0.45 * sin(dot(V, vec3(13.0, 7.0, 11.0)) + uTime * 0.6);
  float a = clamp(0.38 + 0.45 * F, 0.0, 1.0);
  /* Глубокий синий в толще, светлый — на гранях к зрителю: «кристалл». */
  float facet = 0.5 + 0.5 * sin(dot(N2, vec3(5.0, 3.0, 4.0)) + side);
  vec3 body = mix(BLUE400 * 0.8, BLUE200, (0.15 + 0.5 * ndv) * (0.6 + 0.4 * facet));
  /* Длинный блик-полоса по грани: «стеклянная» диагональ кадра 1. */
  float streak = smoothstep(0.8, 1.0, sin(dot(q, vec2(2.3, 1.4)) * 2.2 + side * 1.3 + dot(V, vec3(2.0, 1.0, 0.0))));
  vec3 col = body * a * key * 0.75
    + spec * F * 0.55
    + inner * a * 0.12
    + ICE * streak * a * 0.35
    + ICE * lines * 0.16 * shimmer
    + HOT * warm * 0.45 * (0.5 + 0.5 * abs(dot(N, L)));
  /* Тонкий тёмно-синий контур у самого края силуэта. */
  col = mix(col, NAVY * a, smoothstep(0.93, 1.0, 1.0 - ndv) * 0.25);
#else
  /* Лепесток: жемчужно-белое стекло с голубым оттенком к кончику и краям. */
  float u = vExtra.x;
  float across = abs(vExtra.y);
  /* Прозрачная голубая линза: середина светлее, к краям и кончику — синее. */
  vec3 body = mix(BLUE100, BLUE300, clamp(smoothstep(0.25, 1.0, u) * 0.5 + across * across * 0.5, 0.0, 1.0));
  body = mix(body, BLUE400, F * 0.3);
  float a = clamp(0.3 + 0.45 * F, 0.0, 1.0);
  float glowIn = warm * (0.55 + 0.45 * abs(dot(N, L))) * (1.0 - 0.6 * u);
  /* Огранка внутри лепестка: тонкие диагонали от основания к кончику,
     как у резного кристалла (слои 3 и 4). */
  float x = vExtra.y;
  float cut = 0.0;
  cut += smoothstep(0.045, 0.0, abs(fract((x * 1.6 + u * 2.4) * 2.0) - 0.5) - 0.44);
  cut += smoothstep(0.045, 0.0, abs(fract((-x * 1.6 + u * 2.4) * 2.0) - 0.5) - 0.44);
  cut *= smoothstep(0.02, 0.2, u) * (1.0 - smoothstep(0.85, 1.0, u));
  /* Золотой ободок по краю лепестка. */
  /* Край линзы — там, где сечение сходится (sin β → 0): узкая полоса. */
  float rim = smoothstep(0.9, 1.0, 1.0 - abs(vExtra.z)) * (0.35 + 0.65 * smoothstep(0.1, 0.6, u));
  vec3 col = body * a * mix(0.5, 1.0, key)
    + spec * F * 0.6
    + ICE * pow(1.0 - ndv, 2.5) * a * 0.4
    + ICE * cut * a * 0.35 * (0.5 + 0.5 * F)
    + mix(GOLD, HOT, 0.45) * glowIn * 0.55
    + mix(GOLD, HOT, 0.5) * rim * 1.3;
  a = max(a, rim * 0.5);
  col = mix(col, NAVY * a, smoothstep(0.96, 1.0, 1.0 - ndv) * 0.18);
#endif

#ifdef REFRACT
  /* Преломление: то, что светится за стеклом (ядро, тычинки, нити),
     видно сквозь него со сдвигом по нормали и лёгкой дисперсией. */
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 nv = mat3(uView) * N;
  vec2 off = nv.xy * 0.045;
  vec3 back = vec3(
    texture(uBack, uv + off * 1.08).r,
    texture(uBack, uv + off).g,
    texture(uBack, uv + off * 0.92).b
  );
  col += back * (1.0 - F) * 0.8 * a;
#endif

  o = vec4(col, a) * uAlpha;
}
`;

export const EDGE_FS = /* glsl */ `
precision highp float;
${PALETTE}
in vec3 vPos;
in vec3 vNormal;
in vec4 vExtra;
in float vFacing;
uniform vec3 uCam;
uniform float uI;
uniform float uBackDim;
uniform float uTime;
out vec4 o;
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCam - vPos);
  float ndv = abs(dot(N, V));
  float dim = mix(uBackDim, 1.0, smoothstep(-0.25, 0.3, vFacing));
  /* По ребру бегут мягкие волны яркости — «живой» свет. */
  float run = 0.85 + 0.15 * sin(vExtra.x * 6.0 - uTime * 2.2 + vExtra.y * 2.0);
  /* Сердцевина линии почти белая с золотом, ореол — терракотовый. */
  vec3 col = GOLD * 1.15 + HOT * 0.45 + vec3(0.25) * pow(ndv, 3.0);
  /* Немного кроющей альфы: на светлой странице золото не бледнеет. */
  o = vec4(col * uI * dim * run, 0.45 * uI * dim);
}
`;

export const GOLD_FS = /* glsl */ `
precision highp float;
${PALETTE}
in vec3 vPos;
in vec3 vNormal;
in vec4 vExtra;
in float vFacing;
uniform vec3 uCam;
uniform vec3 uCore;
uniform float uI;
out vec4 o;
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCam - vPos);
  vec3 L = normalize(vec3(-0.4, 0.8, 0.6));
  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 36.0);
  float ndv = max(dot(N, V), 0.0);
  float nearCore = exp(-length(uCore - vPos) * 3.0);
  /* Металл: тёмный край, насыщенная середина, белёсый блик (слой 5). */
  vec3 col = GOLD * (0.3 + 0.95 * diff) * (0.5 + 0.5 * ndv)
    + mix(GOLD, HOT, 0.6) * spec * 1.8
    + GOLD * nearCore * 0.5;
  o = vec4(col * uI, uI);
}
`;

export const LINE_VS = /* glsl */ `
layout(location = 0) in vec3 aPos;
layout(location = 2) in vec4 aExtra;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform vec3 uCore;
uniform float uTime;
out vec4 vExtra;
void main() {
  /* Каждая петля медленно вращается вокруг ядра со своей скоростью. */
  float a = uTime * (0.35 + aExtra.y * 0.09);
  float c = cos(a);
  float s = sin(a);
  vec3 p = vec3(c * aPos.x + s * aPos.z, aPos.y, -s * aPos.x + c * aPos.z);
  vExtra = aExtra;
  gl_Position = uViewProj * (uModel * vec4(p + uCore, 1.0));
}
`;

export const LINE_FS = /* glsl */ `
precision highp float;
${PALETTE}
in vec4 vExtra;
uniform float uI;
uniform float uTime;
out vec4 o;
void main() {
  float pulse = 0.55 + 0.45 * sin(vExtra.x * 25.0 - uTime * 3.0 + vExtra.y);
  o = vec4(mix(GOLD, HOT, 0.3) * 1.8 * uI * pulse, 0.2 * uI);
}
`;

export const POINTS_VS = /* glsl */ `
layout(location = 0) in vec3 aPos;
layout(location = 2) in vec4 aExtra;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform float uTime;
uniform float uPx;
uniform float uI;
out float vI;
out vec3 vCol;
${PALETTE}
void main() {
#ifdef PARTICLES
  /* Частица: семя → орбита вокруг цветка и подъём снизу вверх по кругу. */
  vec4 s = aExtra;
  float ang = s.x * 6.2832;
  float rad = 0.55 + s.y * 1.9;
  float h = 3.3;
  float y = mod(s.z * h + uTime * (0.1 + 0.12 * s.w), h);
  float life = y / h;
  vec3 p = vec3(cos(ang) * rad + sin(uTime * 0.6 + s.w * 6.0) * 0.07, y - 0.15, sin(ang) * rad * 0.75);
  vI = uI * sin(3.1416 * life) * (0.6 + 0.4 * sin(uTime * (1.5 + s.w * 2.0) + s.x * 20.0));
  vCol = mix(HOT, ICE, s.y * 0.6);
  gl_PointSize = (3.0 + s.w * 6.0) * uPx;
#else
  /* Искра на вершине: позицию и яркость задаёт сцена. */
  vec3 p = aPos;
  vI = aExtra.x * uI;
  vCol = HOT;
  gl_PointSize = (30.0 + 18.0 * aExtra.y) * uPx;
#endif
  gl_Position = uViewProj * (uModel * vec4(p, 1.0));
}
`;

export const POINTS_FS = /* glsl */ `
precision highp float;
${PALETTE}
in float vI;
in vec3 vCol;
out vec4 o;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
#ifdef PARTICLES
  float a = exp(-r2 * 6.0);
  o = vec4(vCol * a * vI * 1.4, 0.0);
#else
  float core = exp(-r2 * 45.0);
  float rays = exp(-abs(p.x) * 40.0) * exp(-abs(p.y) * 3.5) + exp(-abs(p.y) * 40.0) * exp(-abs(p.x) * 3.5);
  float halo = exp(-r2 * 8.0) * 0.35;
  o = vec4((vec3(1.0) * core * 2.2 + vCol * (rays * 1.1 + halo)) * vI, 0.0);
#endif
}
`;

export const SPRITE_VS = /* glsl */ `
layout(location = 0) in vec3 aPos;
uniform mat4 uViewProj;
uniform vec3 uCenter;
uniform vec2 uSize;
uniform vec3 uRight;
uniform vec3 uUp;
out vec2 vP;
void main() {
  vP = aPos.xy;
  vec3 p = uCenter + uRight * aPos.x * uSize.x + uUp * aPos.y * uSize.y;
  gl_Position = uViewProj * vec4(p, 1.0);
}
`;

export const SPRITE_FS = /* glsl */ `
precision highp float;
${PALETTE}
in vec2 vP;
uniform int uKind;
uniform float uI;
out vec4 o;
void main() {
  vec2 p = vP;
  float r2 = dot(p, p);
  float r = sqrt(r2);
  vec3 c;
  if (uKind == 0) {
    /* Ядро: белая точка, тёплый ореол. */
    c = vec3(1.0) * exp(-r2 * 50.0) * 2.0 + HOT * exp(-r2 * 16.0) * 0.6 + GOLD * exp(-r * 3.4) * 1.2;
  } else if (uKind == 1) {
    /* Отблеск на полу под нижней вершиной: вспышка и лучи. */
    float streak = exp(-abs(p.y) * 55.0) * exp(-p.x * p.x * 3.0);
    float rays = exp(-abs(p.x) * 70.0) * exp(-abs(p.y) * 4.5);
    float diag = exp(-abs(p.x - p.y) * 60.0) * exp(-r2 * 9.0) + exp(-abs(p.x + p.y) * 60.0) * exp(-r2 * 9.0);
    c = vec3(1.0) * exp(-r2 * 120.0) * 2.0
      + mix(BLUE200, ICE, 0.5) * streak * 1.1
      + HOT * (rays * 0.9 + diag * 0.35)
      + BLUE300 * exp(-r2 * 7.0) * 0.25;
  } else if (uKind == 2) {
    /* Световое пятно на невидимом полу. */
    c = mix(BLUE300, ICE, exp(-r2 * 6.0)) * exp(-r2 * 2.6) * 0.55 + HOT * exp(-r2 * 30.0) * 0.4;
  } else {
    /* Мягкое сияние, из которого проявляется октаэдр. */
    c = mix(BLUE200, vec3(1.0), exp(-r2 * 6.0)) * exp(-r2 * 5.0) * 0.55;
  }
  float edge = smoothstep(1.0, 0.85, max(abs(p.x), abs(p.y)));
  c *= edge;
  /* Ядро немного кроет фон — тёплый цвет остаётся насыщенным. */
  float cover = uKind == 0 ? exp(-r * 3.6) * 0.45 * edge : 0.0;
  o = vec4(c * uI, cover * min(uI, 1.0));
}
`;

export const FULL_VS = /* glsl */ `
layout(location = 0) in vec3 aPos;
out vec2 vUv;
void main() {
  vUv = aPos.xy * 0.5 + 0.5;
  gl_Position = vec4(aPos.xy, 0.0, 1.0);
}
`;

/** Отбор ярких мест для свечения (мягкий порог). */
export const PREFILTER_FS = /* glsl */ `
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uThreshold;
out vec4 o;
void main() {
  vec3 c = vec3(0.0);
  c += texture(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
  c += texture(uTex, vUv + uTexel * vec2(1.0, -1.0)).rgb;
  c += texture(uTex, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
  c += texture(uTex, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  c *= 0.25;
  float br = max(c.r, max(c.g, c.b));
  float knee = 0.25;
  float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  float k = max(soft, br - uThreshold) / max(br, 1e-4);
  o = vec4(c * k, 1.0);
}
`;

export const DOWN_FS = /* glsl */ `
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
out vec4 o;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 4.0;
  c += texture(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
  c += texture(uTex, vUv + uTexel * vec2(1.0, -1.0)).rgb;
  c += texture(uTex, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
  c += texture(uTex, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  o = vec4(c / 8.0, 1.0);
}
`;

export const UP_FS = /* glsl */ `
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform float uSpread;
out vec4 o;
void main() {
  vec2 d = uTexel * uSpread;
  vec3 c = texture(uTex, vUv).rgb * 4.0;
  c += (texture(uTex, vUv + vec2(-d.x, 0.0)).rgb + texture(uTex, vUv + vec2(d.x, 0.0)).rgb
      + texture(uTex, vUv + vec2(0.0, -d.y)).rgb + texture(uTex, vUv + vec2(0.0, d.y)).rgb) * 2.0;
  c += texture(uTex, vUv - d).rgb + texture(uTex, vUv + d).rgb
     + texture(uTex, vUv + vec2(d.x, -d.y)).rgb + texture(uTex, vUv + vec2(-d.x, d.y)).rgb;
  o = vec4(c / 16.0 + texture(uBase, vUv).rgb, 1.0);
}
`;

/** Сборка кадра: сцена + свечение, мягкое выгорание ярких мест в белое. */
export const COMPOSITE_FS = /* glsl */ `
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomI;
uniform float uFade;
uniform float uStill;
out vec4 o;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float roll(float m) {
  /* До 0,8 — как есть, выше — мягко к единице. */
  return m < 0.8 ? m : 0.8 + 0.2 * (1.0 - exp(-(m - 0.8) / 0.2));
}
void main() {
  vec4 s = texture(uScene, vUv);
  vec3 b = texture(uBloom, vUv).rgb * uBloomI;
  vec3 c = s.rgb + b;
  /* Яркость сжимаем, сохраняя оттенок: золото остаётся золотом, и лишь
     самые яркие точки выгорают в белое. */
  float m = max(c.r, max(c.g, c.b));
  float m2 = roll(m);
  c = c / max(m, 1e-4) * m2;
  c = mix(c, vec3(m2), smoothstep(2.0, 7.0, m) * 0.6);
  float a = clamp(s.a + dot(b, vec3(0.3, 0.5, 0.2)) * 0.35, 0.0, 1.0);
  c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  c = max(c, 0.0);
  /* Для картинки-заглушки: в PNG нет «света без альфы», поэтому
     свечение превращаем в обычное покрытие. */
  if (uStill > 0.5) a = max(a, min(max(c.r, max(c.g, c.b)), 1.0));
  o = vec4(c, a) * uFade;
}
`;

/** Простой вывод без свечения (запасной путь, если нет float-целей). */
export const COPY_FS = /* glsl */ `
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
out vec4 o;
void main() { o = texture(uTex, vUv); }
`;
