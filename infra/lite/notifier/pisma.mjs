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
  if (s.posle?.length) linii.push('', ...s.posle);
  linii.push('', '—', `${SAYT}`, pv.pochemu);
  if (pv.nastroyki) linii.push(`Настройки уведомлений: ${pv.nastroyki}`);
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
  const posle = (s.posle ?? [])
    .map((t) => `<p style="margin:16px 0 0;font-size:15px;line-height:1.5;color:${CVET.seryy}">${ekran(t)}</p>`)
    .join('');
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
    posle +
    '</td></tr>' +
    `<tr><td style="padding:16px 4px 0;font-size:13px;line-height:1.5;color:${CVET.seryy}">${ekran(pv.pochemu)}<br>` +
    (pv.nastroyki ? `<a href="${ekran(pv.nastroyki)}" style="color:${CVET.seryy}">Настройки уведомлений</a>${otp}` : '') +
    '</td></tr>' +
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
  return mime(s, podval(u, cfg.sayt, otpiska), { to: u.to, id: `uved-${u.id}`, otpiska }, cfg);
}

/* ── Письмо родителю ученика младше 18 ─────────────────────────── */

export const DOKUMENTY = {
  soglasie: '/soglasie/#variant-b',
  politika: '/politika/',
};

export function roditelHref(apiDomain, token) {
  return `https://${apiDomain}/roditel?t=${encodeURIComponent(token)}`;
}

/**
 * Письмо родителю: ученик (имя из профиля) указал этот адрес при
 * регистрации; ссылка ведёт на страницу подтверждения рассыльщика
 * (/roditel через Caddy). r — строка roditel_zabrat.
 */
export function pismoRoditelyu(r, cfg) {
  const imyaUchenika = r.imya === undefined || r.imya === null || r.imya === '' ? 'без имени' : r.imya;
  const s = {
    tema: 'Согласие родителя — Будет на ЕГЭ',
    abzacy: [
      `Здравствуйте! На сайте budetege.ru — это тренажёры для подготовки к ЕГЭ по математике — зарегистрирован ученик «${imyaUchenika}», и при регистрации ваш адрес указан как адрес родителя.`,
      'Ученику младше 18 лет для сохранения прогресса, домашних заданий и решений нужно согласие родителя на обработку персональных данных.',
      `Прочитать согласие: ${cfg.sayt}${DOKUMENTY.soglasie}. Политика обработки данных: ${cfg.sayt}${DOKUMENTY.politika}.`,
      'Если вы согласны, нажмите кнопку ниже и подтвердите на открывшейся странице. Ссылка действует 14 дней.',
    ],
    knopka: { tekst: 'Перейти к подтверждению', href: roditelHref(cfg.apiDomain, r.token) },
  };
  const pv = {
    pochemu:
      'Письмо пришло, потому что этот адрес указали при регистрации на сайте. Если вы не знаете этого ученика, ничего не делайте: без вашего подтверждения его данные о прогрессе не сохраняются.',
    nastroyki: null,
    otpiska: null,
  };
  return mime(s, pv, { to: r.parent_email, id: `roditel-${r.user_id}`, otpiska: null }, cfg);
}

function mime(s, pv, { to, id, otpiska, otvet = null }, cfg) {
  const tekst = tekstPisma(s, pv);
  const html = htmlPisma(s, pv);
  const granica = `=_${crypto.randomBytes(12).toString('hex')}`;
  const domen = cfg.from.split('@')[1] ?? 'localhost';
  const zag = [
    `From: ${zagolovok(SAYT)} <${cfg.from}>`,
    `To: <${to}>`,
    ...(otvet ? [`Reply-To: <${otvet}>`] : []),
    `Subject: ${zagolovok(s.tema)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${id}-${crypto.randomBytes(6).toString('hex')}@${domen}>`,
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

/* ── Письма об оплате (docs/oplata-robokassa.md) ──────────────────── */

/**
 * Адреса страниц сайта в письмах об оплате. Совпадение с константами
 * сайта (howto.ts, variant.ts, dz/links.ts, onboarding.ts, tarify/href.ts,
 * legal/prodavets.ts, paths.ts) проверяет check.mjs.
 */
export const ADRESA_OPLATY = {
  kakPolzovatsya: '/kak-polzovatsya/',
  zadaniya: '/zadaniya/',
  variantOnlayn: '/variant/onlayn/',
  kabinet: '/kabinet/',
  klassy: '/kabinet/klassy/',
  dzVydat: '/kabinet/dz-vydat/',
  generator: '/zadaniya/tekstovye-zadachi/generator/',
  tarify: '/tarify/',
  oferta: '/oferta/',
};

/** Почта для вопросов: на неё же уходит «Ответить» (Reply-To). */
export const POCHTA_VOPROSOV = 'socratic@budetege.ru';

const TARIF = { uchenik: 'Ученик', repetitor: 'Учитель' };

/** «4 990 ₽» — с неразрывными пробелами. */
export const rubli = (summa) => `${Number(summa).toLocaleString('ru-RU').replace(/\s/g, ' ')} ₽`;

/**
 * Конец доступа по Москве: ровно полночь — «30 июня 2027 включительно»,
 * иначе дата и время: «28 декабря 2026, 16:05 (МСК)».
 */
export function doKogda(iso) {
  const d = new Date(iso);
  const chasti = Object.fromEntries(
    new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  const data = (x) =>
    x.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '');
  if (chasti.hour === '00' && chasti.minute === '00') return `${data(new Date(d.getTime() - 1000))} включительно`;
  return `${data(d)}, ${chasti.hour}:${chasti.minute} (МСК)`;
}

/** Содержание письма об оплате; r — строка oplata_pisma_zabrat. */
export function soderzhanieOplaty(r, sayt) {
  const tarif = TARIF[r.tarif];
  if (!tarif) return null;
  const uchenik = r.tarif === 'uchenik';
  const do_ = doKogda(r.dostup_do);
  const a = (k) => `${sayt}${ADRESA_OPLATY[k]}`;
  const knopka = uchenik
    ? { tekst: 'Перейти к занятиям', href: a('zadaniya') }
    : { tekst: 'Открыть кабинет', href: a('kabinet') };
  const sNachat = uchenik
    ? [
        { nazvanie: 'Как пользоваться сайтом', href: a('kakPolzovatsya'), tekst: 'коротко про теорию, опорные задачи и тренажёр' },
        { nazvanie: 'Тренажёр', href: a('zadaniya'), tekst: 'теперь без ограничений, с подсказками к каждому шагу' },
        { nazvanie: 'Варианты онлайн', href: a('variantOnlayn'), tekst: 'все варианты с баллами' },
        { nazvanie: 'Кабинет', href: a('kabinet'), tekst: 'работа над ошибками, прогресс и история решений' },
      ]
    : [
        { nazvanie: 'Как пользоваться сайтом', href: a('kakPolzovatsya'), tekst: 'коротко про разделы, генератор и классы' },
        { nazvanie: 'Создать класс', href: a('klassy'), tekst: 'до 30 учеников, они вступают по коду' },
        { nazvanie: 'Выдать домашнее задание', href: a('dzVydat'), tekst: 'ученики решают его бесплатно, результаты видны в таблице' },
        { nazvanie: 'Генератор и «Собрать вариант»', href: a('generator'), tekst: 'теперь без ограничений, листы с решениями' },
      ];
  const voprosy = `Вопросы и возврат — просто ответь${uchenik ? '' : 'те'} на это письмо или напиши${uchenik ? '' : 'те'} на ${POCHTA_VOPROSOV}. Условия — в оферте: ${a('oferta')}`;
  const chek = 'Чек об оплате придёт отдельным письмом.';
  const vhod = uchenik
    ? 'ничего вводить не нужно, просто заходи на сайт с этой почтой'
    : 'ничего вводить не нужно, просто войдите на сайт с этой почтой';
  const bezAvto = 'Автопродления нет: доступ закончится сам, деньги больше не спишутся.';
  switch (r.vid) {
    case 'oplachen':
      return {
        tema: `Доступ «${tarif}» открыт 🎉`,
        abzacy: [
          `Оплата ${rubli(r.summa)} прошла. Тариф «${tarif}» уже работает в ${uchenik ? 'твоём' : 'вашем'} аккаунте: ${vhod}.`,
          `Действует до ${do_}. ${bezAvto}`,
          'С чего начать:',
        ],
        stroki: sNachat,
        knopka,
        posle: [chek, voprosy],
      };
    case 'prodlen':
      return {
        tema: `Доступ «${tarif}» продлён 🎉`,
        abzacy: [
          `Оплата ${rubli(r.summa)} прошла. Тариф «${tarif}» продлён: новый срок продолжает текущий, ни один день не пропадёт.`,
          `Теперь действует до ${do_}. ${bezAvto}`,
        ],
        knopka,
        posle: [chek, voprosy],
      };
    case 'konec':
      return {
        tema: `Доступ «${tarif}» заканчивается`,
        abzacy: [
          `Тариф «${tarif}» действует до ${do_}. После этого останется бесплатный доступ, а всё решённое сохранится в аккаунте.`,
          `Продлить можно на странице тарифов: новый срок начнётся с конца текущего, ни один день не пропадёт.`,
        ],
        knopka: { tekst: 'Продлить доступ', href: a('tarify') },
        vazhnoe: true,
        posle: [voprosy],
      };
    default:
      return null;
  }
}

/** Готовое письмо об оплате или null (неизвестный вид или тариф). */
export function pismoOplaty(r, cfg) {
  const s = soderzhanieOplaty(r, cfg.sayt);
  if (s === null) return null;
  const pv = {
    pochemu:
      r.vid === 'konec'
        ? 'Письмо пришло, потому что на сайте оплачен тариф и его срок подходит к концу.'
        : 'Письмо пришло, потому что на сайте оплачен тариф.',
    nastroyki: null,
    otpiska: null,
  };
  return mime(s, pv, { to: r.to, id: `oplata-${r.id}`, otpiska: null, otvet: cfg.otvet ?? POCHTA_VOPROSOV }, cfg);
}
