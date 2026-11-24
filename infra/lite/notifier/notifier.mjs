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
 *      (4xx, обрыв связи) — повтор через 1, 5, 30 мин, 2 ч; failed (5xx).
 *
 * Порт 8090 (только внутри сети, снаружи — через Caddy):
 *   GET  /otpiska?u=&t= — страница с кнопкой «Отписаться»;
 *   POST /otpiska?u=&t= — отписка (кнопка и «в один клик» из почтовика,
 *        RFC 8058); подпись t проверяет база (notify_otpiska);
 *   GET  /health — жив ли цикл.
 *
 * В базу — ключом service_role через PostgREST внутри сети (rest:3000).
 */

import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { otpravit, SmtpError } from './smtp.mjs';
import { ekran, pismo, SAYT, ADRESA } from './pisma.mjs';

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

/** Один проход: тик и все письма, которые пора отправить. */
export async function prohod(cfg, smtp = otpravit) {
  const itog = { tick: null, sent: 0, povtor: 0, failed: 0 };
  itog.tick = await rpc(cfg, 'notify_tick_pochta', {});
  if (!pochtaEst(cfg)) return itog;
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
  server.listen(cfg.httpPort, '0.0.0.0');
  if (!cfg.klyuch) log('Нет SERVICE_ROLE_KEY — рассыльщик не может ходить в базу.');
  if (!pochtaEst(cfg)) log('Почта не настроена (SMTP_USER/SMTP_PASS) — только колокольчик и напоминания.');
  let taymer = null;
  const cikl = async () => {
    if (sostoyanie.stop) return;
    try {
      const it = await prohod(cfg);
      sostoyanie.posledniyUspeh = Date.now();
      if (it.sent + it.povtor + it.failed > 0) {
        log(`писем: отправлено ${it.sent}, повтор ${it.povtor}, не ушло ${it.failed}`);
      }
    } catch (e) {
      log('проход не удался:', e.message);
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
