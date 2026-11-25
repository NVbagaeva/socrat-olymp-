#!/usr/bin/env node
/* scripts/check-zhurnal-pokaz.mjs — условие из записи журнала в экране учителя.

   Запуск: pnpm test:zhurnal-pokaz (сборка не нужна, нужен Chromium Playwright).

   Условие задачи (uslovie_tex) в журнал присылает браузер ученика, а
   учитель видит его в «Прогрессе» (components/progressUchitel/
   ProgressZadacha.tsx, вставка HTML). lib/zhurnal/pokaz.ts обязан
   пропускать его через sanitizeHtml (lib/dz/sanitize.ts):
     • формула KaTeX (HTML и MathML) и обычный текст доходят как были;
     • <script>, <img>, <iframe>, <a>, <style>, обработчики on…=,
       javascript: и url() в стилях — вырезаются.
   Сама очистка не должна ничего выполнять: разбор идёт в документе без
   окна (onerror у <img> в обычном документе сработал бы ещё до чистки).
   Модули переводятся TypeScript'ом и выполняются в настоящем Chromium:
   sanitizeHtml работает с DOM браузера. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
const katex = require('katex');

const cjs = (rel) =>
  ts.transpileModule(fs.readFileSync(path.join(APP, 'src', rel), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

/* Мини-require в странице: pokaz.ts тянет sanitize и model (model нужен
   только №8 — здесь заглушка). */
const bundle = `
window.__mods = {};
function __def(name, code) { window.__mods[name] = code; }
function __req(name) {
  const m = window.__mods[name];
  if (typeof m !== 'string') return m;
  const module = { exports: {} };
  new Function('exports', 'require', 'module', m)(module.exports, __req, module);
  window.__mods[name] = module.exports;
  return module.exports;
}
__def('@/lib/dz/sanitize', ${JSON.stringify(cjs('lib/dz/sanitize.ts'))});
window.__mods['./model'] = { otpechatokUsloviya: () => '' };
window.__mods['./api'] = {};
__def('pokaz', ${JSON.stringify(cjs('lib/zhurnal/pokaz.ts'))});
`;

const formula = katex.renderToString('\\frac{1}{2}+\\sqrt{x}', { throwOnError: false });
const CASES = [
  { what: 'формула KaTeX', html: `Найдите ${formula}.`, keep: ['class="katex"', '<math', 'Найдите'] },
  { what: 'простой текст', html: 'Вычислите 2 + 2.', keep: ['Вычислите 2 + 2.'] },
  { what: 'script', html: '<b>ok</b><script>window.__plokho=1</script>', keep: ['<b>ok</b>'], drop: ['<script'] },
  { what: 'img onerror', html: '<img src=x onerror="window.__plokho=1">текст', keep: ['текст'], drop: ['<img', 'onerror'] },
  { what: 'обработчик на разрешённом теге', html: '<span onclick="window.__plokho=1" class="k">т</span>', keep: ['class="k"'], drop: ['onclick'] },
  { what: 'svg onload', html: '<svg onload="window.__plokho=1"><path d="M0 0"></path></svg>', keep: ['<path'], drop: ['onload'] },
  { what: 'iframe и ссылка javascript:', html: '<iframe src="javascript:1"></iframe><a href="javascript:1">x</a>', drop: ['<iframe', 'javascript:', '<a '] },
  { what: 'url() в стиле', html: '<span style="background:url(https://example.invalid/t.png)">т</span>', drop: ['url('] },
  { what: 'style и link', html: '<style>*{}</style><link rel="stylesheet" href="https://example.invalid/x.css">т', drop: ['<style', '<link'] },
];

let checks = 0;
const failures = [];
const check = (ok, what) => {
  checks += 1;
  if (!ok) failures.push(what);
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><meta charset="utf-8"><div id="v"></div>');
  await page.addScriptTag({ content: bundle });
  for (const c of CASES) {
    const res = await page.evaluate(async (html) => {
      const { pokazatZadachu } = window.__req('pokaz');
      const p = await pokazatZadachu({ task_no: 5, place: 'trenazher', task_ref: 'p:1', uslovie_tex: html });
      /* Как ProgressZadacha: вставка в страницу. */
      document.getElementById('v').innerHTML = p.uslovieHtml ?? '';
      await new Promise((r) => setTimeout(r, 50));
      return { out: p.uslovieHtml ?? '', plokho: window.__plokho === 1 };
    }, c.html);
    for (const k of c.keep ?? []) check(res.out.includes(k), `${c.what}: пропало «${k}»`);
    for (const d of c.drop ?? []) check(!res.out.toLowerCase().includes(d), `${c.what}: осталось «${d}»`);
    check(!res.plokho, `${c.what}: вставка выполнила код`);
  }
  const pusto = await page.evaluate(async () => {
    const { pokazatZadachu } = window.__req('pokaz');
    return (await pokazatZadachu({ task_no: 5, place: 'trenazher', task_ref: 'p:1' })).uslovieHtml;
  });
  check(pusto === null, 'без условия в записи — null (показывается заглушка)');
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`Условие из журнала: ${failures.length} из ${checks} проверок не прошли`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`Условие из журнала в экране учителя: все ${checks} проверок прошли.`);
