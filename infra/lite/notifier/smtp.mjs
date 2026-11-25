/**
 * Маленький SMTP-клиент рассыльщика без зависимостей (docs/kabinet-uvedomleniya.md,
 * PR 3в). Порт 465 — сразу TLS (Яндекс 360); иначе обычное соединение и
 * STARTTLS, если сервер его предлагает. MAIL_NO_AUTH=1 — без входа
 * (Mailpit в CI).
 *
 * Ошибка несёт `code` — трёхзначный ответ сервера (или 0 при обрыве
 * связи): 4xx и 0 — временная, письмо повторится; 5xx — постоянная.
 */

import net from 'node:net';
import tls from 'node:tls';

export class SmtpError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
  get vremennaya() {
    return this.code === 0 || (this.code >= 400 && this.code < 500);
  }
}

/** Читает ответы сервера: многострочный ответ «250-…» заканчивается «250 …». */
function chitatel(socket) {
  let buf = '';
  const ochered = [];
  const zhdut = [];
  let oshibka = null;
  const otdat = () => {
    while (zhdut.length > 0 && (ochered.length > 0 || oshibka !== null)) {
      const w = zhdut.shift();
      if (ochered.length > 0) w.resolve(ochered.shift());
      else w.reject(oshibka);
    }
  };
  const naData = (chunk) => {
    buf += chunk.toString('utf8');
    let i;
    let lines = [];
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).replace(/\r$/, '');
      buf = buf.slice(i + 1);
      lines.push(line);
      if (/^\d{3} /.test(line) || /^\d{3}$/.test(line)) {
        ochered.push({ code: Number(line.slice(0, 3)), text: lines.join('\n') });
        lines = [];
      }
    }
    if (lines.length > 0) buf = lines.join('\n') + '\n' + buf;
    otdat();
  };
  const naKonec = (e) => {
    oshibka = new SmtpError(`Связь с SMTP оборвалась${e ? `: ${e.message}` : ''}`, 0);
    otdat();
  };
  return {
    podklyuchit(s) {
      s.on('data', naData);
      s.on('error', naKonec);
      s.on('close', () => naKonec());
    },
    otklyuchit(s) {
      s.off('data', naData);
      s.off('error', naKonec);
      s.removeAllListeners('close');
    },
    otvet() {
      return new Promise((resolve, reject) => {
        zhdut.push({ resolve, reject });
        otdat();
      });
    },
  };
}

function soedinit(opts) {
  const { host, port, timeoutMs } = opts;
  return new Promise((resolve, reject) => {
    const s =
      port === 465
        ? tls.connect({ host, port, servername: host, rejectUnauthorized: opts.tlsStrogo !== false })
        : net.connect({ host, port });
    const gotovo = port === 465 ? 'secureConnect' : 'connect';
    s.setTimeout(timeoutMs, () => s.destroy(new Error('таймаут')));
    s.once(gotovo, () => resolve(s));
    s.once('error', (e) => reject(new SmtpError(`Нет связи с SMTP: ${e.message}`, 0)));
  });
}

/**
 * Отправляет одно письмо: `raw` — готовое письмо (заголовки и тело, CRLF).
 * Возвращает ответ сервера на конец письма.
 */
export async function otpravit(opts, { from, to, raw }) {
  const o = { timeoutMs: 30000, ...opts };
  let s = await soedinit(o);
  let r = chitatel(s);
  r.podklyuchit(s);
  const komanda = async (line, ozhidaem) => {
    if (line !== null) s.write(`${line}\r\n`);
    const otv = await r.otvet();
    if (!ozhidaem.includes(otv.code)) {
      const pokaz = line === null ? 'приветствие' : line.startsWith('AUTH') ? 'AUTH' : line.split(' ')[0];
      throw new SmtpError(`${pokaz}: ${otv.text}`.slice(0, 300), otv.code);
    }
    return otv;
  };
  try {
    await komanda(null, [220]);
    const imya = o.helo ?? 'notifier';
    let ehlo = await komanda(`EHLO ${imya}`, [250]);
    if (o.port !== 465 && /STARTTLS/i.test(ehlo.text)) {
      await komanda('STARTTLS', [220]);
      r.otklyuchit(s);
      s = await new Promise((resolve, reject) => {
        const t = tls.connect({ socket: s, servername: o.host, rejectUnauthorized: o.tlsStrogo !== false });
        t.once('secureConnect', () => resolve(t));
        t.once('error', (e) => reject(new SmtpError(`STARTTLS: ${e.message}`, 0)));
      });
      r = chitatel(s);
      r.podklyuchit(s);
      ehlo = await komanda(`EHLO ${imya}`, [250]);
    }
    if (!o.bezVhoda && o.user) {
      const plain = Buffer.from(`\0${o.user}\0${o.pass ?? ''}`).toString('base64');
      await komanda(`AUTH PLAIN ${plain}`, [235]);
    }
    await komanda(`MAIL FROM:<${from}>`, [250]);
    await komanda(`RCPT TO:<${to}>`, [250, 251]);
    await komanda('DATA', [354]);
    // Точка в начале строки удваивается (RFC 5321, 4.5.2).
    const telo = raw.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
    s.write(telo.endsWith('\r\n') ? telo : `${telo}\r\n`);
    const itog = await komanda('.', [250]);
    s.write('QUIT\r\n');
    s.end();
    return itog.text;
  } catch (e) {
    s.destroy();
    throw e instanceof SmtpError ? e : new SmtpError(String(e?.message ?? e), 0);
  }
}
