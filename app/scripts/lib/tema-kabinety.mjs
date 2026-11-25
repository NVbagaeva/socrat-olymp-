/* scripts/lib/tema-kabinety.mjs — тёмная тема входа, кабинетов и онбординга.

   Запуск (сборка со входом, как в .github/workflows/auth.yml):
     node scripts/check-auth.mjs --tema-kabinety [папка-для-снимков]

   На моке службы входа из check-auth.mjs открываются: вход и
   регистрация (/voyti/), кабинет ученика и учителя (главная вкладка и
   «Профиль»), классы, уведомления, «Карта ЕГЭ» учителя, страница
   «Для учителя», первый визит на главную (плашка cookie и окно
   «Добро пожаловать») и тур. В тёмной теме на 1440 px на каждом экране
   axe-core (правило color-contrast) — ноль нарушений.

   С папкой — ещё снимки «светлая / тёмная» на 1440 и 375 px (JPEG):
   так их кладут в docs/skrinshoty/tema-3v/ для описания PR. */

import fs from 'node:fs';
import path from 'node:path';
import { COOKIE_NOTICE_KEY, ONBOARDING_KEY } from './cookie-notice.mjs';
import { APP } from './load-ts.mjs';

/* axe-core — не прямая зависимость: лежит в node_modules/.pnpm (его тянет
   eslint-plugin-jsx-a11y). */
const PNPM = path.join(APP, 'node_modules', '.pnpm');
const AXE_DIR = fs.readdirSync(PNPM).find((d) => d.startsWith('axe-core@'));
const AXE = AXE_DIR ? path.join(PNPM, AXE_DIR, 'node_modules', 'axe-core', 'axe.min.js') : null;
if (!AXE) throw new Error('Нет axe-core в node_modules/.pnpm — pnpm install');

/** Нарушения контраста на открытой странице: [{ id, target, summary }]. */
async function kontrast(page, oblast) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async (sel) => {
    /* global axe */
    const kontekst = sel ? { include: sel.map((x) => [x]) } : document;
    const r = await axe.run(kontekst, { runOnly: ['color-contrast'], resultTypes: ['violations'] });
    return r.violations.flatMap((v) =>
      v.nodes.map((n) => ({ target: n.target.join(' '), summary: n.failureSummary })),
    );
  }, oblast ?? null);
}

/* Онбординг лежит поверх главной (это не эта часть темы): контраст
   проверяется только у окон онбординга и плашки cookie. */
const ONBORDING = ['.intro', '.tour', '.help-fab', '.cookie-notice'];

/** Экран: в тёмной на 1440 — проверка контраста, с папкой — снимок JPEG. */
function snimok(page, { check, dir, width, tema, axeNado }) {
  return async (name, { fullPage = true, oblast } = {}) => {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    if (axeNado) {
      const bad = await kontrast(page, oblast);
      check(
        bad.length === 0,
        `тёмная, контраст AA: ${name}` + (bad.length ? ` — нарушений ${bad.length}` : ''),
      );
      for (const b of bad.slice(0, 15)) console.log(`       ${b.target}: ${b.summary}`);
    }
    if (dir) {
      await page.screenshot({
        path: path.join(dir, `${name}-${width}-${tema === 'dark' ? 'temnaya' : 'svetlaya'}.jpg`),
        type: 'jpeg',
        quality: 72,
        fullPage,
      });
    }
  };
}

export async function temaKabinety(deps, dir) {
  const { browser, SITE, makeMock, installMock, registerInMock, login, check } = deps;
  if (dir) fs.mkdirSync(dir, { recursive: true });

  const mock = makeMock();
  registerInMock(mock, 'svoy@yandex.ru', 'moy-dlinnyy-parol', 'Наталия Багаева', 'tutor');
  registerInMock(mock, 'uchenik@yandex.ru', 'uchenik-parol-1', 'Тестовый ученик 1', 'student');
  registerInMock(mock, 'vtoroy@yandex.ru', 'vtoroy-parol-123', 'Тестовый ученик 2', 'student');
  mock.seedClass('svoy@yandex.ru', ['uchenik@yandex.ru', 'vtoroy@yandex.ru']);

  const temy = dir ? ['light', 'dark'] : ['dark'];
  const shiriny = dir ? [1440, 375] : [1440];

  for (const tema of temy) {
    for (const width of shiriny) {
      const axeNado = tema === 'dark' && width === 1440;
      const context = await browser.newContext({
        viewport: { width, height: width < 500 ? 812 : 900 },
        deviceScaleFactor: 1,
        hasTouch: width < 500,
        reducedMotion: 'reduce',
      });
      /* Тема — как у человека, открывшего ?tema=dark: скрипт темы читает
         её из localStorage до первой отрисовки. */
      await context.addInitScript((t) => {
        try {
          localStorage.setItem('tema', t);
        } catch {
          /* about:blank */
        }
      }, tema);
      await installMock(context, mock);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));

      const ekran = snimok(page, { check, dir, width, tema, axeNado });

      /* Вход и регистрация. */
      await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
      check(
        (await page.evaluate(() => document.documentElement.getAttribute('data-tema'))) ===
          (tema === 'dark' ? 'dark' : null),
        `${tema} ${width}: data-tema на <html>`,
      );
      await ekran('vhod');
      await page.click('[role="tab"]:has-text("Зарегистрироваться")');
      await page.fill('input[name="name"]', 'Тестовый ученик');
      await page.fill('input[name="email"]', 'uchenik@yandex.ru');
      await page.fill('input[name="password"]', 'dlinnyy-parol-uchenika');
      await page.click('.role-card[data-role="student"]');
      await page.fill('input[name="birth-year"]', String(new Date().getFullYear() - 16));
      await page.fill('input[name="parent-email"]', 'mama@yandex.ru');
      await ekran('registraciya');
      /* Ошибки формы: пустая отправка без галочек. */
      if (axeNado) {
        await page.click('button[type="submit"]');
        await page.waitForTimeout(300);
        await ekran('registraciya-oshibki');
      }

      /* Ученик. */
      await page.evaluate(
        (key) => localStorage.setItem(key, JSON.stringify({ kinds: { '8.A': { done: 3 } } })),
        'budetege:vychisleniya-8:v1',
      );
      await login(page, 'uchenik@yandex.ru', 'uchenik-parol-1');
      await page.waitForSelector('[role="dialog"]');
      if (axeNado) await ekran('perenos-progressa', { fullPage: false });
      await page.click('[role="dialog"] button:has-text("Нет")');
      await page.waitForSelector('[role="dialog"]', { state: 'detached' });
      await page.waitForLoadState('networkidle');
      await ekran('kabinet-uchenika');
      await page.click('.kabinet__tabs [role="tab"]:has-text("Профиль")');
      await page.waitForSelector('[data-section="profile"]');
      await ekran('profil-uchenika');
      if (axeNado) {
        for (const adres of ['/kabinet/domashki/', '/kabinet/vstupit/', '/kabinet/uvedomleniya/']) {
          await page.goto(`${SITE}${adres}`, { waitUntil: 'networkidle' });
          await ekran(`uchenik${adres.replaceAll('/', '-').replace(/-$/, '')}`);
        }
      }
      await page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
      await page.click('.kabinet__tabs [role="tab"]:has-text("Профиль")');
      await page.click('[data-section="account"] button:has-text("Выйти")');
      await page.waitForURL(`${SITE}/`);

      /* Учитель. */
      await login(page, 'svoy@yandex.ru', 'moy-dlinnyy-parol');
      await page.waitForLoadState('networkidle');
      /* Вопрос о переносе прогресса — если браузер его ещё не задавал. */
      if (await page.locator('[role="dialog"]').count()) {
        await page.click('[role="dialog"] button:has-text("Нет")');
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
      }
      await ekran('kabinet-uchitelya');
      if (axeNado) {
        await page.click('.kabinet__tabs [role="tab"]:has-text("Профиль")');
        await page.waitForSelector('[data-section="profile"]');
        await ekran('profil-uchitelya');
        for (const adres of [
          '/kabinet/klassy/',
          '/kabinet/statistika/',
          '/kabinet/dz2/',
          '/kabinet/uvedomleniya/',
          '/karta/',
          '/dlya-uchitelya/',
        ]) {
          await page.goto(`${SITE}${adres}`, { waitUntil: 'networkidle' });
          await ekran(`uchitel${adres.replaceAll('/', '-').replace(/-$/, '')}`);
        }
      }
      check(
        errors.length === 0,
        `${tema} ${width}: нет ошибок на страницах` + (errors[0] ? `: ${errors[0]}` : ''),
      );
      await context.close();

      /* Первый визит на главную: плашка cookie и окно «Добро пожаловать»,
         потом тур. Отдельный контекст — без отметок «уже видел». */
      const gost = await browser.newContext({
        viewport: { width, height: width < 500 ? 812 : 900 },
        deviceScaleFactor: 1,
        hasTouch: width < 500,
        reducedMotion: 'reduce',
      });
      await gost.addInitScript(
        ([t, cookieKey, onbKey]) => {
          try {
            localStorage.setItem('tema', t);
            if (!sessionStorage.getItem('pervyy')) {
              sessionStorage.setItem('pervyy', '1');
              localStorage.removeItem(cookieKey);
              localStorage.removeItem(onbKey);
            }
          } catch {
            /* about:blank */
          }
        },
        [tema, COOKIE_NOTICE_KEY, ONBOARDING_KEY],
      );
      const p2 = await gost.newPage();
      await p2.goto(`${SITE}/`, { waitUntil: 'load' });
      await p2.waitForSelector('.intro', { timeout: 15000 });
      const skip = p2.locator('.intro__skip');
      if (await skip.count()) {
        await p2.waitForSelector('.intro__skip[data-shown]', { timeout: 10000 }).catch(() => {});
        await skip.evaluate((b) => b.click()).catch(() => {});
      }
      await p2.waitForSelector('.intro[data-phase="card"]', { timeout: 15000 });
      await p2.waitForSelector('.cookie-notice', { timeout: 5000 }).catch(() => {});
      await p2.waitForTimeout(600);
      const ekran2 = snimok(p2, { check, dir, width, tema, axeNado });
      check(
        (await p2.locator('.cookie-notice').count()) === 1,
        `${tema} ${width}: плашка cookie на месте`,
      );
      await ekran2('onbording', { fullPage: false, oblast: ONBORDING });
      await p2.getByRole('button', { name: 'Тур для учителя' }).click();
      await p2.waitForSelector('.tour-card:not(.is-hidden)', { timeout: 15000 });
      await p2.waitForTimeout(600);
      await ekran2('tur', { fullPage: false, oblast: ONBORDING });
      await gost.close();
    }
  }
}
