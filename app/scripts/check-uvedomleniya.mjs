#!/usr/bin/env node
/* scripts/check-uvedomleniya.mjs — уведомления на сайте (без сборки).

   Запуск: pnpm test:uvedomleniya

   Чистые функции src/lib/uvedomleniya/model.ts (docs/kabinet-uvedomleniya.md):
     • текст каждого события: ученику — на «ты», учителю — на «вы», без
       «мы» и без рода; название ДЗ в кавычках, без названия — «Без
       названия»; напоминания за 24 и 3 ч, срок с опозданием и без;
     • ссылка: ученику — в ДЗ, учителю — в итоги;
     • время: «только что», минуты, часы, вчера, дата;
     • счётчик: 0 — без значка, 100 — «99+»;
     • пояса и время ЧЧ:ММ — те же правила, что у базы;
     • push (PR 3г): состояние браузера (в том числе iPhone без экрана
       «Домой»), ключ VAPID, sw.js в песочнице — заголовки без названия,
       имён и рода, ссылка только на сайт; manifest. */

import { requireSrc } from './lib/load-ts.mjs';

const M = requireSrc('lib/uvedomleniya/model.ts');

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

const u = (event, extra = {}) => ({
  id: 1,
  event,
  homework_id: 'hw-1',
  payload: {},
  visible_at: '2026-11-25T10:00:00Z',
  read: false,
  title: 'ДЗ к пятнице',
  ...extra,
});

/* Тексты: у каждого события свой, без «мы» и без рода. */
const vse = [
  u('dz_novoe'),
  u('dz_izmeneno'),
  u('dz_vozvrat'),
  u('dz_kommentariy'),
  u('dz_napominanie', { payload: { za: 24 } }),
  u('dz_napominanie', { payload: { za: 3 } }),
  u('dz_srok', { payload: { pozdno: true } }),
  u('dz_srok', { payload: { pozdno: false } }),
  u('dz_sdano', { uchenik_name: 'Аня С.' }),
  u('dz_sdano', { uchenik_name: 'Аня С.', payload: { pozdno: true } }),
  u('dz_ne_sdali', { payload: { skolko: 3, vsego: 12 } }),
];
const teksty = vse.map(M.tekst);
check(new Set(teksty).size === teksty.length, 'у разных событий разные тексты');
check(
  teksty.every((x) => x.includes('«ДЗ к пятнице»')),
  'в каждом тексте название ДЗ в кавычках',
);
check(!teksty.some((x) => /(^|[^а-яё])(мы|нам|наш)/i.test(x)), 'без «мы»');
check(
  !teksty.some((x) =>
    /(^|[^а-яё])(сдал|сдала|начал|начала|получил|получила|изменил|изменила|оставил|оставила|вернул|вернула)([^а-яё]|$)/i.test(
      x,
    ),
  ),
  'без рода в тексте',
);
check(
  M.tekst(vse[4]).includes('меньше суток') && M.tekst(vse[5]).includes('меньше 3 часов'),
  'напоминания за 24 и 3 ч',
);
check(
  M.tekst(vse[6]).includes('с опозданием') && M.tekst(vse[7]).includes('приём закрыт'),
  'срок с опозданием и без',
);
check(
  M.tekst(vse[8]).startsWith('Аня С.:') && M.tekst(vse[9]).includes('с опозданием'),
  'учителю — кто сдал',
);
check(M.tekst(vse[10]).includes('не сдали 3 из 12'), 'учителю — сколько не сдали');
check(M.tekst(u('dz_novoe', { title: undefined })).includes('«Без названия»'), 'ДЗ без названия');
check(M.tekst(u('dz_sdano')).startsWith('Ученик:'), 'учителю без имени — «Ученик»');
check(
  M.SOBYTIYA.every((e) => M.tekst(u(e)) !== 'Уведомление'),
  'текст есть у каждого события',
);

/* Ссылки. */
check(
  M.ssylka(u('dz_novoe')) === '/kabinet/domashki/reshat/?id=hw-1',
  `ученику — в ДЗ (${M.ssylka(u('dz_novoe'))})`,
);
check(
  M.ssylka(u('dz_sdano')) === '/kabinet/dz2/itogi/?id=hw-1' &&
    M.ssylka(u('dz_ne_sdali')) === '/kabinet/dz2/itogi/?id=hw-1',
  'учителю — в итоги',
);
check(M.ssylka(u('dz_novoe', { homework_id: undefined })) === null, 'без ДЗ — без ссылки');
check(
  M.vazhnoe(vse[6]) &&
    M.vazhnoe(vse[2]) &&
    M.vazhnoe(vse[5]) &&
    !M.vazhnoe(vse[4]) &&
    !M.vazhnoe(vse[0]),
  'важные: срок, доработка, за 3 ч',
);

/* Время (пояс Москвы — чтобы проверка не зависела от машины). */
const now = Date.parse('2026-11-25T12:00:00Z'); // 15:00 по Москве
const tz = 'Europe/Moscow';
check(M.kogda('2026-11-25T11:59:30Z', now, tz) === 'только что', 'только что');
check(M.kogda('2026-11-25T11:55:00Z', now, tz) === '5 мин назад', '5 мин назад');
check(M.kogda('2026-11-25T09:00:00Z', now, tz) === '3 ч назад', '3 ч назад');
check(
  M.kogda('2026-11-24T15:05:00Z', now, tz) === 'вчера в 18:05',
  `вчера (${M.kogda('2026-11-24T15:05:00Z', now, tz)})`,
);
check(
  M.kogda('2026-11-12T06:30:00Z', now, tz) === '12 ноября в 9:30',
  `дата (${M.kogda('2026-11-12T06:30:00Z', now, tz)})`,
);
check(M.kogda('2026-11-25T12:05:00Z', now, tz) === 'только что', 'время из будущего — только что');

/* Счётчик. */
check(
  M.schetchik(0) === null && M.schetchik(-1) === null && M.schetchik(Number.NaN) === null,
  'ноль — без значка',
);
check(
  M.schetchik(7) === '7' && M.schetchik(99) === '99' && M.schetchik(100) === '99+',
  'счётчик до 99+',
);

/* Настройки. */
check(M.poyasa('Europe/Moscow').length === M.POYASA.length, 'Москва в списке поясов');
check(M.poyasa('Europe/Minsk').at(-1).tz === 'Europe/Minsk', 'свой пояс добавляется в список');
check(
  M.POYASA.every((p) => {
    try {
      new Intl.DateTimeFormat('ru', { timeZone: p.tz });
      return true;
    } catch {
      return false;
    }
  }),
  'все пояса списка известны',
);
check(
  M.vremyaVerno('22:00') &&
    M.vremyaVerno('08:00') &&
    !M.vremyaVerno('8:00') &&
    !M.vremyaVerno('24:00'),
  'время ЧЧ:ММ',
);
const z = M.zapros({
  sobytiya: ['dz_novoe'],
  kanaly: {},
  quiet_on: true,
  quiet_from: '22:00',
  quiet_to: '08:00',
  tz: 'Europe/Moscow',
  digest: 'day',
  dostupno: ['pochta'],
});
check(
  !('sobytiya' in z) && !('dostupno' in z) && z.quiet_from === '22:00',
  'в запросе только изменяемое',
);

/* ── Push (PR 3г) ──────────────────────────────────────────────── */

const V = (o = {}) => ({
  sw: true,
  pushManager: true,
  notification: true,
  ios: false,
  standalone: false,
  permission: 'default',
  ...o,
});
check(M.pushSostoyanie(V(), false) === 'vykl', 'push: умеет, не включён');
check(M.pushSostoyanie(V({ permission: 'granted' }), true) === 'vkl', 'push: включён');
check(M.pushSostoyanie(V({ permission: 'default' }), true) === 'vykl', 'push: подписка без разрешения — не включён');
check(M.pushSostoyanie(V({ permission: 'denied' }), true) === 'zapret', 'push: запрещён в браузере');
check(M.pushSostoyanie(V({ pushManager: false }), false) === 'net', 'push: браузер не умеет');
check(
  M.pushSostoyanie(V({ ios: true, pushManager: false, notification: false }), false) === 'ios',
  'push: iPhone в Safari — инструкция «На экран Домой»',
);
check(
  M.pushSostoyanie(V({ ios: true, standalone: true, pushManager: false }), false) === 'net',
  'push: iPhone с экрана «Домой», старая iOS — не умеет',
);
check(M.pushSostoyanie(V({ ios: true, standalone: true }), false) === 'vykl', 'push: iPhone с экрана «Домой» — можно включить');
check(
  M.etoIos('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)', 5) &&
    M.etoIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit', 5) &&
    !M.etoIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit', 0) &&
    !M.etoIos('Mozilla/5.0 (Linux; Android 14)', 5),
  'push: iPhone и iPad (в том числе «настольный» iPad)',
);
{
  const b = M.klyuchVBayty('BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4');
  check(b.length === 65 && b[0] === 4 && b[1] === 0x25 && b[64] === 0x0e, 'push: ключ VAPID → 65 байт');
}

/* sw.js — в песочнице: push показывает заголовок по типу, без названия и
   имён; нажатие открывает только адрес сайта. */
{
  const fs = await import('node:fs');
  const vm = await import('node:vm');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const kod = fs.readFileSync(path.join(app, 'public', 'sw.js'), 'utf8');
  const sobytiya = {};
  const pokazano = [];
  const otkryto = [];
  const self = {
    location: { origin: 'https://budetege.ru' },
    addEventListener: (n, f) => {
      sobytiya[n] = f;
    },
    skipWaiting: () => undefined,
    registration: {
      showNotification: (title, opts) => {
        pokazano.push({ title, opts });
        return Promise.resolve();
      },
    },
    clients: {
      claim: () => Promise.resolve(),
      matchAll: () => Promise.resolve([]),
      openWindow: (u) => {
        otkryto.push(u);
        return Promise.resolve(null);
      },
    },
  };
  vm.runInNewContext(kod, { self, URL, Promise });
  check(!('fetch' in sobytiya), 'sw.js: без обработчика fetch (страницы не трогает)');
  const push = async (d) => {
    let p;
    sobytiya.push({ data: { json: () => d }, waitUntil: (x) => (p = x) });
    await p;
    return pokazano.at(-1);
  };
  const ROD = /(^|[^а-яё])(сдал|сдала|выдал|выдала|оставил|оставила|изменил|изменила|вернул|вернула)([^а-яё]|$)/i;
  const MY = /(^|[^а-яё])(мы|нас|нам|наш|наша|наше|наши)([^а-яё]|$)/i;
  const vse = [
    { t: 'dz_novoe' }, { t: 'dz_izmeneno' }, { t: 'dz_vozvrat' }, { t: 'dz_kommentariy' },
    { t: 'dz_napominanie', za: 24 }, { t: 'dz_napominanie', za: 3 }, { t: 'dz_srok' }, { t: 'dz_srok', pozdno: true },
    { t: 'dz_sdano' }, { t: 'dz_ne_sdali' }, { t: 'neizvestnoe' },
  ];
  const zagolovki = new Set();
  for (const d of vse) {
    const n = await push({ ...d, u: '/kabinet/domashki/reshat/?id=1' });
    zagolovki.add(n.title);
    check(!ROD.test(n.title) && !MY.test(n.title) && !MY.test(n.opts.body), `sw.js: без рода и «мы» — ${n.title}`);
  }
  check(zagolovki.size === vse.length, 'sw.js: у каждого события свой заголовок');
  check(pokazano.find((n) => n.title === 'До дедлайна ДЗ меньше 3 часов') !== undefined, 'sw.js: «за 3 часа»');
  check(pokazano.find((n) => n.title === 'Срок ДЗ прошёл — сдать ещё можно') !== undefined, 'sw.js: срок с опозданием');
  const n1 = await push({ t: 'dz_novoe', u: '/kabinet/domashki/reshat/?id=1', title: 'Секретное' });
  check(!JSON.stringify(n1).includes('Секретное'), 'sw.js: лишнее из push не показывается');
  check(n1.opts.data.u === '/kabinet/domashki/reshat/?id=1' && n1.opts.icon === '/icon-192.png', 'sw.js: ссылка и значок');
  const n2 = await push({ t: 'dz_novoe', u: 'https://evil.example/x' });
  check(n2.opts.data.u === '/kabinet/uvedomleniya/', 'sw.js: чужой адрес → центр уведомлений');
  let n3;
  sobytiya.push({ data: { json: () => { throw new Error('не JSON'); } }, waitUntil: (x) => (n3 = x) });
  await n3;
  check(pokazano.at(-1).title === 'Новое уведомление', 'sw.js: пустой push — общий заголовок');
  let p4;
  sobytiya.notificationclick({
    notification: { close: () => undefined, data: { u: '/kabinet/dz2/itogi/?id=2' } },
    waitUntil: (x) => (p4 = x),
  });
  await p4;
  check(otkryto.at(-1) === '/kabinet/dz2/itogi/?id=2', 'sw.js: нажатие открывает ссылку');
  sobytiya.notificationclick({
    notification: { close: () => undefined, data: { u: '//evil.example/x' } },
    waitUntil: (x) => (p4 = x),
  });
  await p4;
  check(otkryto.at(-1) === '/kabinet/uvedomleniya/', 'sw.js: нажатие не уводит с сайта');

  const man = JSON.parse(fs.readFileSync(path.join(app, 'public', 'manifest.webmanifest'), 'utf8'));
  check(
    man.display === 'standalone' && man.start_url === '/kabinet/' &&
      man.icons.every((i) => fs.existsSync(path.join(app, 'public', i.src.slice(1)))),
    'manifest: экран «Домой», значки на месте',
  );
}

console.log(`Уведомления: ${checks} проверок, не прошло ${failures.length}.`);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
