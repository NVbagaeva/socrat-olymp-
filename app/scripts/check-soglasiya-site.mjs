#!/usr/bin/env node
/* scripts/check-soglasiya-site.mjs — правовые страницы, подвал, баннер
   cookie и экраны согласий в браузере.

   Запуск:
     pnpm test:soglasiya-site [--shots <папка>]
       — после сборки (LEGAL_DRAFT=1 pnpm build): страницы /politika/,
         /soglasie/, /soglashenie/ открываются без входа, разрешены к
         индексации, с заголовком, датой редакции и оглавлением; якоря
         вариантов согласия; ссылки и строка оператора в подвале;
         баннер cookie показывается один раз.
     pnpm test:soglasiya-site --demo http://127.0.0.1:3000 [--shots <папка>]
       — на витрине /styleguide/soglasiya/ (next dev или SOGLASIYA=1):
         без галочек кнопка неактивна; регистрация пишет согласия в
         таблицу; ученику младше 18 — письмо родителю, плашка, повтор не
         чаще раза в минуту, подтверждение по ссылке; новая редакция —
         окно с галочками; удаление оставляет только журнал согласий.

   --shots — снимки на 1440 и 390. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const DEMO = opt('--demo');
const SHOTS = opt('--shots');
const WIDTHS = [1440, 390];
const OUT = path.join(APP, 'out');
const PORT = 4190;

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
};
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

async function shot(page, name, full = true) {
  if (!SHOTS) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
};
function serve() {
  return http.createServer((req, res) => {
    let file = path.join(OUT, decodeURIComponent((req.url ?? '/').split('?')[0]));
    if (!file.startsWith(OUT)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return res.writeHead(404).end('404');
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

/* Баннер cookie и окно приветствия в снимках и шагах витрины не нужны:
   отмечаем прочитанными. */
const SEEN = () => {
  localStorage.setItem('budetege:cookie-notice:v1', JSON.stringify({ seen: true }));
  localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true }));
};

async function sitePart(browser, base) {
  for (const [put, title, toc] of [
    ['/politika/', 'Политика в отношении обработки персональных данных', 11],
    ['/soglasie/', 'Согласие на обработку персональных данных', 2],
    ['/soglashenie/', 'Пользовательское соглашение', 8],
  ]) {
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await ctx.addInitScript(SEEN);
      const page = await ctx.newPage();
      const res = await page.goto(base + put, { waitUntil: 'networkidle' });
      check(res?.status() === 200, `${put}: ответ ${res?.status()}`);
      if (width === 1440) {
        check((await page.locator('h1').textContent())?.trim() === title, `${put}: заголовок`);
        check(
          (await page.locator('.legal__edition').textContent())?.includes('Редакция от'),
          `${put}: нет даты редакции`,
        );
        check(
          (await page.locator('.legal-toc__side a').count()) === toc,
          `${put}: в оглавлении не ${toc} пунктов`,
        );
        check(
          await page.locator('.legal-toc__side').isVisible(),
          `${put}: оглавление сбоку не видно на 1440`,
        );
        const robots = await page.locator('meta[name="robots"]').getAttribute('content');
        check(robots === 'index, follow', `${put}: meta robots «${robots}»`);
        check(
          (await page.locator('a[href="/politika/"]').count()) > 0,
          `${put}: нет ссылки на политику`,
        );
      } else {
        check(
          await page.locator('.legal-toc__fold').isVisible(),
          `${put}: оглавление-список не видно на ${width}`,
        );
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        check(over <= 0, `${put}: страница едет вбок на ${width} (${over}px)`);
      }
      await shot(page, `${put.replaceAll('/', '')}-${width}`);
      await ctx.close();
    }
  }

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/soglasie/#variant-b`, { waitUntil: 'networkidle' });
  check(
    (await page.locator('#variant-a').count()) === 1 &&
      (await page.locator('#variant-b').count()) === 1,
    '/soglasie/: нет якорей variant-a/variant-b',
  );
  const top = await page.locator('#variant-b').evaluate((el) => el.getBoundingClientRect().top);
  check(
    top >= 60 && top < 200,
    `/soglasie/#variant-b: заголовок не у верха экрана (${Math.round(top)}px)`,
  );

  /* Подвал и баннер — на главной, первый визит. */
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const foot = page.locator('.site-foot');
  check(
    (await foot.locator('a[href="/politika/"]').textContent()) === 'Политика конфиденциальности',
    'подвал: нет «Политика конфиденциальности»',
  );
  check(
    (await foot.locator('a[href="/soglashenie/"]').textContent()) === 'Пользовательское соглашение',
    'подвал: нет «Пользовательское соглашение»',
  );
  check(
    (await foot.textContent())?.includes('Оператор персональных данных:'),
    'подвал: нет строки оператора',
  );
  const banner = page.locator('.cookie-notice');
  check(await banner.isVisible(), 'баннер cookie не показался при первом визите');
  check(
    (await banner.textContent())?.includes(
      'Сайт использует необходимые cookie — для входа и сохранения настроек. Подробнее — в политике.',
    ),
    'баннер cookie: текст',
  );
  check((await banner.locator('button').count()) === 1, 'баннер cookie: кнопок не одна');
  check(
    (await banner.locator('a').getAttribute('href')) === '/politika/#razdel-7',
    'баннер: ссылка не на раздел cookie политики',
  );
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await shot(page, `banner-cookie-${width}`, false);
    await foot.scrollIntoViewIfNeeded();
    await shot(page, `podval-${width}`, false);
  }
  await banner.locator('button', { hasText: 'Понятно' }).click();
  check(!(await banner.isVisible()), 'баннер не закрылся по «Понятно»');
  await page.goto(`${base}/politika/`, { waitUntil: 'networkidle' });
  check((await page.locator('.cookie-notice').count()) === 0, 'баннер показался второй раз');
  await ctx.close();
}

async function demoPart(browser, base) {
  const url = `${base}/styleguide/soglasiya/`;
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await ctx.addInitScript(SEEN);
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const submit = page.getByRole('button', { name: 'Зарегистрироваться' });
    const consents = page.locator('[data-testid="consents"] tbody tr');

    // Взрослый репетитор: без галочек кнопка неактивна.
    await page.getByLabel('Репетитор').check();
    await page.getByLabel('Имя').fill('Анна');
    await page.getByLabel('Почта', { exact: true }).fill('anna@x.ru');
    await page.getByLabel('Пароль').fill('12345678');
    check(await submit.isDisabled(), 'кнопка активна без галочек');
    await page.getByLabel('Я принимаю Пользовательское соглашение').check();
    check(await submit.isDisabled(), 'кнопка активна с одной галочкой');
    if (width === 1440) await shot(page, `registraciya-bez-galochki-${width}`);
    await page.getByLabel('Я даю согласие на обработку персональных данных').check();
    check(await submit.isEnabled(), 'кнопка неактивна с обеими галочками');
    check(
      (await page
        .getByRole('link', { name: 'согласие на обработку персональных данных' })
        .getAttribute('href')) === '/soglasie/',
      'галочка согласия ведёт не на /soglasie/',
    );
    await submit.click();
    await page.locator('[data-testid="kabinet"]').waitFor();
    check(
      (await consents.count()) === 2,
      `после регистрации в таблице ${await consents.count()} записей, ожидалось 2`,
    );
    const row = await consents.first().locator('td').allTextContents();
    check(
      row[0] === 'anna@x.ru' && row[1] === 'соглашение' && row[4] === '127.0.0.1' && row[3] !== '',
      `запись согласия: ${row.join(' | ')}`,
    );
    check(
      (await page.locator('.parent-pending').count()) === 0,
      'взрослому показали плашку родителя',
    );

    // Новая редакция → окно при следующем входе.
    await page.getByRole('button', { name: 'Опубликовать новую редакцию' }).click();
    await page.getByRole('button', { name: 'Выйти и войти снова' }).click();
    const dialog = page.getByRole('dialog', { name: 'Документы обновлены' });
    check(await dialog.isVisible(), 'нет окна «Документы обновлены»');
    const go = dialog.getByRole('button', { name: 'Продолжить' });
    check(await go.isDisabled(), 'окно: «Продолжить» активна без галочек');
    await shot(page, `dokumenty-obnovleny-${width}`, false);
    await page.keyboard.press('Escape');
    check(await dialog.isVisible(), 'окно закрылось по Escape без согласия');
    await dialog.getByLabel('Я принимаю Пользовательское соглашение').check();
    await dialog.getByLabel('Я даю согласие на обработку персональных данных').check();
    await go.click();
    await dialog.waitFor({ state: 'hidden' });
    check(
      (await consents.count()) === 4,
      `после новой редакции в таблице ${await consents.count()} записей, ожидалось 4`,
    );

    // Удаление: журнал остаётся с пометкой.
    await page.getByRole('button', { name: 'Удалить аккаунт' }).click();
    await page.getByRole('button', { name: 'Удалить навсегда' }).click();
    await page.getByRole('heading', { name: 'Аккаунт удалён' }).waitFor();
    const marks = await page
      .locator('[data-testid="consents"] tbody tr td:last-child')
      .allTextContents();
    check(
      marks.length === 4 && marks.every((m) => m === 'да'),
      'после удаления записи о согласии не сохранились с пометкой',
    );
    await ctx.close();

    // Ученик младше 18.
    const ctx2 = await browser.newContext({ viewport: { width, height: 900 } });
    await ctx2.addInitScript(SEEN);
    const p2 = await ctx2.newPage();
    await p2.goto(url, { waitUntil: 'networkidle' });
    await p2.getByLabel('Имя').fill('Маша');
    await p2.getByLabel('Почта', { exact: true }).fill('masha@x.ru');
    await p2.getByLabel('Пароль').fill('12345678');
    check(
      (await p2.getByLabel('Почта родителя').count()) === 0,
      'поле родителя видно до года рождения',
    );
    await p2.getByLabel('Год рождения').fill(String(new Date().getFullYear() - 15));
    await p2.getByLabel('Почта родителя').waitFor();
    await p2.getByLabel('Я принимаю Пользовательское соглашение').check();
    await p2.getByLabel('Я даю согласие на обработку персональных данных').check();
    const submit2 = p2.getByRole('button', { name: 'Зарегистрироваться' });
    check(
      await submit2.isDisabled(),
      'ученик младше 18 без почты родителя может зарегистрироваться',
    );
    await p2.getByLabel('Почта родителя').fill('mama@x.ru');
    await shot(p2, `registraciya-uchenik-${width}`);
    await submit2.click();
    await p2.locator('[data-testid="kabinet"]').waitFor();
    check(
      (await p2.locator('[data-testid="progress"]').textContent())?.includes('не сохраняется'),
      'прогресс сохраняется до подтверждения',
    );
    const banner = p2.locator('.parent-pending');
    check(
      (await banner.textContent())?.includes('Ждём подтверждения родителя'),
      'нет плашки «Ждём подтверждения родителя»',
    );
    const letters = p2.locator('[data-testid="letter"]');
    check((await letters.count()) === 1, 'письмо родителю не ушло');
    const text = (await letters.first().textContent()) ?? '';
    check(
      text.includes('mama@x.ru') &&
        text.includes('Я, родитель или законный представитель') &&
        text.includes('soglasie-roditelya/?t='),
      'письмо: адресат, вариант Б или ссылка',
    );
    const resend = banner.getByRole('button', { name: 'Отправить письмо ещё раз' });
    check(await resend.isDisabled(), 'повтор письма доступен сразу');
    check((await banner.textContent())?.includes('через'), 'нет обратного отсчёта до повтора');
    await shot(p2, `kabinet-zhdyom-roditelya-${width}`);
    await p2.getByRole('button', { name: 'Перейти по ссылке из письма' }).click();
    await banner.waitFor({ state: 'detached' });
    check(
      (await p2.locator('[data-testid="progress"]').textContent())?.includes('сохраняется') &&
        !(await p2.locator('[data-testid="progress"]').textContent())?.includes('не '),
      'после подтверждения прогресс не сохраняется',
    );
    const kinds = await p2
      .locator('[data-testid="consents"] tbody tr td:nth-child(2)')
      .allTextContents();
    check(kinds.includes('согласие родителя'), 'нет записи «согласие родителя»');
    await ctx2.close();
  }
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
let srv;
try {
  if (DEMO) {
    await demoPart(browser, DEMO.replace(/\/$/, ''));
  } else {
    if (!fs.existsSync(path.join(OUT, 'index.html')))
      throw new Error('Нет out/ — сначала LEGAL_DRAFT=1 pnpm build');
    srv = serve();
    await new Promise((r) => srv.listen(PORT, r));
    await sitePart(browser, `http://127.0.0.1:${PORT}`);
  }
} finally {
  await browser.close();
  srv?.close();
}

if (failures.length) {
  console.error(
    `Согласия в браузере: ${failures.length} расхождений\n${failures.map((f) => `  — ${f}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(
  DEMO
    ? 'Витрина согласий: все сценарии прошли.'
    : 'Правовые страницы, подвал и баннер: всё на месте.',
);
