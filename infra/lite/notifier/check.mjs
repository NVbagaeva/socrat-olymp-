#!/usr/bin/env node
/**
 * Проверка рассыльщика без базы и без почты (docs/kabinet-uvedomleniya.md,
 * PR 3в): поддельный SMTP-сервер и поддельный PostgREST на 127.0.0.1.
 *
 *   node infra/lite/notifier/check.mjs
 *
 * Письма: тексты всех событий (без «мы», без рода, ученику на «ты»,
 * учителю на «вы»), ссылки совпадают с сайтом, экранирование, тема в
 * UTF-8, «Отписаться» в заголовках, срок в поясе получателя.
 * SMTP: вход, точки в начале строк, 4xx — повтор, 5xx — отказ, обрыв.
 * Цикл: тик → пачка → итоги в базу, в журнал не попадает адрес.
 * «Отписаться»: GET ничего не меняет, POST отписывает, плохая ссылка — 400.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADRESA, pismo, soderzhanie, srok, zagolovok } from './pisma.mjs';
import { otpravit, SmtpError } from './smtp.mjs';
import { bezAdresov, obrabotchik, prohod } from './notifier.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
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

const U = '3f2c1a9e-1111-4222-8333-444455556666';
const HW = '9a8b7c6d-0000-4000-8000-000000000001';
const SAYT = 'https://budetege.ru';
const cfgPisem = { sayt: SAYT, apiDomain: 'api.budetege.ru', from: 'noreply@budetege.ru' };
const baza = (event, extra = {}) => ({
  id: 7,
  channel: 'pochta',
  event,
  to: 'uchenik@example.test',
  role: event === 'dz_sdano' || event === 'dz_ne_sdali' || event === 'digest' ? 'tutor' : 'student',
  tz: 'Europe/Moscow',
  payload: {},
  homework_id: HW,
  title: 'Логарифмы',
  due_at: '2026-11-25T15:00:00Z',
  otpiska: { u: U, t: 'a'.repeat(32) },
  ...extra,
});

const SOBYTIYA = [
  baza('dz_novoe'),
  baza('dz_izmeneno'),
  baza('dz_vozvrat'),
  baza('dz_kommentariy'),
  baza('dz_napominanie', { payload: { za: 24 } }),
  baza('dz_napominanie', { payload: { za: 3 } }),
  baza('dz_srok', { payload: { pozdno: true } }),
  baza('dz_srok', { payload: { pozdno: false } }),
  baza('dz_sdano', { payload: { pozdno: false }, uchenik_name: 'Аня С.' }),
  baza('dz_sdano', { payload: { pozdno: true } }),
  baza('dz_ne_sdali', { payload: { skolko: 3, vsego: 12 } }),
  baza('digest', {
    homework_id: undefined,
    period: 'day',
    svodka: [
      { id: HW, title: 'Логарифмы', vsego: 12, sdali: 9, novyh: 4 },
      { id: 'x2', title: 'Степени', vsego: 5, sdali: 2, novyh: 1, ne_sdali: 3 },
    ],
  }),
  baza('digest', { homework_id: undefined, period: 'week', svodka: [] }),
];

const dekod = (raw) => {
  const chasti = [...raw.matchAll(/Content-Transfer-Encoding: base64\r\n\r\n([A-Za-z0-9+/=\r\n]+?)\r\n--/g)];
  return chasti.map((m) => Buffer.from(m[1].replace(/\r\n/g, ''), 'base64').toString('utf8'));
};

/* ── Письма ─────────────────────────────────────────────────────── */

await ok('адреса совпадают с сайтом', () => {
  const dz2 = fs.readFileSync(path.join(ROOT, 'app/src/lib/dz2/links.ts'), 'utf8');
  const uv = fs.readFileSync(path.join(ROOT, 'app/src/lib/uvedomleniya/links.ts'), 'utf8');
  assert.ok(dz2.includes(`reshat: '${ADRESA.reshat}'`), 'reshat');
  assert.ok(dz2.includes(`itogi: '${ADRESA.itogi}'`), 'itogi');
  assert.ok(dz2.includes(`spisok: '${ADRESA.spisok}'`), 'spisok');
  assert.ok(uv.includes(`nastroyki: '${ADRESA.nastroyki}'`), 'nastroyki');
});

const ROD = /(^|[^а-яё])(сдал|сдала|выдал|выдала|оставил|оставила|изменил|изменила|вернул|вернула|отправил|отправила|получил|получила|прочитал|прочитала|забыл|забыла|успел|успела)([^а-яё]|$)/i;
const MY = /(^|[^а-яё])(мы|нас|нам|наш|наша|наше|наши|нашего|нашей)([^а-яё]|$)/i;

for (const u of SOBYTIYA) {
  const tag = `${u.event} ${JSON.stringify(u.payload)}`;
  await ok(`письмо ${tag}`, () => {
    const p = pismo(u, cfgPisem);
    assert.ok(p, 'письмо собрано');
    const [tekst, html] = dekod(p.raw);
    assert.equal(tekst, p.tekst, 'текст в base64');
    assert.equal(html, p.html, 'HTML в base64');
    const vse = `${p.tema}\n${p.tekst}`;
    assert.doesNotMatch(vse, MY, 'без «мы»');
    assert.doesNotMatch(vse, ROD, 'без рода');
    if (u.event !== 'digest') assert.ok(p.tema.includes('«Логарифмы»'), 'название в кавычках');
    // Ученику — на «ты», учителю — на «вы».
    if (u.role === 'tutor') assert.doesNotMatch(vse, /(^|[^а-яё])(ты|тебе|твой|твоё|проверь|посмотри|сдай)([^а-яё]|$)/i);
    else assert.doesNotMatch(vse, /(^|[^а-яё])(вы|вам|ваш|ваше|проверьте|посмотрите|сдайте)([^а-яё]|$)/i);
    // Ссылка: ученику — в ДЗ, учителю — в итоги, сводка — в список.
    const zhdem =
      u.event === 'digest'
        ? `${SAYT}/kabinet/dz2/`
        : u.role === 'tutor'
          ? `${SAYT}/kabinet/dz2/itogi/?id=${HW}`
          : `${SAYT}/kabinet/domashki/reshat/?id=${HW}`;
    assert.ok(p.tekst.includes(zhdem), `ссылка ${zhdem}`);
    assert.ok(p.html.includes(zhdem), 'ссылка в HTML');
    assert.ok(p.tekst.includes(`${SAYT}/kabinet/uvedomleniya/?vkladka=nastroyki`), 'настройки');
    const otp = `https://api.budetege.ru/otpiska?u=${U}&t=${'a'.repeat(32)}`;
    assert.ok(p.tekst.includes(otp), 'отписка в тексте');
    assert.ok(p.raw.includes(`List-Unsubscribe: <${otp}>`), 'List-Unsubscribe');
    assert.ok(p.raw.includes('List-Unsubscribe-Post: List-Unsubscribe=One-Click'), 'one-click');
    assert.match(p.raw, /^Subject: =\?UTF-8\?B\?/m, 'тема в UTF-8');
    assert.match(p.raw, /^To: <uchenik@example\.test>$/m);
    assert.ok(!p.raw.split('\r\n\r\n')[0].split('\r\n').some((l) => l.length > 998), 'строки заголовков короткие');
  });
}

await ok('тексты событий', () => {
  const t = (u) => soderzhanie(u, SAYT);
  assert.equal(t(SOBYTIYA[0]).tema, 'Новое ДЗ: «Логарифмы»');
  assert.ok(t(SOBYTIYA[0]).abzacy.includes('Срок — 25 ноября, 18:00 (МСК).'));
  assert.equal(t(SOBYTIYA[4]).tema, 'До дедлайна ДЗ «Логарифмы» меньше суток');
  assert.equal(t(SOBYTIYA[5]).tema, 'До дедлайна ДЗ «Логарифмы» меньше 3 часов');
  assert.equal(t(SOBYTIYA[5]).vazhnoe, true);
  assert.match(t(SOBYTIYA[6]).abzacy[0], /с опозданием/);
  assert.match(t(SOBYTIYA[7]).abzacy[0], /приём закрыт/);
  assert.equal(t(SOBYTIYA[8]).tema, 'Аня С.: ДЗ «Логарифмы» сдано');
  assert.equal(t(SOBYTIYA[9]).tema, 'Ученик: ДЗ «Логарифмы» сдано с опозданием');
  assert.equal(t(SOBYTIYA[10]).tema, 'ДЗ «Логарифмы»: не сдали 3 из 12');
  const d = t(SOBYTIYA[11]);
  assert.equal(d.tema, 'Сводка по ДЗ за день');
  assert.equal(d.stroki.length, 2);
  assert.equal(d.stroki[0].tekst, 'сдали 9 из 12, новых сдач — 4');
  assert.equal(d.stroki[1].tekst, 'сдали 2 из 5, новых сдач — 1, после срока не сдали — 3');
  assert.equal(d.stroki[1].vazhnoe, true);
  assert.equal(t(SOBYTIYA[12]).tema, 'Сводка по ДЗ за неделю');
  assert.equal(t(baza('dz_novoe', { title: '' })).tema, 'Новое ДЗ: «Без названия»');
  assert.equal(t(baza('neizvestnoe')), null);
  assert.equal(pismo(baza('neizvestnoe'), cfgPisem), null);
  assert.equal(t(baza('dz_novoe', { due_at: undefined })).abzacy.length, 1, 'без срока — без строки срока');
});

await ok('срок в поясе получателя', () => {
  assert.equal(srok('2026-11-25T15:00:00Z', 'Europe/Moscow'), '25 ноября, 18:00 (МСК)');
  assert.equal(srok('2026-11-25T15:00:00Z', 'Europe/Samara'), '25 ноября, 19:00 (МСК+1)');
  assert.equal(srok('2026-11-25T15:00:00Z', 'Asia/Vladivostok'), '26 ноября, 01:00 (МСК+7)');
  assert.equal(srok('2026-11-25T15:00:00Z', 'Europe/Berlin'), '25 ноября, 16:00 (Europe/Berlin)');
  assert.equal(srok('2026-11-25T15:00:00Z', 'Не/Пояс'), '25 ноября, 18:00 (МСК)');
  assert.equal(srok(null), null);
});

await ok('экранирование и тема', () => {
  const p = pismo(baza('dz_novoe', { title: '<script>alert(1)</script> & "x"' }), cfgPisem);
  assert.ok(!p.html.includes('<script>'), 'тег экранирован');
  assert.ok(p.html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;'));
  const z = zagolovok('Новое ДЗ: «Очень длинное название домашнего задания по логарифмам и степеням»');
  for (const l of z.split('\r\n ')) assert.ok(l.length <= 75, `кусок ${l.length}`);
  const sobrano = z
    .split('\r\n ')
    .map((k) => Buffer.from(k.slice(10, -2), 'base64'))
    .reduce((a, b) => Buffer.concat([a, b]));
  assert.equal(sobrano.toString('utf8'), 'Новое ДЗ: «Очень длинное название домашнего задания по логарифмам и степеням»');
  assert.equal(zagolovok('ASCII only'), 'ASCII only');
  const bez = pismo(baza('dz_novoe', { otpiska: undefined }), cfgPisem);
  assert.ok(!bez.raw.includes('List-Unsubscribe'), 'без подписи — без заголовка');
});

await ok('в журнал — без адресов', () => {
  assert.equal(bezAdresov('550 5.1.1 <uchenik@example.test>: user unknown'), '550 5.1.1 <<адрес>>: user unknown');
  assert.equal(bezAdresov('RCPT TO:a.b+c@mail.ru rejected'), 'RCPT TO:<адрес> rejected');
  assert.equal(bezAdresov('x'.repeat(400)).length, 300);
});

/* ── Поддельный SMTP ────────────────────────────────────────────── */

function smtpServer({ starttls = false } = {}) {
  const pisma = [];
  const komandy = [];
  const otkazy = new Map(); // адрес → ответ на RCPT
  const server = net.createServer((s) => {
    s.write('220 fake ESMTP\r\n');
    let buf = '';
    let data = false;
    let tek = null;
    s.on('data', (ch) => {
      buf += ch.toString('utf8');
      for (;;) {
        if (data) {
          const i = buf.indexOf('\r\n.\r\n');
          if (i < 0) return;
          tek.raw = buf.slice(0, i);
          buf = buf.slice(i + 5);
          data = false;
          pisma.push(tek);
          s.write('250 2.0.0 Ok: queued as ABC\r\n');
          continue;
        }
        const i = buf.indexOf('\r\n');
        if (i < 0) return;
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        komandy.push(line);
        if (line.startsWith('EHLO')) {
          s.write(`250-fake\r\n250-PIPELINING\r\n${starttls ? '250-STARTTLS\r\n' : ''}250 AUTH PLAIN\r\n`);
        } else if (line.startsWith('STARTTLS')) {
          s.write('454 TLS not available\r\n');
        } else if (line.startsWith('AUTH PLAIN')) {
          const [, user, pass] = Buffer.from(line.slice(11), 'base64').toString().split('\0');
          s.write(user === 'noreply@budetege.ru' && pass === 'sekret' ? '235 ok\r\n' : '535 5.7.8 bad auth\r\n');
        } else if (line.startsWith('MAIL FROM:')) {
          tek = { from: line.slice(11, -1) };
          s.write('250 ok\r\n');
        } else if (line.startsWith('RCPT TO:')) {
          tek.to = line.slice(9, -1);
          const o = otkazy.get(tek.to);
          if (o === 'obryv') {
            s.destroy();
            return;
          }
          s.write(o ?? '250 ok\r\n');
        } else if (line === 'DATA') {
          data = true;
          s.write('354 go\r\n');
        } else if (line === 'QUIT') {
          s.end('221 bye\r\n');
        } else {
          s.write('500 what\r\n');
        }
      }
    });
    s.on('error', () => {});
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port, pisma, komandy, otkazy })),
  );
}

const fs1 = await smtpServer();
const smtpCfg = { host: '127.0.0.1', port: fs1.port, user: 'noreply@budetege.ru', pass: 'sekret', timeoutMs: 5000 };

await ok('SMTP: письмо доходит, вход PLAIN, точки удваиваются', async () => {
  const otv = await otpravit(smtpCfg, {
    from: 'noreply@budetege.ru',
    to: 'a@example.test',
    raw: 'Subject: t\r\n\r\nстрока\r\n.точка в начале\r\nконец',
  });
  assert.match(otv, /^250 /);
  const p = fs1.pisma.at(-1);
  assert.equal(p.from, 'noreply@budetege.ru');
  assert.equal(p.to, 'a@example.test');
  assert.ok(p.raw.includes('\r\n..точка в начале\r\n'));
  assert.ok(fs1.komandy.some((k) => k.startsWith('AUTH PLAIN')));
});

await ok('SMTP: без входа (Mailpit)', async () => {
  const do_ = fs1.komandy.length;
  await otpravit({ ...smtpCfg, bezVhoda: true }, { from: 'f@x.test', to: 'b@example.test', raw: 'Subject: t\r\n\r\nx' });
  assert.ok(!fs1.komandy.slice(do_).some((k) => k.startsWith('AUTH')));
});

await ok('SMTP: 4xx — временная, 5xx — постоянная, обрыв — временная', async () => {
  fs1.otkazy.set('vremenno@example.test', '450 4.2.1 mailbox busy\r\n');
  fs1.otkazy.set('net@example.test', '550 5.1.1 <net@example.test> user unknown\r\n');
  fs1.otkazy.set('obryv@example.test', 'obryv');
  const lovim = async (to) => {
    try {
      await otpravit(smtpCfg, { from: 'f@x.test', to, raw: 'x' });
    } catch (e) {
      return e;
    }
    throw new Error('ждали ошибку');
  };
  const e1 = await lovim('vremenno@example.test');
  assert.ok(e1 instanceof SmtpError && e1.code === 450 && e1.vremennaya);
  const e2 = await lovim('net@example.test');
  assert.ok(e2 instanceof SmtpError && e2.code === 550 && !e2.vremennaya);
  const e3 = await lovim('obryv@example.test');
  assert.ok(e3 instanceof SmtpError && e3.code === 0 && e3.vremennaya);
  const e4 = await otpravit({ ...smtpCfg, pass: 'nevernyy' }, { from: 'f@x.test', to: 'a@x.test', raw: 'x' }).catch((e) => e);
  assert.ok(e4 instanceof SmtpError && e4.code === 535);
  assert.ok(!e4.message.includes('nevernyy') && !e4.message.includes(Buffer.from('\0noreply@budetege.ru\0nevernyy').toString('base64')), 'пароль не в ошибке');
  const e5 = await otpravit({ ...smtpCfg, port: 1 }, { from: 'f@x.test', to: 'a@x.test', raw: 'x' }).catch((e) => e);
  assert.ok(e5 instanceof SmtpError && e5.vremennaya, 'нет связи — повтор');
});

await ok('SMTP: STARTTLS предложен, но не вышел — ошибка, письмо не уходит открыто', async () => {
  const fs2 = await smtpServer({ starttls: true });
  const e = await otpravit({ ...smtpCfg, port: fs2.port }, { from: 'f@x.test', to: 'a@x.test', raw: 'x' }).catch((x) => x);
  assert.ok(e instanceof SmtpError && e.code === 454);
  assert.equal(fs2.pisma.length, 0);
  fs2.server.close();
});

/* ── Поддельный PostgREST ───────────────────────────────────────── */

function restServer() {
  const vyzovy = [];
  const st = { ochered: [], itogi: [], otpiski: [], klyuch: 'service-key' };
  const server = http.createServer(async (req, res) => {
    let telo = '';
    for await (const ch of req) telo += ch;
    const args = telo === '' ? {} : JSON.parse(telo);
    const imya = req.url.replace('/rpc/', '');
    vyzovy.push({ imya, args, auth: req.headers.authorization });
    const json = (kod, x) => {
      res.writeHead(kod, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(x));
    };
    if (req.headers.authorization !== `Bearer ${st.klyuch}`) return json(401, { message: 'JWT' });
    if (imya === 'notify_tick_pochta') return json(200, { napominaniya: 0, svodki: 1 });
    if (imya === 'notify_zabrat') return json(200, st.ochered.splice(0, args.p_limit));
    if (imya === 'notify_itog') {
      st.itogi.push(args);
      return json(200, args.p_rezultat === 'sent' ? 'sent' : args.p_rezultat === 'povtor' ? 'wait' : 'failed');
    }
    if (imya === 'notify_otpiska') {
      if (args.p_t !== 'b'.repeat(32)) return json(400, { code: '23514', message: 'bad_link' });
      st.otpiski.push(args);
      return json(200, true);
    }
    return json(404, { message: 'нет функции' });
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port, vyzovy, st })),
  );
}

const rs = await restServer();
const cfg = {
  rest: `http://127.0.0.1:${rs.port}`,
  klyuch: 'service-key',
  sayt: SAYT,
  apiDomain: 'api.budetege.ru',
  from: 'noreply@budetege.ru',
  smtp: smtpCfg,
  intervalMs: 60000,
  pauzaMs: 0,
  pachka: 2,
};

await ok('проход: тик, пачки, итоги', async () => {
  const do_ = fs1.pisma.length;
  rs.st.ochered.push(
    { ...baza('dz_novoe'), id: 1, to: 'u1@example.test' },
    { ...baza('dz_napominanie', { payload: { za: 3 } }), id: 2, to: 'vremenno@example.test' },
    { ...baza('dz_srok', { payload: {} }), id: 3, to: 'net@example.test' },
    { ...baza('dz_sdano', { payload: {} }), id: 4, to: 'u4@example.test' },
    { ...baza('neizvestnoe'), id: 5, to: 'u5@example.test' },
  );
  const it = await prohod(cfg);
  assert.deepEqual(
    { sent: it.sent, povtor: it.povtor, failed: it.failed },
    { sent: 2, povtor: 1, failed: 2 },
  );
  assert.equal(rs.vyzovy[0].imya, 'notify_tick_pochta');
  assert.equal(rs.vyzovy.filter((v) => v.imya === 'notify_zabrat').length, 3, 'пачки по 2: 2+2+1');
  const itogi = Object.fromEntries(rs.st.itogi.map((x) => [x.p_id, x.p_rezultat]));
  assert.deepEqual(itogi, { 1: 'sent', 2: 'povtor', 3: 'failed', 4: 'sent', 5: 'failed' });
  for (const x of rs.st.itogi) assert.ok(!/@/.test(x.p_detail ?? ''), `без адреса: ${x.p_detail}`);
  assert.equal(fs1.pisma.length - do_, 2);
  assert.ok(rs.vyzovy.every((v) => v.auth === 'Bearer service-key'));
});

await ok('проход без почты: только тик', async () => {
  const do_ = rs.vyzovy.length;
  rs.st.ochered.push({ ...baza('dz_novoe'), id: 9 });
  const it = await prohod({ ...cfg, smtp: { ...smtpCfg, pass: '', bezVhoda: false } });
  assert.equal(it.sent, 0);
  assert.deepEqual(rs.vyzovy.slice(do_).map((v) => v.imya), ['notify_tick_pochta']);
  rs.st.ochered.length = 0;
});

await ok('проход: база не ответила — ошибка наружу', async () => {
  await assert.rejects(prohod({ ...cfg, klyuch: 'chuzhoy' }), /notify_tick_pochta: 401/);
});

/* ── «Отписаться» ──────────────────────────────────────────────── */

const sost = { posledniyUspeh: Date.now() };
const hs = http.createServer(obrabotchik(cfg, sost));
await new Promise((r) => hs.listen(0, '127.0.0.1', r));
const H = `http://127.0.0.1:${hs.address().port}`;

await ok('отписка: GET — страница с кнопкой, ничего не меняет', async () => {
  const r = await fetch(`${H}/otpiska?u=${U}&t=${'b'.repeat(32)}`);
  assert.equal(r.status, 200);
  const t = await r.text();
  assert.ok(t.includes('<form method="post"'));
  assert.ok(t.includes('Отписаться'));
  assert.ok(t.includes('name="viewport"'));
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(rs.st.otpiski.length, 0);
});

await ok('отписка: POST в один клик', async () => {
  const r = await fetch(`${H}/otpiska?u=${U}&t=${'b'.repeat(32)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'List-Unsubscribe=One-Click',
  });
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Письма выключены/);
  assert.deepEqual(rs.st.otpiski, [{ p_user: U, p_t: 'b'.repeat(32) }]);
});

await ok('отписка: чужая подпись и кривые ссылки — 400', async () => {
  const r1 = await fetch(`${H}/otpiska?u=${U}&t=${'c'.repeat(32)}`, { method: 'POST' });
  assert.equal(r1.status, 400);
  assert.match(await r1.text(), /Ссылка не подошла/);
  for (const q of ['', `?u=${U}`, `?u=x&t=${'b'.repeat(32)}`, `?u=${U}&t=<script>`]) {
    const r = await fetch(`${H}/otpiska${q}`);
    assert.equal(r.status, 400, q);
    assert.ok(!(await r.text()).includes('<script>'));
  }
  assert.equal(rs.st.otpiski.length, 1);
  assert.equal((await fetch(`${H}/otpiska?u=${U}&t=${'b'.repeat(32)}`, { method: 'DELETE' })).status, 405);
  assert.equal((await fetch(`${H}/drugoe`)).status, 404);
});

await ok('здоровье', async () => {
  assert.equal((await fetch(`${H}/health`)).status, 200);
  sost.posledniyUspeh = Date.now() - 10 * 60000;
  assert.equal((await fetch(`${H}/health`)).status, 503);
});

hs.close();
rs.server.close();
fs1.server.close();

if (process.exitCode) {
  console.error('Рассыльщик: есть ошибки.');
} else {
  console.log(`Рассыльщик: все проверки прошли (${n}).`);
}
