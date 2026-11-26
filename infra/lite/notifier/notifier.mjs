/**
 * Рассыльщик уведомлений (docs/kabinet-uvedomleniya.md, PR 3в). Контейнер
 * `notifier` в compose.yml, Node без зависимостей.
 *
 * Раз в минуту:
 *   1. rpc notify_tick_pochta — напоминания, «срок», «не сдали», сводки
 *      учителям (колокольчик пишется всегда, даже без почты);
 *   2. rpc notify_zabrat — пачка писем к отправке (база ещё раз
 *      проверяет, нужно ли письмо: настройки, сдано ли ДЗ);
 *   3. каждое письмо — через SMTP, итог — rpc notify_itog: sent; povtor
 *      (4xx, обрыв связи) — повтор через 1, 5, 30 мин, 2 ч; failed (5xx);
 *   4. push (PR 3г): rpc notify_zabrat_push, каждой подписке — web push
 *      (webpush.mjs), ответ сервиса — push_rezultat, итог — notify_itog.
 *      Ключи VAPID создаются при первом проходе и хранятся в базе.
 *
 * Порт 8090 (только внутри сети, снаружи — через Caddy):
 *   GET  /otpiska?u=&t= — страница с кнопкой «Отписаться»;
 *   POST /otpiska?u=&t= — отписка (кнопка и «в один клик» из почтовика,
 *        RFC 8058); подпись t проверяет база (notify_otpiska);
 *   GET  /roditel?t= — страница «Даю согласие» для родителя ученика младше 18;
 *   POST /roditel?t= — согласие (confirm_parent_consent), IP — из X-Forwarded-For;
 *   GET  /health — жив ли цикл.
 *
 * Письма родителям (roditel_zabrat → SMTP → roditel_itog при сбое) — тем
 * же проходом, что и уведомления.
 *
 * В базу — ключом service_role через PostgREST внутри сети (rest:3000).
 */

import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { otpravit, SmtpError } from './smtp.mjs';
import { ekran, pismo, pismoRoditelyu, DOKUMENTY, SAYT, ADRESA } from './pisma.mjs';
import { otpravitPush, vapidKlyuchi } from './webpush.mjs';

export function nastroyki(env = process.env) {
  const port = Number(env.SMTP_PORT || 465);
  return {
    rest: (env.REST_URL || 'http://rest:3000').replace(/\/$/, ''),
    klyuch: env.SERVICE_ROLE_KEY || '',
    sayt: (env.SITE_ORIGIN || 'https://budetege.ru').replace(/\/$/, ''),
    apiDomain: env.API_DOMAIN || 'api.budetege.ru',
    from: env.SMTP_FROM || env.SMTP_USER || 'noreply@budetege.ru',
    smtp: {
      host: env.SMTP_HOST || 'smtp.yandex.ru',
      port,
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
      bezVhoda: env.MAIL_NO_AUTH === '1',
      tlsStrogo: env.SMTP_TLS_INSECURE !== '1',
    },
    intervalMs: Number(env.NOTIFIER_INTERVAL_MS || 60000),
    pauzaMs: Number(env.NOTIFIER_PAUZA_MS || 1000),
    pachka: Number(env.NOTIFIER_PACHKA || 20),
    httpPort: Number(env.NOTIFIER_PORT || 8090),
  };
}

/** Почта настроена: есть пароль или вход не нужен (Mailpit). */
export const pochtaEst = (cfg) => cfg.smtp.bezVhoda || (cfg.smtp.user !== '' && cfg.smtp.pass !== '');

const log = (...a) => console.log(new Date().toISOString(), ...a);

/** Адреса почты в ответе SMTP не пишем в журнал (данных — минимум). */
export const bezAdresov = (s) => String(s ?? '').replace(/[^\s<>()"',;:]+@[^\s<>()"',;:]+/g, '<адрес>').slice(0, 300);

export async function rpc(cfg, imya, args = {}) {
  const r = await fetch(`${cfg.rest}/rpc/${imya}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.klyuch}`,
      apikey: cfg.klyuch,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(30000),
  });
  const tekst = await r.text();
  let dannye = null;
  try {
    dannye = tekst === '' ? null : JSON.parse(tekst);
  } catch {
    dannye = tekst;
  }
  if (!r.ok) {
    const e = new Error(`${imya}: ${r.status} ${typeof dannye === 'object' && dannye ? dannye.message : tekst}`.slice(0, 300));
    e.status = r.status;
    e.dannye = dannye;
    throw e;
  }
  return dannye;
}

const spat = (ms) => new Promise((r) => setTimeout(r, ms));

/** Одно письмо → итог в базу. Возвращает 'sent' | 'povtor' | 'failed'. */
export async function otpravitOdno(cfg, u, smtp = otpravit) {
  let rez;
  let detail = null;
  const p = pismo(u, cfg);
  if (p === null) {
    rez = 'failed';
    detail = `неизвестное событие ${u.event}`;
  } else {
    try {
      const otv = await smtp(cfg.smtp, { from: cfg.from, to: u.to, raw: p.raw });
      rez = 'sent';
      detail = bezAdresov(otv);
    } catch (e) {
      rez = e instanceof SmtpError && !e.vremennaya ? 'failed' : 'povtor';
      detail = bezAdresov(e?.message ?? e);
    }
  }
  await rpc(cfg, 'notify_itog', { p_id: u.id, p_rezultat: rez, p_detail: detail });
  return rez;
}

/** Один проход: тик, письма и push, которые пора отправить. */
export async function prohod(cfg, smtp = otpravit, fetchPush = fetch) {
  const itog = { tick: null, sent: 0, povtor: 0, failed: 0, push: null };
  itog.tick = await rpc(cfg, 'notify_tick_pochta', {});
  if (pochtaEst(cfg)) {
    for (let krug = 0; krug < 50; krug++) {
      const pachka = (await rpc(cfg, 'notify_zabrat', { p_limit: cfg.pachka })) ?? [];
      for (const u of pachka) {
        if (u.channel !== 'pochta') continue;
        const rez = await otpravitOdno(cfg, u, smtp);
        itog[rez] += 1;
        if (cfg.pauzaMs > 0) await spat(cfg.pauzaMs);
      }
      if (pachka.length < cfg.pachka) break;
    }
  }
  itog.push = await prohodPush(cfg, fetchPush);
  itog.roditeli = pochtaEst(cfg) ? await prohodRoditeli(cfg, smtp) : null;
  return itog;
}

/* ── Письмо родителю (миграция …_roditel_pismo.sql) ───────────────── */

const ADRES_POCHTY = /^[^\s<>@,;:"'()]+@[^\s<>@,;:"'()]+\.[^\s<>@,;:"'()]+$/;

/** Письма родителям, которых ждут ученики младше 18. */
export async function prohodRoditeli(cfg, smtp = otpravit) {
  const itog = { sent: 0, povtor: 0, failed: 0 };
  let pachka;
  try {
    pachka = (await rpc(cfg, 'roditel_zabrat', { p_limit: cfg.pachka })) ?? [];
  } catch (e) {
    // До миграции функции нет — тихо пропускаем.
    if (e.status === 404) return itog;
    throw e;
  }
  for (const r of pachka) {
    let povtor = false;
    let ok = false;
    if (ADRES_POCHTY.test(String(r.parent_email ?? ''))) {
      try {
        await smtp(cfg.smtp, { from: cfg.from, to: r.parent_email, raw: pismoRoditelyu(r, cfg).raw });
        ok = true;
      } catch (e) {
        povtor = !(e instanceof SmtpError && !e.vremennaya);
        log('письмо родителю не ушло:', bezAdresov(e?.message ?? e));
      }
    }
    if (ok) itog.sent += 1;
    else if (povtor) itog.povtor += 1;
    else itog.failed += 1;
    if (!ok) await rpc(cfg, 'roditel_itog', { p_user: r.user_id, p_povtor: povtor });
    if (cfg.pauzaMs > 0) await spat(cfg.pauzaMs);
  }
  return itog;
}

/* ── Push (PR 3г) ───────────────────────────────────────────────── */

/**
 * Ключи VAPID: из базы; нет — создать и сохранить (если два рассыльщика
 * создали разом, база оставит первые и вернёт их обоим).
 */
export async function klyuchiVapid(cfg) {
  if (cfg.vapid) return cfg.vapid;
  let k = await rpc(cfg, 'push_vapid', {});
  if (k === null) {
    const novye = vapidKlyuchi();
    k = await rpc(cfg, 'push_vapid_sohranit', { p_public: novye.public, p_private: novye.private });
    log('ключи VAPID созданы');
  }
  cfg.vapid = k;
  return k;
}

const UCHITELYU = new Set(['dz_sdano', 'dz_ne_sdali']);
const VAZHNOE = new Set(['dz_srok', 'dz_vozvrat']);

/**
 * Что уходит в push (В-5): тип события, ссылка на сайт и признаки для
 * заголовка («за 3 часа», «можно с опозданием»). Без названия ДЗ и имён.
 */
export function soderzhaniePush(u) {
  const id = u.homework_id === undefined || u.homework_id === null ? null : encodeURIComponent(u.homework_id);
  const put =
    id === null ? '/kabinet/uvedomleniya/' : `${UCHITELYU.has(u.event) ? ADRESA.itogi : ADRESA.reshat}?id=${id}`;
  const s = { t: u.event, u: put };
  if (u.za === 3 || u.za === 24) s.za = u.za;
  if (u.pozdno === true) s.pozdno = true;
  return s;
}

/** Одна строка очереди push: всем подпискам человека, итог — в базу. */
export async function otpravitPushOdno(cfg, u, fetchPush = fetch) {
  const soderzhanie = soderzhaniePush(u);
  const vazhnoe = VAZHNOE.has(u.event) || (u.event === 'dz_napominanie' && u.za === 3);
  const itogi = [];
  for (const sub of u.subs ?? []) {
    const r = await otpravitPush(sub, soderzhanie, {
      vapid: cfg.vapid,
      sub: cfg.sayt,
      ttl: u.ttl,
      urgency: vazhnoe ? 'high' : 'normal',
      proverkaAdresa: cfg.proverkaAdresaPush,
    }, fetchPush);
    await rpc(cfg, 'push_rezultat', { p_endpoint: sub.endpoint, p_ok: r.rez === 'ok', p_gone: r.rez === 'gone' });
    itogi.push(r);
  }
  // Дошло хоть на одно устройство — отправлено; иначе повтор, если сбой
  // временный; иначе — не отправлено (подписок не осталось или отказ).
  const rez = itogi.some((r) => r.rez === 'ok')
    ? 'sent'
    : itogi.some((r) => r.rez === 'povtor')
      ? 'povtor'
      : 'failed';
  const detail = bezAdresov(itogi.map((r) => r.detail).join('; ') || 'нет подписок');
  await rpc(cfg, 'notify_itog', { p_id: u.id, p_rezultat: rez, p_detail: detail });
  return rez;
}

export async function prohodPush(cfg, fetchPush = fetch) {
  const itog = { sent: 0, povtor: 0, failed: 0 };
  let klyuchi = null;
  for (let krug = 0; krug < 50; krug++) {
    const pachka = (await rpc(cfg, 'notify_zabrat_push', { p_limit: cfg.pachka })) ?? [];
    if (pachka.length > 0 && klyuchi === null) klyuchi = await klyuchiVapid(cfg);
    for (const u of pachka) {
      itog[await otpravitPushOdno(cfg, u, fetchPush)] += 1;
    }
    if (pachka.length < cfg.pachka) break;
  }
  // Ключи нужны сайту ещё до первой подписки: создаются при первом проходе.
  if (klyuchi === null && !cfg.vapid) await klyuchiVapid(cfg);
  return itog;
}

/* ── «Отписаться» ───────────────────────────────────────────────── */

function stranica(zagolovok, abzacy, forma = '') {
  return (
    '<!doctype html><html lang="ru"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex">' +
    `<title>${ekran(zagolovok)} — ${SAYT}</title>` +
    '<style>body{margin:0;background:#eef3fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#1c2233}' +
    'main{max-width:520px;margin:32px auto;padding:0 16px}' +
    '.k{background:rgba(255,255,255,.85);border-radius:16px;border-top:4px solid #1f5fd0;padding:24px 20px;box-shadow:0 2px 8px rgba(28,34,51,.08)}' +
    'h1{font-size:22px;margin:0 0 12px}p{font-size:16px;line-height:1.5;margin:0 0 12px}' +
    'button{font:inherit;font-weight:600;border:0;border-radius:12px;padding:12px 22px;background:#1f5fd0;color:#fff;cursor:pointer;min-height:44px}' +
    'a{color:#1f5fd0}.s{font-size:14px;font-weight:700;color:#1f5fd0;margin:0 4px 12px}</style></head>' +
    `<body><main><p class="s">${SAYT}</p><div class="k"><h1>${ekran(zagolovok)}</h1>` +
    abzacy.map((a) => `<p>${a}</p>`).join('') +
    forma +
    '</div></main></body></html>'
  );
}

/* ── Согласие родителя: страница из письма ─────────────────────── */

/** Адрес человека: Caddy кладёт его в X-Forwarded-For сам. */
function ipOf(req) {
  const xff = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  return /^[0-9a-f.:]{2,45}$/i.test(xff) ? xff : null;
}

async function roditel(req, url, otvet, cfg) {
  const t = url.searchParams.get('t') ?? '';
  const doc = (put, tekst) => `<a href="${ekran(cfg.sayt + put)}">${tekst}</a>`;
  const plohaya = () =>
    otvet(
      400,
      stranica('Ссылка не подошла', [
        'Ссылка неполная, устарела (она действует 14 дней) или уже использована.',
        'Попросите ученика нажать в кабинете «Отправить письмо ещё раз».',
      ]),
    );
  if (!/^[0-9a-f]{64}$/.test(t)) return plohaya();
  if (req.method === 'GET' || req.method === 'HEAD') {
    // GET ничего не меняет: почтовые сканеры открывают ссылки сами.
    return otvet(
      200,
      stranica(
        'Согласие родителя',
        [
          `Ученик указал ваш адрес как адрес родителя при регистрации на сайте ${ekran(SAYT)}.`,
          `Прочитайте ${doc(DOKUMENTY.soglasie, 'согласие на обработку персональных данных')} и ${doc(DOKUMENTY.politika, 'политику обработки данных')}.`,
          'Если вы согласны, нажмите кнопку. Если не знаете этого ученика, просто закройте страницу.',
        ],
        `<form method="post" action="/roditel?t=${encodeURIComponent(t)}"><button type="submit">Даю согласие</button></form>`,
      ),
    );
  }
  if (req.method !== 'POST') return otvet(405, 'method not allowed', 'text/plain');
  for await (const _ of req) {
    /* пропускаем */
  }
  try {
    await rpc(cfg, 'confirm_parent_consent', { p_token: t, p_ip: ipOf(req) });
    log('согласие родителя');
    return otvet(
      200,
      stranica('Спасибо!', ['Согласие записано. Теперь прогресс ученика на сайте сохраняется.']),
    );
  } catch (e) {
    if (e.status === 400 && /bad_token/.test(e.message)) return plohaya();
    log('согласие родителя не записано:', e.message);
    return otvet(503, stranica('Не получилось', ['Сервер не ответил. Попробуйте ещё раз через минуту.']));
  }
}

export function obrabotchik(cfg, sostoyanie) {
  const nastr = `${cfg.sayt}${ADRESA.nastroyki}`;
  return async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://notifier');
    const otvet = (kod, html, tip = 'text/html; charset=utf-8') => {
      res.writeHead(kod, {
        'Content-Type': tip,
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex',
      });
      res.end(html);
    };
    if (url.pathname === '/health') {
      const zhiv = Date.now() - sostoyanie.posledniyUspeh < Math.max(5 * 60000, cfg.intervalMs * 5);
      return otvet(zhiv ? 200 : 503, zhiv ? 'ok' : 'stale', 'text/plain; charset=utf-8');
    }
    if (url.pathname === '/roditel' || url.pathname === '/roditel/') return roditel(req, url, otvet, cfg);
    if (url.pathname !== '/otpiska' && url.pathname !== '/otpiska/') return otvet(404, 'not found', 'text/plain');
    const u = url.searchParams.get('u') ?? '';
    const t = url.searchParams.get('t') ?? '';
    const ssylkaVerna = /^[0-9a-f-]{36}$/i.test(u) && /^[0-9a-f]{32}$/.test(t);
    const plohaya = () =>
      otvet(
        400,
        stranica('Ссылка не подошла', [
          'Ссылка для отписки неполная или устарела.',
          `Письма можно выключить в <a href="${ekran(nastr)}">настройках уведомлений</a> после входа.`,
        ]),
      );
    if (!ssylkaVerna) return plohaya();
    if (req.method === 'GET' || req.method === 'HEAD') {
      // GET ничего не меняет: почтовые сканеры открывают ссылки сами.
      return otvet(
        200,
        stranica(
          'Отписаться от писем',
          [
            'Письма об уведомлениях больше не будут приходить на эту почту. В колокольчике на сайте уведомления останутся.',
            `Включить письма снова можно в <a href="${ekran(nastr)}">настройках уведомлений</a>.`,
          ],
          `<form method="post" action="/otpiska?u=${encodeURIComponent(u)}&amp;t=${encodeURIComponent(t)}"><button type="submit">Отписаться</button></form>`,
        ),
      );
    }
    if (req.method !== 'POST') return otvet(405, 'method not allowed', 'text/plain');
    // Тело (List-Unsubscribe=One-Click или пустая форма) не нужно, но дочитываем.
    for await (const _ of req) {
      /* пропускаем */
    }
    try {
      await rpc(cfg, 'notify_otpiska', { p_user: u, p_t: t });
      log('отписка');
      return otvet(
        200,
        stranica('Письма выключены', [
          'Письма об уведомлениях больше не придут. В колокольчике на сайте всё по-прежнему видно.',
          `Включить снова — в <a href="${ekran(nastr)}">настройках уведомлений</a>.`,
        ]),
      );
    } catch (e) {
      if (e.status === 400 && /bad_link/.test(e.message)) return plohaya();
      log('отписка не прошла:', e.message);
      return otvet(
        503,
        stranica('Не получилось', ['Сервер не ответил. Попробуйте ещё раз через минуту.']),
      );
    }
  };
}

export function zapustit(cfg = nastroyki()) {
  const sostoyanie = { posledniyUspeh: Date.now(), stop: false };
  const server = http.createServer(obrabotchik(cfg, sostoyanie));
  // Без адреса — на всех (IPv6 и IPv4, где IPv6 нет — только IPv4).
  server.listen(cfg.httpPort);
  if (!cfg.klyuch) log('Нет SERVICE_ROLE_KEY — рассыльщик не может ходить в базу.');
  if (!pochtaEst(cfg)) log('Почта не настроена (SMTP_USER/SMTP_PASS) — только колокольчик и напоминания.');
  let taymer = null;
  // Одна и та же ошибка (например, до первых миграций функции ещё нет)
  // пишется в журнал один раз, а не каждую минуту.
  let proshlayaOshibka = null;
  const cikl = async () => {
    if (sostoyanie.stop) return;
    try {
      const it = await prohod(cfg);
      sostoyanie.posledniyUspeh = Date.now();
      if (proshlayaOshibka !== null) log('проход снова удаётся');
      proshlayaOshibka = null;
      const r = it.roditeli;
      if (r && r.sent + r.povtor + r.failed > 0) {
        log(`родителям: отправлено ${r.sent}, повтор ${r.povtor}, не ушло ${r.failed}`);
      }
      if (it.sent + it.povtor + it.failed > 0) {
        log(`писем: отправлено ${it.sent}, повтор ${it.povtor}, не ушло ${it.failed}`);
      }
      const p = it.push;
      if (p && p.sent + p.povtor + p.failed > 0) {
        log(`push: отправлено ${p.sent}, повтор ${p.povtor}, не ушло ${p.failed}`);
      }
    } catch (e) {
      if (e.message !== proshlayaOshibka) log('проход не удался:', e.message);
      proshlayaOshibka = e.message;
    }
    if (!sostoyanie.stop) taymer = setTimeout(cikl, cfg.intervalMs);
  };
  taymer = setTimeout(cikl, 2000);
  const stop = () =>
    new Promise((resolve) => {
      sostoyanie.stop = true;
      clearTimeout(taymer);
      server.close(() => resolve());
    });
  return { server, stop, sostoyanie };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { stop } = zapustit();
  log('рассыльщик запущен');
  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, () => stop().then(() => process.exit(0)));
  }
}
