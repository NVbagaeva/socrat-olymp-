/**
 * Письма уведомлений (docs/kabinet-uvedomleniya.md, PR 3в). Строка очереди
 * из notify_zabrat → тема, текст и HTML → готовое письмо MIME.
 *
 * Правила текстов те же, что у колокольчика (app/src/lib/uvedomleniya/model.ts):
 * ученику — на «ты», учителю — на «вы», без «мы» и без рода («сдано», а
 * не «сдал»). Текста ДЗ и комментариев в письме нет — только название,
 * срок и ссылка (минимум данных, В-12).
 *
 * Адреса страниц повторяют app/src/lib/dz2/links.ts и
 * app/src/lib/uvedomleniya/links.ts; совпадение проверяет check.mjs.
 */

import crypto from 'node:crypto';

export const ADRESA = {
  reshat: '/kabinet/domashki/reshat/',
  itogi: '/kabinet/dz2/itogi/',
  spisok: '/kabinet/dz2/',
  nastroyki: '/kabinet/uvedomleniya/?vkladka=nastroyki',
};

export const SAYT = 'Будет на ЕГЭ';

const CVET = { siniy: '#1f5fd0', oranzhevyy: '#e07a2f', tekst: '#1c2233', seryy: '#5b6478', fon: '#eef3fb' };

const POYAS = {
  'Europe/Kaliningrad': 'МСК−1',
  'Europe/Moscow': 'МСК',
  'Europe/Samara': 'МСК+1',
  'Asia/Yekaterinburg': 'МСК+2',
  'Asia/Omsk': 'МСК+3',
  'Asia/Novosibirsk': 'МСК+4',
  'Asia/Krasnoyarsk': 'МСК+4',
  'Asia/Irkutsk': 'МСК+5',
  'Asia/Yakutsk': 'МСК+6',
  'Asia/Vladivostok': 'МСК+7',
  'Asia/Magadan': 'МСК+8',
  'Asia/Kamchatka': 'МСК+9',
};

/** «25 ноября, 18:00 (МСК)» — в поясе получателя. */
export function srok(iso, tz = 'Europe/Moscow') {
  if (!iso) return null;
  let zona = tz;
  try {
    new Intl.DateTimeFormat('ru-RU', { timeZone: zona });
  } catch {
    zona = 'Europe/Moscow';
  }
  const d = new Date(iso);
  const den = d.toLocaleDateString('ru-RU', { timeZone: zona, day: 'numeric', month: 'long' });
  const vremya = d.toLocaleTimeString('ru-RU', { timeZone: zona, hour: '2-digit', minute: '2-digit' });
  return `${den}, ${vremya} (${POYAS[zona] ?? zona})`;
}

const imya = (t) => `«${t === undefined || t === null || t === '' ? 'Без названия' : t}»`;

export const ekran = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Содержание письма без оформления: тема, абзацы, кнопка, важное ли.
 * `u` — строка notify_zabrat.
 */
export function soderzhanie(u, sayt) {
  const dz = imya(u.title);
  const p = u.payload ?? {};
  const s = srok(u.due_at, u.tz);
  const id = u.homework_id === undefined ? null : encodeURIComponent(u.homework_id);
  const vDz = id === null ? null : { tekst: 'Открыть ДЗ', href: `${sayt}${ADRESA.reshat}?id=${id}` };
  const vItogi = id === null ? null : { tekst: 'Открыть итоги', href: `${sayt}${ADRESA.itogi}?id=${id}` };
  const srokAbz = s === null ? [] : [`Срок — ${s}.`];
  switch (u.event) {
    case 'dz_novoe':
      return { tema: `Новое ДЗ: ${dz}`, abzacy: [`Новое ДЗ ${dz}.`, ...srokAbz], knopka: vDz };
    case 'dz_izmeneno':
      return {
        tema: `ДЗ ${dz} изменено`,
        abzacy: [`В ДЗ ${dz} поменялись условия или срок — проверь перед сдачей.`, ...srokAbz],
        knopka: vDz,
      };
    case 'dz_vozvrat':
      return {
        tema: `ДЗ ${dz} вернули на доработку`,
        abzacy: [`ДЗ ${dz} вернули на доработку. Посмотри комментарии учителя и сдай ещё раз.`, ...srokAbz],
        knopka: vDz,
        vazhnoe: true,
      };
    case 'dz_kommentariy':
      return {
        tema: `Комментарий учителя к ДЗ ${dz}`,
        abzacy: [`К ДЗ ${dz} есть новый комментарий учителя. Прочитать его можно в ДЗ.`],
        knopka: vDz,
      };
    case 'dz_napominanie': {
      const za = p.za === 3 ? 'меньше 3 часов' : 'меньше суток';
      return {
        tema: `До дедлайна ДЗ ${dz} ${za}`,
        abzacy: [`До дедлайна ДЗ ${dz} ${za}, а ДЗ ещё не сдано.`, ...srokAbz],
        knopka: vDz,
        vazhnoe: p.za === 3,
      };
    }
    case 'dz_srok':
      return p.pozdno === true
        ? {
            tema: `Срок ДЗ ${dz} прошёл`,
            abzacy: [`Срок ДЗ ${dz} прошёл, но сдать ещё можно — с опозданием.`],
            knopka: vDz,
            vazhnoe: true,
          }
        : {
            tema: `Срок ДЗ ${dz} прошёл`,
            abzacy: [`Срок ДЗ ${dz} прошёл, приём закрыт. Решения и разборы остаются в ДЗ.`],
            knopka: vDz,
            vazhnoe: true,
          };
    case 'dz_sdano': {
      const kto = u.uchenik_name || 'Ученик';
      const pozdno = p.pozdno === true ? ' с опозданием' : '';
      return {
        tema: `${kto}: ДЗ ${dz} сдано${pozdno}`,
        abzacy: [`${kto}: ДЗ ${dz} сдано${pozdno}. Ответы и время — в итогах.`],
        knopka: vItogi,
      };
    }
    case 'dz_ne_sdali':
      return {
        tema: `ДЗ ${dz}: не сдали ${p.skolko ?? 0} из ${p.vsego ?? 0}`,
        abzacy: [
          `Дедлайн ДЗ ${dz} прошёл: не сдали ${p.skolko ?? 0} из ${p.vsego ?? 0}.`,
          'Кто именно — в итогах; там же можно продлить срок.',
        ],
        knopka: vItogi,
      };
    case 'digest': {
      const za = u.period === 'week' ? 'неделю' : 'день';
      const spisok = Array.isArray(u.svodka) ? u.svodka : [];
      return {
        tema: `Сводка по ДЗ за ${za}`,
        abzacy: [spisok.length === 0 ? `За ${za} новых сдач нет.` : `Что изменилось по ДЗ за ${za}:`],
        stroki: spisok.map((x) => {
          const chasti = [`сдали ${x.sdali ?? 0} из ${x.vsego ?? 0}`];
          if ((x.novyh ?? 0) > 0) chasti.push(`новых сдач — ${x.novyh}`);
          if (x.ne_sdali !== undefined && x.ne_sdali > 0) chasti.push(`после срока не сдали — ${x.ne_sdali}`);
          return {
            nazvanie: imya(x.title),
            href: `${sayt}${ADRESA.itogi}?id=${encodeURIComponent(x.id)}`,
            tekst: chasti.join(', '),
            vazhnoe: x.ne_sdali !== undefined && x.ne_sdali > 0,
          };
        }),
        knopka: { tekst: 'Все ДЗ', href: `${sayt}${ADRESA.spisok}` },
      };
    }
    default:
      return null;
  }
}

/** Подвал: почему пришло письмо, настройки, «Отписаться». */
function podval(u, sayt, otpiska) {
  return {
    pochemu: 'Письмо пришло, потому что в настройках уведомлений на сайте включена почта.',
    nastroyki: `${sayt}${ADRESA.nastroyki}`,
    otpiska,
  };
}

export function otpiskaHref(apiDomain, u) {
  if (!u.otpiska?.u || !u.otpiska?.t) return null;
  return `https://${apiDomain}/otpiska?u=${encodeURIComponent(u.otpiska.u)}&t=${encodeURIComponent(u.otpiska.t)}`;
}

function tekstPisma(s, pv) {
  const linii = [...s.abzacy];
  for (const st of s.stroki ?? []) linii.push(`— ${st.nazvanie}: ${st.tekst}. ${st.href}`);
  if (s.knopka) linii.push('', `${s.knopka.tekst}: ${s.knopka.href}`);
  linii.push('', '—', `${SAYT}`, pv.pochemu, `Настройки уведомлений: ${pv.nastroyki}`);
  if (pv.otpiska) linii.push(`Отписаться от писем: ${pv.otpiska}`);
  return linii.join('\n');
}

function htmlPisma(s, pv) {
  const akcent = s.vazhnoe ? CVET.oranzhevyy : CVET.siniy;
  const abz = s.abzacy
    .map((t) => `<p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:${CVET.tekst}">${ekran(t)}</p>`)
    .join('');
  const stroki = (s.stroki ?? [])
    .map(
      (st) =>
        `<tr><td style="padding:10px 0;border-top:1px solid #dbe3f0;font-size:15px;line-height:1.4;color:${CVET.tekst}">` +
        `<a href="${ekran(st.href)}" style="color:${CVET.siniy};font-weight:600;text-decoration:none">${ekran(st.nazvanie)}</a><br>` +
        `<span style="color:${st.vazhnoe ? CVET.oranzhevyy : CVET.seryy}">${ekran(st.tekst)}</span></td></tr>`,
    )
    .join('');
  const tabl = stroki === '' ? '' : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px">${stroki}</table>`;
  const knopka = s.knopka
    ? `<p style="margin:20px 0 4px"><a href="${ekran(s.knopka.href)}" style="display:inline-block;padding:12px 22px;border-radius:12px;background:${CVET.siniy};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none">${ekran(s.knopka.tekst)}</a></p>`
    : '';
  const otp = pv.otpiska
    ? ` · <a href="${ekran(pv.otpiska)}" style="color:${CVET.seryy}">Отписаться от писем</a>`
    : '';
  return (
    '<!doctype html><html lang="ru"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>${ekran(s.tema)}</title></head>` +
    `<body style="margin:0;padding:0;background:${CVET.fon};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CVET.fon}"><tr><td align="center" style="padding:24px 16px">` +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">' +
    `<tr><td style="padding:0 4px 12px;font-size:14px;font-weight:700;color:${CVET.siniy}">${SAYT}</td></tr>` +
    `<tr><td style="background:#ffffff;border-radius:16px;border-top:4px solid ${akcent};padding:24px 20px;box-shadow:0 2px 8px rgba(28,34,51,.08)">` +
    `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${CVET.tekst}">${ekran(s.tema)}</h1>` +
    abz +
    tabl +
    knopka +
    '</td></tr>' +
    `<tr><td style="padding:16px 4px 0;font-size:13px;line-height:1.5;color:${CVET.seryy}">${ekran(pv.pochemu)}<br>` +
    `<a href="${ekran(pv.nastroyki)}" style="color:${CVET.seryy}">Настройки уведомлений</a>${otp}</td></tr>` +
    '</table></td></tr></table></body></html>'
  );
}

/** Заголовок с не-ASCII: =?UTF-8?B?…?=, куски не длиннее 75 знаков и по границе символа. */
export function zagolovok(s) {
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  const kuski = [];
  let tek = '';
  for (const ch of s) {
    if (Buffer.byteLength(tek + ch) > 42) {
      kuski.push(tek);
      tek = '';
    }
    tek += ch;
  }
  if (tek !== '') kuski.push(tek);
  return kuski.map((k) => `=?UTF-8?B?${Buffer.from(k).toString('base64')}?=`).join('\r\n ');
}

const base64 = (s) => Buffer.from(s).toString('base64').replace(/.{1,76}/g, '$&\r\n');

/**
 * Готовое письмо: { tema, tekst, html, raw } или null, если событие
 * неизвестно. cfg: { sayt, apiDomain, from, domen }.
 */
export function pismo(u, cfg) {
  const s = soderzhanie(u, cfg.sayt);
  if (s === null) return null;
  const otpiska = otpiskaHref(cfg.apiDomain, u);
  const pv = podval(u, cfg.sayt, otpiska);
  const tekst = tekstPisma(s, pv);
  const html = htmlPisma(s, pv);
  const granica = `=_${crypto.randomBytes(12).toString('hex')}`;
  const domen = cfg.from.split('@')[1] ?? 'localhost';
  const zag = [
    `From: ${zagolovok(SAYT)} <${cfg.from}>`,
    `To: <${u.to}>`,
    `Subject: ${zagolovok(s.tema)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <uved-${u.id}-${crypto.randomBytes(6).toString('hex')}@${domen}>`,
    'MIME-Version: 1.0',
    'Auto-Submitted: auto-generated',
    'X-Auto-Response-Suppress: All',
  ];
  if (otpiska) {
    zag.push(`List-Unsubscribe: <${otpiska}>`, 'List-Unsubscribe-Post: List-Unsubscribe=One-Click');
  }
  zag.push(`Content-Type: multipart/alternative; boundary="${granica}"`);
  const raw =
    zag.join('\r\n') +
    '\r\n\r\n' +
    `--${granica}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64(tekst)}` +
    `--${granica}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64(html)}` +
    `--${granica}--\r\n`;
  return { tema: s.tema, tekst, html, raw };
}
