#!/usr/bin/env node
/**
 * Проверка сервиса оплаты без базы и без Robokassa
 * (docs/oplata-robokassa.md): поддельный PostgREST на 127.0.0.1.
 *
 *   node infra/lite/oplata/check.mjs
 *
 * Подпись ссылки — по образцу из документации Robokassa (MD5 и SHA256,
 * с чеком и без), подпись Result URL с Shp_* по алфавиту, неверная
 * подпись и чужая сумма отклоняются, повтор уведомления — снова OK,
 * JWT человека уходит в базу как есть, без JWT заказа нет, ошибки базы
 * доходят до сайта кодом, а не текстом, пароли не попадают в журнал.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { chek, hesh, nastroyki, obrabotchik, podpisResult, podpisSovpala, ssylka, vklyuchena } from './oplata.mjs';

let n = 0;
const ok = (name, fn) =>
  Promise.resolve()
    .then(fn)
    .then(
      () => {
        n += 1;
      },
      (e) => {
        console.error(`✗ ${name}\n  ${e.stack ?? e}`);
        process.exitCode = 1;
      },
    );

const md5 = (s) => crypto.createHash('md5').update(s, 'utf8').digest('hex');
const ENV = {
  ROBOKASSA_LOGIN: 'budetege',
  ROBOKASSA_PASS1: 'parol-odin',
  ROBOKASSA_PASS2: 'parol-dva',
  SERVICE_ROLE_KEY: 'service.key.x',
};
const JWT = 'Bearer aaa.bbb.ccc';
const zakaz = { inv_id: 1001, summa: '390.00', opisanie: 'Будет на ЕГЭ: тариф «Ученик», 30 дней', email: 's1@x.ru' };

/* ── Подписи ───────────────────────────────────────────────────── */

await ok('настройки: без паролей оплата выключена, неизвестный хеш — ошибка', () => {
  assert.equal(vklyuchena(nastroyki({})), false);
  assert.equal(vklyuchena(nastroyki(ENV)), true);
  assert.equal(nastroyki(ENV).hesh, 'md5');
  assert.equal(nastroyki({ ROBOKASSA_HASH: 'SHA256' }).hesh, 'sha256');
  assert.throws(() => nastroyki({ ROBOKASSA_HASH: 'crc32' }), /ROBOKASSA_HASH/);
});

await ok('ссылка: MerchantLogin:OutSum:InvId:Пароль1, тестовый режим, почта', () => {
  const u = new URL(ssylka(nastroyki({ ...ENV, ROBOKASSA_TEST: '1' }), zakaz));
  assert.equal(u.origin + u.pathname, 'https://auth.robokassa.ru/Merchant/Index.aspx');
  const p = u.searchParams;
  assert.equal(p.get('MerchantLogin'), 'budetege');
  assert.equal(p.get('OutSum'), '390.00');
  assert.equal(p.get('InvId'), '1001');
  assert.equal(p.get('Description'), zakaz.opisanie);
  assert.equal(p.get('SignatureValue'), md5('budetege:390.00:1001:parol-odin'));
  assert.equal(p.get('IsTest'), '1');
  assert.equal(p.get('Email'), 's1@x.ru');
  assert.equal(p.get('Receipt'), null);
  assert.equal(new URL(ssylka(nastroyki(ENV), zakaz)).searchParams.get('IsTest'), null, 'IsTest в боевом');
});

await ok('ссылка с чеком: Receipt в подписи закодирован один раз, в адресе — дважды', () => {
  const cfg = nastroyki({ ...ENV, ROBOKASSA_RECEIPT: '1', ROBOKASSA_HASH: 'sha256' });
  const adres = ssylka(cfg, zakaz);
  const r = chek(zakaz);
  const json = JSON.parse(decodeURIComponent(r));
  assert.deepEqual(json.items[0], {
    name: zakaz.opisanie,
    quantity: 1,
    sum: 390,
    payment_method: 'full_payment',
    payment_object: 'service',
    tax: 'none',
  });
  const p = new URL(adres).searchParams;
  assert.equal(p.get('Receipt'), r, 'после одного декодирования адреса — строка из подписи');
  assert.ok(adres.includes(`Receipt=${encodeURIComponent(r)}`), 'в адресе — двойное кодирование');
  assert.equal(
    p.get('SignatureValue'),
    crypto.createHash('sha256').update(`budetege:390.00:1001:${r}:parol-odin`).digest('hex'),
  );
});

await ok('Result URL: OutSum:InvId:Пароль2 и Shp_* по алфавиту, регистр не важен', () => {
  const cfg = nastroyki(ENV);
  const p = new URLSearchParams({ OutSum: '390.000000', InvId: '1001' });
  assert.equal(podpisResult(cfg, p), md5('390.000000:1001:parol-dva'));
  p.set('Shp_z', '2');
  p.set('shp_a', '1');
  assert.equal(podpisResult(cfg, p), md5('390.000000:1001:parol-dva:shp_a=1:Shp_z=2'));
  assert.ok(podpisSovpala('ABCDEF', 'abcdef'));
  assert.ok(!podpisSovpala('', ''));
  assert.ok(!podpisSovpala('abc', 'abcd'));
  assert.equal(hesh('md5', 'x'), md5('x'));
});

/* ── Сервис целиком: поддельный PostgREST ──────────────────────── */

function poddelnayaBaza() {
  const vyzovy = [];
  const oplacheno = new Set();
  const server = http.createServer(async (req, res) => {
    let t = '';
    for await (const ch of req) t += ch;
    const args = JSON.parse(t || '{}');
    vyzovy.push({ path: req.url, auth: req.headers.authorization, args });
    const json = (kod, v) => {
      res.writeHead(kod, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(v));
    };
    if (req.url === '/rpc/oplata_sozdat') {
      if (req.headers.authorization === 'Bearer pro.sro.chen') return json(401, { message: 'JWT expired' });
      if (args.p_oferta !== true) return json(400, { message: 'oferta: нужно принять условия оферты' });
      if (args.p_tarif !== 'uchenik') return json(400, { message: 'wrong_tarif: этот тариф не для вашей роли' });
      return json(200, zakaz);
    }
    if (req.url === '/rpc/oplata_zachest') {
      if (req.headers.authorization !== 'Bearer service.key.x') return json(401, { message: 'нет прав' });
      if (args.p_inv_id === 5555) return json(500, { message: 'база легла' });
      if (args.p_inv_id !== 1001) return json(400, { message: `net_zakaza: заказа ${args.p_inv_id} нет` });
      if (args.p_summa !== 390) return json(400, { message: 'summa: не та сумма' });
      const uzhe = oplacheno.has(1001);
      oplacheno.add(1001);
      return json(200, { itog: uzhe ? 'uzhe' : 'oplachen' });
    }
    json(404, { message: 'нет функции' });
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, vyzovy, port: server.address().port })));
}

const baza = await poddelnayaBaza();
const zhurnal = [];
const prezhniyLog = console.log;
console.log = (...a) => zhurnal.push(a.join(' '));
const cfg = nastroyki({ ...ENV, REST_URL: `http://127.0.0.1:${baza.port}` });
const servis = http.createServer(obrabotchik(cfg));
await new Promise((r) => servis.listen(0, '127.0.0.1', r));
const ADRES = `http://127.0.0.1:${servis.address().port}`;

const post = (path, body, headers = {}) =>
  fetch(`${ADRES}${path}`, { method: 'POST', body, headers }).then(async (r) => ({
    status: r.status,
    text: await r.text(),
  }));
const sozdat = (body, auth = JWT) =>
  post('/oplata/sozdat', JSON.stringify(body), { Authorization: auth, 'Content-Type': 'application/json' });
const result = (OutSum, InvId, podpis, extra = {}) => {
  const p = new URLSearchParams({ OutSum, InvId, ...extra });
  p.set('SignatureValue', podpis ?? podpisResult(cfg, p));
  return post('/oplata/result', p.toString(), { 'Content-Type': 'application/x-www-form-urlencoded' });
};

await ok('заказ: JWT человека уходит в базу, ответ — ссылка Robokassa', async () => {
  const r = await sozdat({ tarif: 'uchenik', srok: 'd30', oferta: true });
  assert.equal(r.status, 200, r.text);
  const j = JSON.parse(r.text);
  assert.equal(new URL(j.url).searchParams.get('SignatureValue'), md5('budetege:390.00:1001:parol-odin'));
  const v = baza.vyzovy.at(-1);
  assert.equal(v.auth, JWT, 'заказ заведён не от имени человека');
  assert.deepEqual(v.args, { p_tarif: 'uchenik', p_srok: 'd30', p_oferta: true });
});

await ok('заказ: без входа, просроченный вход, без оферты, чужой тариф', async () => {
  assert.equal((await sozdat({ tarif: 'uchenik', srok: 'd30', oferta: true }, '')).status, 401);
  assert.equal((await sozdat({ tarif: 'uchenik', srok: 'd30', oferta: true }, 'Bearer pro.sro.chen')).status, 401);
  const bez = await sozdat({ tarif: 'uchenik', srok: 'd30', oferta: 'да' });
  assert.equal(bez.status, 400);
  assert.deepEqual(JSON.parse(bez.text), { error: 'oferta' });
  assert.deepEqual(JSON.parse((await sozdat({ tarif: 'repetitor', srok: 'd30', oferta: true })).text), {
    error: 'wrong_tarif',
  });
  const krivoy = await post('/oplata/sozdat', '{', { Authorization: JWT });
  assert.equal(krivoy.status, 400);
  assert.equal((await fetch(`${ADRES}/oplata/sozdat`)).status, 405);
});

await ok('Result URL: верная подпись — OK<InvId>, повтор — снова OK', async () => {
  const r = await result('390.000000', '1001');
  assert.equal(r.status, 200);
  assert.equal(r.text, 'OK1001');
  const v = baza.vyzovy.at(-1);
  assert.equal(v.auth, 'Bearer service.key.x');
  assert.deepEqual(v.args, { p_inv_id: 1001, p_summa: 390 });
  const povtor = await result('390.000000', '1001');
  assert.equal(povtor.text, 'OK1001');
});

await ok('Result URL: GET тоже принимается, подпись в верхнем регистре', async () => {
  const p = new URLSearchParams({ OutSum: '390.00', InvId: '1001' });
  p.set('SignatureValue', podpisResult(cfg, p).toUpperCase());
  const r = await fetch(`${ADRES}/oplata/result?${p}`);
  assert.equal(await r.text(), 'OK1001');
});

await ok('Result URL: чужая подпись, Пароль №1 вместо №2, подмена суммы — отказ без вызова базы', async () => {
  const do_ = baza.vyzovy.length;
  assert.equal((await result('390.00', '1001', 'deadbeef')).text, 'bad sign');
  assert.equal((await result('390.00', '1001', md5('390.00:1001:parol-odin'))).text, 'bad sign');
  const p = new URLSearchParams({ OutSum: '390.00', InvId: '1001' });
  const podpis = podpisResult(cfg, p);
  assert.equal((await result('1.00', '1001', podpis)).text, 'bad sign');
  assert.equal((await result('390.00', '1001', undefined, { Shp_x: '1' })).text, 'OK1001', 'Shp_* в подписи');
  assert.equal((await result('abc', '1001', 'x')).status, 400);
  assert.equal((await result('390', '-1', 'x')).status, 400);
  assert.equal(baza.vyzovy.length, do_ + 1, 'база вызвана на неверной подписи');
});

await ok('Result URL: сумма не совпала с заказом, нет заказа — 400; база легла — 503', async () => {
  const s = await result('100.00', '1001');
  assert.equal(s.status, 400);
  assert.equal(s.text, 'summa');
  assert.equal((await result('390.00', '7777')).text, 'net_zakaza');
  assert.equal((await result('390.00', '5555')).status, 503);
});

await ok('без настроек Robokassa заказов нет, уведомления не принимаются', async () => {
  const pusto = http.createServer(obrabotchik(nastroyki({ REST_URL: cfg.rest })));
  await new Promise((r) => pusto.listen(0, '127.0.0.1', r));
  const a = `http://127.0.0.1:${pusto.address().port}`;
  const z = await fetch(`${a}/oplata/sozdat`, { method: 'POST', headers: { Authorization: JWT }, body: '{}' });
  assert.equal(z.status, 503);
  assert.deepEqual(await z.json(), { error: 'oplata_vyklyuchena' });
  assert.equal((await fetch(`${a}/oplata/result`, { method: 'POST', body: 'OutSum=1&InvId=1' })).status, 503);
  assert.equal(await (await fetch(`${a}/health`)).text(), 'ok');
  await new Promise((r) => pusto.close(r));
});

await ok('большое тело — 413, неизвестный адрес — 404', async () => {
  const r = await post('/oplata/sozdat', 'x'.repeat(20000), { Authorization: JWT });
  assert.equal(r.status, 413);
  assert.equal((await fetch(`${ADRES}/oplata/nechto`)).status, 404);
});

await ok('в журнале нет паролей, ключа и JWT', () => {
  const vse = zhurnal.join('\n');
  for (const s of ['parol-odin', 'parol-dva', 'service.key.x', 'aaa.bbb.ccc', 's1@x.ru']) {
    assert.ok(!vse.includes(s), `в журнале: ${s}`);
  }
  assert.ok(/заказ 1001/.test(vse) && /оплата заказа 1001: oplachen/.test(vse), vse);
});

console.log = prezhniyLog;
await new Promise((r) => servis.close(r));
await new Promise((r) => baza.server.close(r));
console.log(process.exitCode ? `Сервис оплаты: есть ошибки (прошло ${n})` : `Сервис оплаты: все ${n} проверок прошли`);
