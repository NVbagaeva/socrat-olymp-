/**
 * Сервис оплаты через Robokassa (docs/oplata-robokassa.md). Контейнер
 * `oplata` в compose.yml, Node без зависимостей.
 *
 * Порт 8091 (только внутри сети, снаружи — через Caddy):
 *
 *   POST /oplata/sozdat — сайт, со входом человека (Authorization: Bearer
 *        <JWT>) и ключом anon; тело {"tarif","srok","oferta"}. База
 *        заводит заказ и сама считает цену (rpc oplata_sozdat под JWT
 *        человека), сервис подписывает ссылку Паролем №1 и отвечает
 *        {"url": "https://auth.robokassa.ru/Merchant/Index.aspx?…"}.
 *   POST /oplata/result — Result URL Robokassa (без apikey). Подпись
 *        проверяется Паролем №2, затем rpc oplata_zachest (service_role)
 *        и ответ «OK<InvId>». Повтор уведомления — снова «OK».
 *   GET  /health.
 *
 * Пароли — только в окружении сервера (GitHub Secrets → .env.github),
 * в браузер и в журнал не попадают. Без логина и паролей /oplata/sozdat
 * отвечает 503 «oplata_vyklyuchena», а /oplata/result не принимает ничего.
 */

import crypto from 'node:crypto';
import http from 'node:http';
import { pathToFileURL } from 'node:url';

export const ROBOKASSA_URL = 'https://auth.robokassa.ru/Merchant/Index.aspx';
const HESHI = new Set(['md5', 'sha1', 'sha256', 'sha384', 'sha512']);

export function nastroyki(env = process.env) {
  const hesh = String(env.ROBOKASSA_HASH || 'md5').toLowerCase();
  if (!HESHI.has(hesh)) throw new Error(`ROBOKASSA_HASH: ${hesh} — нужен один из ${[...HESHI].join(', ')}`);
  return {
    rest: (env.REST_URL || 'http://rest:3000').replace(/\/$/, ''),
    klyuch: env.SERVICE_ROLE_KEY || '',
    login: env.ROBOKASSA_LOGIN || '',
    pass1: env.ROBOKASSA_PASS1 || '',
    pass2: env.ROBOKASSA_PASS2 || '',
    hesh,
    test: env.ROBOKASSA_TEST === '1',
    // Передавать ли состав чека (Receipt): нужен, если чек формирует
    // Robokassa (Робочеки); см. docs/oplata-robokassa.md.
    chek: env.ROBOKASSA_RECEIPT === '1',
    httpPort: Number(env.OPLATA_PORT || 8091),
  };
}

/** Оплата настроена: есть логин магазина и оба пароля. */
export const vklyuchena = (cfg) => cfg.login !== '' && cfg.pass1 !== '' && cfg.pass2 !== '';

const log = (...a) => console.log(new Date().toISOString(), ...a);

export const hesh = (algo, s) => crypto.createHash(algo).update(s, 'utf8').digest('hex');

/** Дополнительные параметры Shp_* — по алфавиту, как их подписывает Robokassa. */
function shpStroka(params) {
  return [...params.entries()]
    .filter(([k]) => /^shp_/i.test(k))
    .sort(([a], [b]) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0))
    .map(([k, v]) => `:${k}=${v}`)
    .join('');
}

/** Сравнение подписей без утечки по времени, регистр не важен. */
export function podpisSovpala(a, b) {
  const x = Buffer.from(String(a ?? '').toLowerCase());
  const y = Buffer.from(String(b ?? '').toLowerCase());
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

/**
 * Состав чека для Robokassa: одна услуга, без НДС. Строка уже
 * закодирована (encodeURIComponent): так она входит в подпись, а в
 * адресе ссылки кодируется ещё раз — как требует Robokassa.
 */
export function chek(zakaz) {
  const json = JSON.stringify({
    items: [
      {
        name: zakaz.opisanie.slice(0, 128),
        quantity: 1,
        sum: Number(zakaz.summa),
        payment_method: 'full_payment',
        payment_object: 'service',
        tax: 'none',
      },
    ],
  });
  return encodeURIComponent(json);
}

/** Ссылка на оплату заказа (подпись — Пароль №1). */
export function ssylka(cfg, zakaz) {
  const outSum = String(zakaz.summa);
  const invId = String(zakaz.inv_id);
  const receipt = cfg.chek ? chek(zakaz) : null;
  const podpis = hesh(
    cfg.hesh,
    [cfg.login, outSum, invId, ...(receipt ? [receipt] : []), cfg.pass1].join(':'),
  );
  const p = new URLSearchParams({
    MerchantLogin: cfg.login,
    OutSum: outSum,
    InvId: invId,
    Description: zakaz.opisanie.slice(0, 100),
    SignatureValue: podpis,
    Culture: 'ru',
    Encoding: 'utf-8',
  });
  if (receipt) p.set('Receipt', receipt);
  if (zakaz.email) p.set('Email', zakaz.email);
  if (cfg.test) p.set('IsTest', '1');
  return `${ROBOKASSA_URL}?${p}`;
}

/** Подпись уведомления Result URL (Пароль №2). */
export function podpisResult(cfg, params) {
  return hesh(
    cfg.hesh,
    `${params.get('OutSum') ?? ''}:${params.get('InvId') ?? ''}:${cfg.pass2}${shpStroka(params)}`,
  );
}

async function rpc(cfg, imya, args, authorization) {
  const r = await fetch(`${cfg.rest}/rpc/${imya}`, {
    method: 'POST',
    headers: {
      Authorization: authorization ?? `Bearer ${cfg.klyuch}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(15000),
  });
  const tekst = await r.text();
  let dannye = null;
  try {
    dannye = tekst === '' ? null : JSON.parse(tekst);
  } catch {
    dannye = tekst;
  }
  if (!r.ok) {
    const soobshchenie = typeof dannye === 'object' && dannye ? String(dannye.message ?? '') : String(tekst);
    const e = new Error(`${imya}: ${r.status} ${soobshchenie}`.slice(0, 300));
    e.status = r.status;
    e.soobshchenie = soobshchenie;
    throw e;
  }
  return dannye;
}

const MAKS_TELA = 16 * 1024;

async function telo(req) {
  let n = 0;
  const chasti = [];
  for await (const ch of req) {
    n += ch.length;
    if (n > MAKS_TELA) throw Object.assign(new Error('тело слишком большое'), { status: 413 });
    chasti.push(ch);
  }
  return Buffer.concat(chasti).toString('utf8');
}

/** Ошибки базы, которые можно показать человеку: код до двоеточия. */
const KODY_ZAKAZA = new Set(['forbidden', 'wrong_tarif', 'wrong_srok', 'oferta', 'too_many', 'ne_prodaetsya']);

export function obrabotchik(cfg) {
  return async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://oplata');
    const otvet = (kod, telo, tip = 'application/json; charset=utf-8') => {
      res.writeHead(kod, { 'Content-Type': tip, 'Cache-Control': 'no-store' });
      res.end(typeof telo === 'string' ? telo : JSON.stringify(telo));
    };
    const tekst = (kod, t) => otvet(kod, t, 'text/plain; charset=utf-8');
    try {
      if (url.pathname === '/health') return tekst(200, 'ok');

      if (url.pathname === '/oplata/sozdat') {
        if (req.method !== 'POST') return tekst(405, 'method not allowed');
        if (!vklyuchena(cfg)) return otvet(503, { error: 'oplata_vyklyuchena' });
        const auth = req.headers.authorization ?? '';
        if (!/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/.test(auth)) return otvet(401, { error: 'forbidden' });
        let vvod;
        try {
          vvod = JSON.parse(await telo(req));
        } catch (e) {
          if (e.status === 413) return otvet(413, { error: 'too_large' });
          return otvet(400, { error: 'bad_json' });
        }
        let zakaz;
        try {
          zakaz = await rpc(
            cfg,
            'oplata_sozdat',
            { p_tarif: vvod?.tarif ?? null, p_srok: vvod?.srok ?? null, p_oferta: vvod?.oferta === true },
            auth,
          );
        } catch (e) {
          const kod = /^(\w+):/.exec(e.soobshchenie ?? '')?.[1];
          if (kod && KODY_ZAKAZA.has(kod)) return otvet(kod === 'forbidden' ? 403 : 400, { error: kod });
          // Просроченный или чужой JWT PostgREST отклоняет с 401.
          if (e.status === 401) return otvet(401, { error: 'forbidden' });
          throw e;
        }
        log(`заказ ${zakaz.inv_id}: ${zakaz.summa} ₽`);
        return otvet(200, { url: ssylka(cfg, zakaz), inv_id: zakaz.inv_id, summa: zakaz.summa });
      }

      if (url.pathname === '/oplata/result') {
        // Robokassa шлёт POST (форма) или GET — как выбрано в настройках магазина.
        let params;
        if (req.method === 'POST') params = new URLSearchParams(await telo(req));
        else if (req.method === 'GET') params = url.searchParams;
        else return tekst(405, 'method not allowed');
        if (!vklyuchena(cfg)) return tekst(503, 'oplata off');
        const invId = params.get('InvId') ?? '';
        const outSum = params.get('OutSum') ?? '';
        if (!/^\d{1,18}$/.test(invId) || !/^\d{1,12}(\.\d{1,6})?$/.test(outSum)) return tekst(400, 'bad request');
        if (!podpisSovpala(params.get('SignatureValue'), podpisResult(cfg, params))) {
          log(`Result URL: неверная подпись, заказ ${invId}`);
          return tekst(400, 'bad sign');
        }
        try {
          const itog = await rpc(cfg, 'oplata_zachest', { p_inv_id: Number(invId), p_summa: Number(outSum) });
          log(`оплата заказа ${invId}: ${itog?.itog}`);
        } catch (e) {
          const kod = /^(\w+):/.exec(e.soobshchenie ?? '')?.[1];
          if (kod === 'net_zakaza' || kod === 'summa') {
            log(`Result URL отклонён, заказ ${invId}: ${kod}`);
            return tekst(400, kod);
          }
          throw e;
        }
        return tekst(200, `OK${invId}`);
      }

      return tekst(404, 'not found');
    } catch (e) {
      // База недоступна и прочее: Robokassa повторит уведомление сама.
      log('сбой:', e?.message ?? e);
      return res.headersSent ? res.end() : tekst(503, 'try later');
    }
  };
}

export function zapustit(cfg = nastroyki()) {
  const server = http.createServer(obrabotchik(cfg));
  server.listen(cfg.httpPort);
  if (!cfg.klyuch) log('Нет SERVICE_ROLE_KEY — сервис не может зачесть оплату.');
  if (!vklyuchena(cfg)) log('Оплата не настроена (ROBOKASSA_LOGIN, ROBOKASSA_PASS1, ROBOKASSA_PASS2) — заказы не принимаются.');
  else log(`Robokassa: магазин настроен, подпись ${cfg.hesh}${cfg.test ? ', тестовый режим' : ''}${cfg.chek ? ', с чеком' : ''}`);
  return { server, stop: () => new Promise((r) => server.close(() => r())) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { stop } = zapustit();
  log('сервис оплаты запущен');
  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, () => stop().then(() => process.exit(0)));
  }
}
