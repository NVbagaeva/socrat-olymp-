/* scripts/lib/karta-nazad.mjs — «Карта ЕГЭ» в обоих кабинетах: снимки
   до/после на телефонах и сценарии «← К карте».

   Вызывается из scripts/check-auth.mjs (там мок службы входа):
     node scripts/check-auth.mjs --shots-karta <папка> <приставка>
       снимки карты ученика (/kabinet/) и учителя (/karta/ из меню
       кабинета) на 360, 375, 390, 414 px стоя и лёжа; приставка «do»
       или «posle» — в имени файла: do-375-uchenik.png …;
     node scripts/check-auth.mjs --karta-nazad [папка-для-снимков]
       сценарии кнопки «← К карте» и карты на телефоне (pnpm test:karta-nazad).

   Прогресс — три тестовых ученика из lib/karta/demo.ts: журналы
   кладутся прямо в «аккаунт» мока, при входе сайт тянет их к себе. */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc } from './load-ts.mjs';
import { welcomeSeen } from './onboarding.mjs';
import { kod } from './adres.mjs';

const D = requireSrc('lib/karta/demo.ts');
const C = requireSrc('lib/karta/katalog.ts');

/** Ширины телефонов стоя и те же телефоны лёжа. */
export const TELEFONY = [
  { w: 360, h: 740 },
  { w: 375, h: 812 },
  { w: 390, h: 844 },
  { w: 414, h: 896 },
];
export const LEZHA = TELEFONY.map(({ w, h }) => ({ w: h, h: w }));

export const ROLI = {
  uchenik: {
    email: 'shkolnik@yandex.ru',
    parol: 'karta-uchenik-parol',
    imya: 'Анна Смирнова',
    role: 'student',
    demo: 'seredina',
    karta: '/kabinet/',
  },
  uchitel: {
    email: 'svoy@yandex.ru',
    parol: 'karta-uchitel-parol',
    imya: 'Наталия Багаева',
    role: 'tutor',
    demo: 'pochti-vsyo',
    karta: '/karta/',
  },
};

/** Зарегистрировать обе роли в моке и положить им журналы в аккаунт. */
export function zavestiRoli(mock, registerInMock) {
  for (const r of Object.values(ROLI)) {
    if (mock.users.has(r.email)) continue;
    /* Адреса — из списка приглашённых мока (check-auth.mjs, ALLOWED). */
    registerInMock(mock, r.email, r.parol, r.imya, r.role);
    const id = mock.users.get(r.email).id;
    for (const [no, log] of Object.entries(D.demoZhurnaly(r.demo))) {
      mock.storage.push({
        user_id: id,
        key: C.KARTA_ZHURNALY[Number(no)],
        value: log,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

/** Новый контекст с моком: телефон — с касаниями. */
export async function kontekst(deps, { w, h }, dpr = 1) {
  const telefon = Math.min(w, h) < 500;
  const ctx = await deps.browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: dpr,
    hasTouch: telefon,
    isMobile: telefon,
  });
  await welcomeSeen(ctx);
  /* Освоенное уже видели: без «света» по островам, снимки ровные. */
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem(
        'budetege:karta:videl:v1',
        JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 18, 19, 21]),
      );
    } catch {
      /* без хранилища */
    }
  });
  await deps.installMock(ctx, deps.mock);
  const page = await ctx.newPage();
  return { ctx, page };
}

/** Войти ролью и открыть её карту; вопрос о переносе прогресса — «Нет». */
export async function voytiKKarte(deps, page, rol) {
  const r = ROLI[rol];
  await deps.login(page, r.email, r.parol);
  const dialog = page.locator('[role="dialog"] button:has-text("Нет")');
  if (await dialog.count()) await dialog.first().click();
  if (r.karta !== '/kabinet/') {
    /* Учитель: «Карта ЕГЭ» в меню кабинета. */
    await page.locator('.kab-menu a[href="/karta/"]').first().click();
    await page.waitForURL(`${deps.SITE}/karta/`);
  }
  await page.waitForSelector('.karta .karta-holst[data-gotov], .karta .karta-ps');
  /* Журналы приходят из аккаунта после входа: ждём прогресс на карте. */
  await page.waitForFunction(
    () => !/Освоено 0 из/.test(document.querySelector('.karta-shapka__itog')?.textContent ?? ''),
    null,
    { timeout: 15000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

/** Прокрутить так, чтобы карта стояла под шапкой сайта: снимок — то, что видит человек. */
async function kKarte(page) {
  await page.evaluate(() => {
    const el = document.querySelector('.karta-shapka') ?? document.querySelector('.karta');
    const shapka = document.querySelector('.site-head')?.getBoundingClientRect().height ?? 0;
    if (el) {
      window.scrollTo({
        top: window.scrollY + el.getBoundingClientRect().top - shapka - 8,
        behavior: 'instant',
      });
    }
  });
  await page.waitForTimeout(300);
}

/** Снимки карты обеих ролей на всех телефонах (экран, а не вся страница). */
export async function snimkiKarty(deps, dir, pristavka) {
  fs.mkdirSync(dir, { recursive: true });
  zavestiRoli(deps.mock, deps.registerInMock);
  for (const rol of Object.keys(ROLI)) {
    for (const ekran of [...TELEFONY, ...LEZHA]) {
      const glavnyy = ekran.w === 375 && ekran.h > ekran.w;
      const { ctx, page } = await kontekst(deps, ekran, glavnyy ? 2 : 1.5);
      await voytiKKarte(deps, page, rol);
      await kKarte(page);
      const imya = ekran.h > ekran.w ? `${ekran.w}` : `${ekran.w}x${ekran.h}`;
      const file = path.join(dir, `${pristavka}-${imya}-${rol}.${glavnyy ? 'png' : 'jpg'}`);
      await page.screenshot({ path: file, ...(glavnyy ? {} : { type: 'jpeg', quality: 72 }) });
      console.log(`  снимок ${path.basename(file)}`);
      await ctx.close();
    }
  }
  if (pristavka !== 'posle') return;
  /* Кнопка «← К карте»: телефон 375 и компьютер 1280. */
  for (const [ekran, imya] of [
    [{ w: 375, h: 812 }, 'knopka-k-karte-telefon.png'],
    [{ w: 1280, h: 800 }, 'knopka-k-karte-kompyuter.png'],
  ]) {
    const { ctx, page } = await kontekst(deps, ekran, 2);
    await voytiKKarte(deps, page, 'uchenik');
    await uytiSKarty(page, 8);
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, imya) });
    console.log(`  снимок ${imya}`);
    await ctx.close();
  }
}

/* ── Проверки ──────────────────────────────────────────────────── */

const VIDIMAYA = '.topic-tabs-row:not([aria-hidden="true"]) .karta-nazad';
const VKLADKA = (imya) =>
  `.topic-tabs-row:not([aria-hidden="true"]) a[role="tab"]:has-text("${imya}")`;

/** Нажать вкладку раздела в видимой копии строки; не вышло — снимок экрана. */
async function vkladka(page, imya) {
  /* Прошлый переход ещё идёт плавной сменой (View Transitions): пока она
     не кончилась, вкладки под её снимком не нажимаются. */
  await page.waitForTimeout(800);
  try {
    await page.locator(VKLADKA(imya)).click({ timeout: 10000 });
  } catch (e) {
    await page.screenshot({ path: `oshibka-vkladka-${imya}.png` }).catch(() => {});
    throw e;
  }
}

/** Выбрать раздел на карте (остров или строка списка) и уйти на «Опорные задачи». */
async function uytiSKarty(page, no) {
  if ((await page.locator('.karta-ps').count()) > 0) {
    await page.locator(`.karta-ps__knopka[data-cel="oblast:${no}"]`).click();
    await page.locator(`.karta-ps__uzel[data-no="${no}"] a:has-text("Опорные задачи")`).click();
  } else {
    await vybratOstrov(page, no);
    await page.locator('.karta-panel.is-otkryta a:has-text("Опорные задачи")').click();
  }
  await page.waitForURL(new RegExp(`/zadaniya/${kod(no)}/opornye-zadachi/$`));
  await page.waitForSelector(VIDIMAYA);
}

async function vybratOstrov(page, no) {
  const box = await page.locator(`.karta-ostrov__kontur[data-cel="oblast:${no}"]`).boundingBox();
  if (box === null) throw new Error(`нет острова ${no}`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForSelector('.karta-panel.is-otkryta');
  await page.waitForTimeout(700);
}

/** Состояние карты: где она на экране, вид холста, выбор, подсветка. */
function sostoyanie(page) {
  return page.evaluate(() => {
    const holst = document.querySelector('.karta-holst');
    const karta = document.querySelector('.karta');
    const svet =
      document.querySelector('.karta-ostrov.is-vernulis .karta-ostrov__kontur')?.dataset.cel ??
      (document.querySelector('.karta-ps__uzel.is-vernulis')
        ? `oblast:${document.querySelector('.karta-ps__uzel.is-vernulis').dataset.no}`
        : null);
    return {
      verh: Math.round(karta?.getBoundingClientRect().top ?? -9999),
      vid: holst
        ? ['--k', '--x', '--y'].map((v) => parseFloat(holst.style.getPropertyValue(v)))
        : null,
      vybran:
        document.querySelector('.karta-ostrov.is-vybran .karta-ostrov__kontur')?.dataset.cel ??
        document.querySelector('.karta-ps__uzel.is-otkryt .karta-ps__knopka')?.dataset.cel ??
        null,
      svetitsya: svet,
    };
  });
}

const blizko = (a, b, d = 2) => Math.abs(a - b) <= d;
const peresek = (a, b) =>
  a !== null && b !== null && a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom;

/** Коробки кнопки, нижней панели и «?». */
function korobki(page) {
  return page.evaluate((sel) => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (r.width === 0 || st.visibility === 'hidden' || st.display === 'none') return null;
      if (st.opacity === '0') return null;
      return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
    };
    return {
      knopka: box(document.querySelector(sel)),
      bnav: box(document.querySelector('.bnav')),
      fab: box(document.querySelector('.help-fab')),
      vh: window.innerHeight,
      vw: window.innerWidth,
    };
  }, VIDIMAYA);
}

/** Карта на экране: прокрутка вбок, кегль подписей, размер узлов, наложения. */
export function zamery(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const r = (el) => el.getBoundingClientRect();
    const uzly = [...document.querySelectorAll('.karta-ps__knopka, .karta-ostrov__kontur')].map(r);
    const podpisi = [
      ...document.querySelectorAll('.karta-ps__imya, .karta-ps__status, .karta-podpis__nazvanie'),
    ];
    const kegli = podpisi.map((el) => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const m = el instanceof SVGGraphicsElement ? el.getScreenCTM() : null;
      return m === null ? fs : fs * Math.hypot(m.a, m.b);
    });
    const kor = podpisi.map(r).filter((b) => b.width > 0);
    let nalozheniy = 0;
    for (let i = 0; i < kor.length; i += 1) {
      for (let j = i + 1; j < kor.length; j += 1) {
        const a = kor[i];
        const b = kor[j];
        if (
          a.left < b.right - 1 &&
          b.left < a.right - 1 &&
          a.top < b.bottom - 1 &&
          b.top < a.bottom - 1
        ) {
          nalozheniy += 1;
        }
      }
    }
    return {
      spisok: document.querySelector('.karta-ps') !== null,
      vbok: document.documentElement.scrollWidth > vw + 1,
      minKegl: kegli.length ? Math.min(...kegli) : 0,
      minUzel: uzly.length ? Math.min(...uzly.map((b) => Math.min(b.width, b.height))) : 0,
      zaKraem: kor.filter((b) => b.left < -1 || b.right > vw + 1).length,
      nalozheniy,
      znachkov: document.querySelectorAll('.karta-ps__metka svg').length,
      uzlov: document.querySelectorAll('.karta-ps__knopka').length,
    };
  });
}

/** Нет ли на странице кнопки «← К карте». */
async function bezKnopki(page) {
  await page.waitForTimeout(400);
  return (await page.locator('.karta-nazad').count()) === 0;
}

/** Сценарии «← К карте» и карты на телефоне для обеих ролей. */
export async function proverkiKartaNazad(deps, shots) {
  const { check, SITE } = deps;
  zavestiRoli(deps.mock, deps.registerInMock);
  if (shots) fs.mkdirSync(shots, { recursive: true });

  for (const rol of Object.keys(ROLI)) {
    const kto = rol === 'uchenik' ? 'ученик' : 'учитель';
    const kartaUrl = `${SITE}${ROLI[rol].karta}`;
    const naKarte = async (page, sel) => {
      await page.waitForURL(kartaUrl);
      await page.waitForSelector(sel);
      await page.waitForTimeout(150);
    };

    /* ── Компьютер: острова ─────────────────────────────────────── */
    {
      const { ctx, page } = await kontekst(deps, { w: 1280, h: 860 });
      const oshibki = [];
      page.on('pageerror', (e) => oshibki.push(e.message));
      await voytiKKarte(deps, page, rol);
      check(await bezKnopki(page), `${kto}, 1280: на самой карте кнопки «← К карте» нет`);
      await page.evaluate(() => window.scrollTo({ top: 140, behavior: 'instant' }));
      await vybratOstrov(page, 8);
      const do1 = await sostoyanie(page);
      const dlina0 = await page.evaluate(() => history.length);
      await page.locator('.karta-panel.is-otkryta a:has-text("Опорные задачи")').click();
      await page.waitForURL(/\/zadaniya\/8\/opornye-zadachi\/$/);
      await page.waitForSelector(VIDIMAYA);
      const k1 = await korobki(page);
      check(
        k1.knopka !== null && k1.knopka.w >= 44 && k1.knopka.h >= 44,
        `${kto}, 1280: «← К карте» видна, не меньше 44×44 (${k1.knopka?.w}×${k1.knopka?.h})`,
      );
      check(
        (await page.locator(VIDIMAYA).innerText()).replace(/\s+/g, ' ').trim() === '← К карте',
        `${kto}, 1280: надпись «← К карте»`,
      );
      const vRyadu = await page.evaluate(() => {
        const k = document.querySelector('.topic-tabs-row .karta-nazad');
        const t = k?.parentElement?.querySelector('.topic-tabs');
        if (!k || !t) return false;
        const a = k.getBoundingClientRect();
        const b = t.getBoundingClientRect();
        return a.bottom > b.top && a.top < b.bottom && a.right <= b.left + 1;
      });
      check(vRyadu, `${kto}, 1280: кнопка в строке вкладок, слева от них`);
      await page.evaluate(() => window.scrollTo({ top: 1600, behavior: 'instant' }));
      await page.waitForTimeout(400);
      const k2 = await korobki(page);
      check(
        k2.knopka !== null && k2.knopka.y >= 0 && k2.knopka.bottom <= k2.vh,
        `${kto}, 1280: на прокрутке кнопка в липкой панели на экране`,
      );
      /* Вкладка → другая вкладка → другое задание. */
      await vkladka(page, 'Тренажёр');
      await page.waitForURL(/\/zadaniya\/8\/trenazher\//);
      await page.waitForSelector(VIDIMAYA);
      check(true, `${kto}, 1280: на вкладке «Тренажёр» кнопка есть`);
      await vkladka(page, 'Теория');
      await page.waitForURL(/\/zadaniya\/8\/teoriya\//);
      await page.waitForSelector(VIDIMAYA);
      check(true, `${kto}, 1280: на вкладке «Теория» кнопка есть`);
      /* Другое задание — ссылкой со страницы задания. */
      await page.evaluate(() => {
        const a = document.createElement('a');
        a.href = '/zadaniya/veroyatnost/';
        a.id = 'drugoe-zadanie';
        a.textContent = '№4';
        a.style.cssText =
          'position:fixed;left:45%;top:45%;z-index:9999;padding:16px;background:#fff';
        document.querySelector('main')?.prepend(a);
      });
      await page.waitForTimeout(800);
      await page.click('#drugoe-zadanie');
      await page.waitForURL(`${SITE}/zadaniya/veroyatnost/`);
      await page.waitForSelector(VIDIMAYA);
      check(true, `${kto}, 1280: на другом задании (№4) кнопка есть`);
      const dlina1 = await page.evaluate(() => history.length);
      check(
        dlina1 === dlina0 + 1,
        `${kto}, 1280: вкладки и задания не копят историю (было ${dlina0}, стало ${dlina1})`,
      );
      await page.waitForTimeout(800);
      await page.locator(VIDIMAYA).click();
      await naKarte(page, '.karta .karta-holst[data-gotov]');
      const s1 = await sostoyanie(page);
      check(
        s1.svetitsya === 'oblast:8',
        `${kto}, 1280: вернулись — раздел №8 подсвечен (${s1.svetitsya})`,
      );
      await page.waitForTimeout(600);
      const posle1 = await sostoyanie(page);
      check(
        blizko(posle1.verh, do1.verh, 3),
        `${kto}, 1280: та же прокрутка (${do1.verh} → ${posle1.verh})`,
      );
      check(
        do1.vid !== null &&
          posle1.vid !== null &&
          do1.vid.every((v, i) => blizko(v, posle1.vid[i], 1)),
        `${kto}, 1280: тот же вид карты (${do1.vid} → ${posle1.vid})`,
      );
      check(posle1.vybran === 'oblast:8', `${kto}, 1280: выбран тот же раздел №8`);
      await page.waitForTimeout(800);
      check(
        (await sostoyanie(page)).svetitsya === null,
        `${kto}, 1280: подсветка гаснет примерно через секунду`,
      );
      check(
        (await page.evaluate(() => sessionStorage.getItem('budetege:karta-nazad:v1'))) === null,
        `${kto}, 1280: метка снята после возврата`,
      );

      /* «Назад» браузера: карта → задание → вкладка → назад. */
      await page.evaluate(() => window.scrollTo({ top: 60, behavior: 'instant' }));
      await page.waitForTimeout(200);
      const do2 = await sostoyanie(page);
      await page.locator('.karta-panel.is-otkryta a:has-text("Опорные задачи")').click();
      await page.waitForURL(/opornye-zadachi\/$/);
      await page.waitForSelector(VIDIMAYA);
      await vkladka(page, 'Тренажёр');
      await page.waitForURL(/trenazher\//);
      await page.goBack();
      await naKarte(page, '.karta .karta-holst[data-gotov]');
      const s2 = await sostoyanie(page);
      check(
        s2.svetitsya === 'oblast:8',
        `${kto}, 1280: «назад» браузера — сразу на карту, №8 подсвечен`,
      );
      await page.waitForTimeout(600);
      const posle2 = await sostoyanie(page);
      check(
        blizko(posle2.verh, do2.verh, 3) && posle2.vybran === 'oblast:8',
        `${kto}, 1280: после «назад» — та же прокрутка и выбор (${do2.verh} → ${posle2.verh})`,
      );

      /* Карта → задание → главная → задание: кнопки уже нет. */
      await page.locator('.karta-panel.is-otkryta a:has-text("Опорные задачи")').click();
      await page.waitForSelector(VIDIMAYA);
      await page.evaluate(() => {
        const a = document.createElement('a');
        a.href = '/';
        a.id = 'na-glavnuyu';
        a.textContent = 'Главная';
        a.style.cssText =
          'position:fixed;left:45%;top:45%;z-index:9999;padding:16px;background:#fff';
        document.querySelector('main')?.prepend(a);
      });
      await page.waitForTimeout(800);
      await page.click('#na-glavnuyu');
      await page.waitForURL(`${SITE}/`);
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const a = document.createElement('a');
        a.href = '/zadaniya/vychisleniya/teoriya/';
        a.id = 'zadanie-s-glavnoy';
        a.textContent = '№8';
        a.style.cssText =
          'position:fixed;left:45%;top:45%;z-index:9999;padding:16px;background:#fff';
        document.body.prepend(a);
      });
      await page.waitForTimeout(800);
      await page.click('#zadanie-s-glavnoy');
      await page.waitForURL(/\/zadaniya\/8\/teoriya\/$/);
      await page.waitForSelector('.topic-tabs-row');
      check(await bezKnopki(page), `${kto}, 1280: карта → задание → главная → задание: кнопки нет`);
      check(oshibki.length === 0, `${kto}, 1280: ошибок на страницах нет ${oshibki.join(' | ')}`);
      await ctx.close();
    }

    /* ── Прямая ссылка и главная в новом окне ───────────────────── */
    {
      const { ctx, page } = await kontekst(deps, { w: 1280, h: 860 });
      await deps.login(page, ROLI[rol].email, ROLI[rol].parol);
      await page.goto(`${SITE}/zadaniya/vychisleniya/opornye-zadachi/`, {
        waitUntil: 'networkidle',
      });
      check(await bezKnopki(page), `${kto}: по прямой ссылке кнопки нет`);
      await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
      await page.locator('a[href^="/zadaniya/"]').first().click();
      await page.waitForURL(/\/zadaniya\//);
      check(await bezKnopki(page), `${kto}: с главной кнопки нет`);
      await ctx.close();
    }

    /* ── Телефон 375: список и кнопка ─────────────────────────────── */
    {
      const { ctx, page } = await kontekst(deps, { w: 375, h: 812 });
      await voytiKKarte(deps, page, rol);
      check((await zamery(page)).spisok, `${kto}, 375: карта — список сверху вниз`);
      await page.locator('.karta-ps__knopka[data-cel="oblast:8"]').click();
      /* Ссылку — на экран заранее: Playwright сам докрутил бы до неё при нажатии. */
      const opornye = page.locator('.karta-ps__uzel[data-no="8"] a:has-text("Опорные задачи")');
      await opornye.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(200);
      const do1 = await sostoyanie(page);
      await opornye.click();
      await page.waitForURL(/opornye-zadachi\/$/);
      await page.waitForSelector(VIDIMAYA);
      for (const [gde, top] of [
        ['вверху страницы', 0],
        ['на прокрутке', 1400],
      ]) {
        await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), top);
        await page.waitForTimeout(400);
        const k = await korobki(page);
        check(
          k.knopka !== null && k.knopka.y >= 0 && k.knopka.bottom <= k.vh && k.knopka.right <= k.vw,
          `${kto}, 375: ${gde} «← К карте» на экране`,
        );
        check(
          k.knopka !== null && k.knopka.w >= 44 && k.knopka.h >= 44,
          `${kto}, 375: ${gde} кнопка не меньше 44×44 (${k.knopka?.w}×${k.knopka?.h})`,
        );
        check(
          !peresek(k.knopka, k.bnav) && !peresek(k.knopka, k.fab),
          `${kto}, 375: ${gde} кнопка не заходит на нижнюю панель и «?»`,
        );
      }
      if (shots) await page.screenshot({ path: path.join(shots, `karta-nazad-375-${rol}.png`) });
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        `${kto}, 375: на странице задания с кнопкой прокрутки вбок нет`,
      );
      await vkladka(page, 'Теория');
      await page.waitForURL(/teoriya\//);
      await page.waitForSelector(VIDIMAYA);
      await page.waitForTimeout(800);
      await page.locator(VIDIMAYA).click();
      await naKarte(page, '.karta-ps');
      const s1 = await sostoyanie(page);
      check(s1.svetitsya === 'oblast:8', `${kto}, 375: вернулись — №8 подсвечен`);
      await page.waitForTimeout(600);
      const posle1 = await sostoyanie(page);
      check(
        blizko(posle1.verh, do1.verh, 3) && posle1.vybran === 'oblast:8',
        `${kto}, 375: та же прокрутка и раскрыт №8 (${do1.verh} → ${posle1.verh})`,
      );
      /* Жест «назад». */
      await page.locator('.karta-ps__uzel[data-no="8"] a:has-text("Опорные задачи")').click();
      await page.waitForSelector(VIDIMAYA);
      await vkladka(page, 'Тренажёр');
      await page.waitForURL(/trenazher\//);
      await page.goBack();
      await naKarte(page, '.karta-ps__uzel.is-otkryt[data-no="8"]');
      check(true, `${kto}, 375: «назад» — сразу на карту, №8 раскрыт`);
      await ctx.close();
    }

    /* ── Карта на телефонах стоя и лёжа ───────────────────────────── */
    for (const ekran of [...TELEFONY, ...LEZHA]) {
      const imya = `${ekran.w}×${ekran.h}`;
      const { ctx, page } = await kontekst(deps, ekran);
      await voytiKKarte(deps, page, rol);
      /* Раскрытый раздел тоже не ломает раскладку. */
      await page.locator('.karta-ps__knopka[data-cel="oblast:8"]').click();
      await page.waitForTimeout(200);
      const z = await zamery(page);
      check(z.spisok, `${kto}, ${imya}: карта списком`);
      check(!z.vbok, `${kto}, ${imya}: прокрутки вбок нет`);
      check(z.minKegl >= 14, `${kto}, ${imya}: подписи не мельче 14 px (${z.minKegl})`);
      check(z.minUzel >= 44, `${kto}, ${imya}: узлы не меньше 44 px (${Math.round(z.minUzel)})`);
      check(
        z.nalozheniy === 0 && z.zaKraem === 0,
        `${kto}, ${imya}: подписи не налезают и не обрезаны (${z.nalozheniy}, ${z.zaKraem})`,
      );
      check(
        z.znachkov === z.uzlov && z.uzlov > 0,
        `${kto}, ${imya}: у каждого узла значок состояния`,
      );
      const kraya = await page.evaluate(() => {
        const ps = [...document.querySelectorAll('.karta-ps__knopka')];
        const pervyy = ps[0];
        const posledniy = ps[ps.length - 1];
        const shapka = document.querySelector('.site-head');
        const nav = document.querySelector('.bnav');
        const navTop =
          nav && getComputedStyle(nav).display !== 'none'
            ? nav.getBoundingClientRect().top
            : innerHeight;
        window.scrollTo({ top: 0, behavior: 'instant' });
        const shapkaNiz = shapka ? shapka.getBoundingClientRect().bottom : 0;
        const verhOk =
          (document.querySelector('.karta')?.getBoundingClientRect().top ?? 0) >= shapkaNiz - 1 &&
          pervyy.getBoundingClientRect().left >= 0;
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
        const niz = posledniy.getBoundingClientRect();
        const nizOk = niz.bottom <= navTop + 1 || niz.top > innerHeight;
        posledniy.scrollIntoView({ block: 'end' });
        return { verhOk, nizOk };
      });
      check(kraya.nizOk, `${kto}, ${imya}: последний раздел не под нижней панелью`);
      check(kraya.verhOk, `${kto}, ${imya}: первый раздел не под шапкой сайта`);
      await ctx.close();
    }
  }

  /* ── Тренировка не сбрасывается при возврате на карту ───────────── */
  {
    const { ctx, page } = await kontekst(deps, { w: 1280, h: 860 });
    await voytiKKarte(deps, page, 'uchenik');
    await vybratOstrov(page, 8);
    await page.locator('.karta-panel.is-otkryta a.karta-knopka--glavnaya').click();
    await page.waitForURL(/\/zadaniya\/8\/trenazher\//);
    await page.waitForSelector('.trn-start');
    await page.locator('.trn-rezhim:has-text("Выбрать темы")').click();
    await page.locator('.trn-seg button').filter({ hasText: /^5$/ }).first().click();
    await page.locator('.trn-vybor__start').click();
    await page.waitForSelector('.trn-zadacha[data-task]');
    const zadacha = await page.locator('.trn-zadacha[data-task]').getAttribute('data-task');
    await page.goBack();
    await page.waitForURL(`${SITE}/kabinet/`);
    await page.waitForSelector('.karta-panel.is-otkryta');
    check(true, 'тренировка: «назад» из тренажёра — сразу на карту');
    await page.locator('.karta-panel.is-otkryta a.karta-knopka--glavnaya').click();
    await page.waitForURL(/\/zadaniya\/8\/trenazher\//);
    await page.waitForSelector('.trn-zadacha[data-task]', { timeout: 10000 }).catch(() => null);
    const snova = await page
      .locator('.trn-zadacha[data-task]')
      .getAttribute('data-task', { timeout: 2000 })
      .catch(() => null);
    check(
      snova === zadacha,
      `тренировка: после карты та же задача тренировки (${zadacha} → ${snova})`,
    );
    await ctx.close();
  }
}
