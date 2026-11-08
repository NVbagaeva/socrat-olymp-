#!/usr/bin/env node
/* scripts/check-kotik.mjs — 3D-котик тренажёра окружности (№14).

   Запуск: pnpm test:kotik

   Проверяется:
     — public/models/kotik.glb совпадает с тем, что собирает
       scripts/build-kotik.mjs (модель не правили руками и не забыли
       пересобрать);
     — модель не тяжелее 2 МБ;
     — в модели есть все части (голова, уши, глаза, веки, нос, рот,
       усы, тело, манишка, лапы, хвост), кости позвоночника, шеи,
       головы и пяти костей хвоста, морф век и атрибут меха _MEKH. */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GLB = path.join(APP, 'public/models/kotik.glb');
const problems = [];
const ok = (c, s) => {
  if (!c) problems.push(s);
};

const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kotik-')), 'kotik.glb');
execFileSync(process.execPath, [path.join(APP, 'scripts/build-kotik.mjs'), tmp], { stdio: 'pipe' });
const svezhii = fs.readFileSync(tmp);
const lezhit = fs.readFileSync(GLB);
ok(
  Buffer.compare(svezhii, lezhit) === 0,
  'kotik.glb не совпадает со сборкой: node scripts/build-kotik.mjs',
);
ok(
  lezhit.length <= 2 * 1024 * 1024,
  `kotik.glb тяжелее 2 МБ: ${(lezhit.length / 1024).toFixed(0)} КБ`,
);

const dlinaJson = lezhit.readUInt32LE(12);
const gltf = JSON.parse(lezhit.subarray(20, 20 + dlinaJson).toString('utf8'));
const uzly = new Set(gltf.nodes.map((n) => n.name));
for (const chast of [
  'golova',
  'ushi',
  'glazL',
  'glazP',
  'vekoL',
  'vekoP',
  'nos',
  'rot',
  'usy',
  'telo',
  'manishka',
  'lapy',
  'hvost',
]) {
  ok(uzly.has(chast), `в модели нет части «${chast}»`);
}
for (const kost of [
  'k_taz',
  'k_pozvonochnik',
  'k_grud',
  'k_sheya',
  'k_golova',
  'k_hvost1',
  'k_hvost5',
]) {
  ok(uzly.has(kost), `в модели нет кости «${kost}»`);
}
ok(gltf.skins?.length >= 1, 'в модели нет скелета');
const meshi = gltf.meshes.map((m) => m.primitives[0]);
ok(
  meshi.some((p) => p.targets?.length),
  'нет морфа век',
);
ok(
  meshi.filter((p) => '_MEKH' in p.attributes).length >= 5,
  'атрибут меха _MEKH есть не у всех пушистых частей',
);

if (problems.length) {
  console.error(`check-kotik: ${problems.length} проблем:`);
  for (const p of problems) console.error(`  — ${p}`);
  process.exit(1);
}
console.log(`check-kotik: ok, модель ${(lezhit.length / 1024).toFixed(0)} КБ, узлов ${uzly.size}.`);
