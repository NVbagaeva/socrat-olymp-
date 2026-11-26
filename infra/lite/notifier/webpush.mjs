/**
 * Web push без зависимостей (docs/kabinet-uvedomleniya.md, PR 3г):
 *   — ключи и подпись VAPID (RFC 8292, ES256);
 *   — шифрование содержимого aes128gcm (RFC 8291, RFC 8188);
 *   — отправка на адрес подписки и разбор ответа сервиса.
 *
 * В push — только тип события и ссылка (В-5). Проверка — check.mjs,
 * в том числе пример из RFC 8291, приложение A.
 */

import crypto from 'node:crypto';

export const b64u = (buf) => Buffer.from(buf).toString('base64url');
export const izB64u = (s) => Buffer.from(String(s).replace(/=+$/, ''), 'base64url');

/** Адрес подписки — только известных сервисов push (то же правило, что у базы). */
export const ADRES_PUSH =
  /^https:\/\/(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)\/[A-Za-z0-9_~:%./?=&+-]+$/;

/** Новая пара ключей VAPID: открытый (65 байт) и закрытый (32 байта), base64url. */
export function vapidKlyuchi() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return { public: b64u(ecdh.getPublicKey()), private: b64u(ecdh.getPrivateKey()) };
}

function zakrytyy(klyuchi) {
  const pub = izB64u(klyuchi.public);
  if (pub.length !== 65 || pub[0] !== 4) throw new Error('VAPID: открытый ключ не P-256');
  return crypto.createPrivateKey({
    format: 'jwk',
    key: {
      kty: 'EC',
      crv: 'P-256',
      x: b64u(pub.subarray(1, 33)),
      y: b64u(pub.subarray(33, 65)),
      d: b64u(izB64u(klyuchi.private)),
    },
  });
}

/**
 * Заголовок Authorization для сервиса push: JWT ES256 на 12 часов,
 * aud — адрес сервиса, sub — адрес сайта.
 */
export function vapidZagolovok(endpoint, klyuchi, sub, now = Date.now()) {
  const aud = new URL(endpoint).origin;
  const h = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const p = b64u(JSON.stringify({ aud, exp: Math.floor(now / 1000) + 12 * 3600, sub }));
  const podpis = crypto.sign('sha256', Buffer.from(`${h}.${p}`), {
    key: zakrytyy(klyuchi),
    dsaEncoding: 'ieee-p1363',
  });
  return `vapid t=${h}.${p}.${b64u(podpis)}, k=${klyuchi.public}`;
}

const hkdf = (salt, ikm, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));

/**
 * Шифрование для одной подписки (RFC 8291): одна запись aes128gcm.
 * `opts.salt` и `opts.asPrivate` — только для проверки по примеру из RFC.
 */
export function zashifrovat(tekst, p256dh, authSecret, opts = {}) {
  const uaPublic = izB64u(p256dh);
  const auth = izB64u(authSecret);
  if (uaPublic.length !== 65 || auth.length !== 16) throw new Error('push: ключи подписки неверной длины');
  const as = crypto.createECDH('prime256v1');
  if (opts.asPrivate) as.setPrivateKey(izB64u(opts.asPrivate));
  else as.generateKeys();
  const asPublic = as.getPublicKey();
  const ecdhSecret = as.computeSecret(uaPublic);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]);
  const ikm = hkdf(auth, ecdhSecret, keyInfo, 32);
  const salt = opts.salt ? izB64u(opts.salt) : crypto.randomBytes(16);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  // Последняя (и единственная) запись: текст и разделитель 0x02.
  const zapis = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(tekst), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, zapis]);
}

/**
 * Отправить одну подписку. Итог: ok — принято; gone — подписки нет
 * (404/410) или адрес не сервиса push; povtor — 429, 5xx, нет связи;
 * failed — прочие отказы (ключи, размер).
 */
export async function otpravitPush(sub, soderzhanie, cfg, fetchImpl = fetch) {
  const host = (() => {
    try {
      return new URL(sub.endpoint).host;
    } catch {
      return 'адрес';
    }
  })();
  if (cfg.proverkaAdresa !== false && !ADRES_PUSH.test(sub.endpoint)) {
    return { rez: 'gone', detail: `${host}: не сервис push` };
  }
  let telo;
  try {
    telo = zashifrovat(JSON.stringify(soderzhanie), sub.p256dh, sub.auth);
  } catch (e) {
    return { rez: 'gone', detail: `${host}: ${e.message}` };
  }
  try {
    const r = await fetchImpl(sub.endpoint, {
      method: 'POST',
      // Только сам адрес из белого списка: перенаправление на другой адрес не идём.
      redirect: 'manual',
      headers: {
        TTL: String(cfg.ttl ?? 86400),
        Urgency: cfg.urgency ?? 'normal',
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        Authorization: vapidZagolovok(sub.endpoint, cfg.vapid, cfg.sub),
      },
      body: telo,
      signal: AbortSignal.timeout(cfg.timeoutMs ?? 30000),
    });
    await r.arrayBuffer().catch(() => null);
    const detail = `${host}: ${r.status}`;
    if (r.status >= 200 && r.status < 300) return { rez: 'ok', detail };
    if (r.status === 404 || r.status === 410) return { rez: 'gone', detail };
    if (r.status === 429 || r.status >= 500) return { rez: 'povtor', detail };
    return { rez: 'failed', detail };
  } catch (e) {
    return { rez: 'povtor', detail: `${host}: нет связи (${String(e?.name ?? 'Error')})` };
  }
}
