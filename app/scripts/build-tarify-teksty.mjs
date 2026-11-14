#!/usr/bin/env node
/* scripts/build-tarify-teksty.mjs — черновик текстов страницы «Тарифы»
   (docs/tarify-teksty.md) из lib/tarify/config.ts и content/tarify.ts.
   Запуск: pnpm build:tarify-teksty */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';
const c = requireSrc('lib/tarify/config.ts');
const { TARIFY: t } = requireSrc('content/tarify.ts');
const L = [];
const p = (s = '') => L.push(s);
const cell = (v) => (v === true ? '✓' : v === false ? '—' : v);
p('# Тарифы: тексты страницы — черновик на вычитку');
p();
p(
  'Всё, что написано на странице `/tarify/`, по порядку сверху вниз. Цены, сроки, лимиты и списки возможностей живут в `app/src/lib/tarify/config.ts`, остальные тексты — в `app/src/content/tarify.ts`. Правки присылайте прямо в этот файл или списком — перенесу в код.',
);
p();
p('Файл собран из кода; если код и файл разойдутся, верен код.');
p();
p('## Шапка');
p();
p(`- Надзаголовок: ${t.shapka.nad}`);
p(`- Заголовок: ${t.shapka.zagolovok}`);
p(`- Строка смысла: ${t.shapka.lid}`);
p(
  `- Переключатель роли: «${t.vybor.rol.uchenik}» / «${t.vybor.rol.repetitor}» (выбор запоминается)`,
);
p(`- Переключатель срока: «${t.vybor.srok.d30}» / «${t.vybor.srok.ege}»`);
p(`- Под сроком «До ЕГЭ»: ${t.vybor.egePoyasnenie}`);
p();
p('## Цены');
p();
p('| | 30 дней | До 30 июня 2027 |');
p('|---|---|---|');
p('| Бесплатно | 0 ₽ | — |');
p(`| Пробный ${c.PROBNYY.dney} дней | 0 ₽, один раз на аккаунт | — |`);
for (const rol of ['uchenik', 'repetitor']) {
  const tf = c.PLATNYE[rol];
  p(
    `| ${tf.nazvanie} | ${c.rubli(tf.tsena30)} | ${tf.doEge.map((s) => `с ${s.s.split('-').reverse().join('.')} — ${c.rubli(s.tsena)}`).join('; ')} |`,
  );
}
p();
p(
  `С ${c.DO_EGE_KONETS_PRODAZH.split('-').reverse().join('.')} срок «До ЕГЭ» не продаётся, переключатель срока исчезает. Зачёркнутых цен на странице нет.`,
);
p();
for (const rol of ['uchenik', 'repetitor']) {
  p(`## Плашки — ${rol === 'uchenik' ? '«Я ученик»' : '«Я репетитор»'}`);
  p();
  for (const pl of c.plashki(rol)) {
    const platnyy = pl.id === 'uchenik' || pl.id === 'repetitor';
    p(`### ${pl.nazvanie}${platnyy ? ` — метка «${c.TARIFY_TEXT.metkaGlavnoy}»` : ''}`);
    p();
    p(`Для кого: ${pl.dlyaKogo}`);
    p();
    for (const v of pl.vhodit) p(`- ✓ ${v}`);
    for (const v of pl.net) p(`- — ${v}`);
    p();
    const k = c.TARIFY_TEXT.knopki;
    p(
      `Кнопка: ${pl.id === 'besplatno' ? `«${k.nachat}» (ведёт в банк заданий)` : `сейчас «${k.skoro}» (неактивна); после включения оплаты — «${pl.id === 'probnyy' ? k.probnyy : k.oplatit}»`}`,
    );
    if (platnyy) p(`Под кнопкой: ${c.TARIFY_TEXT.bezAvtoprodleniya}`);
    p();
  }
}
p('## Блок «Подсказки»');
p();
p(`**${c.PODSKAZKI.zagolovok}**`);
p();
p(c.PODSKAZKI.lid);
p();
c.PODSKAZKI.primery.forEach((x, i) => p(`${i + 1}. **${x.nazvanie}.** ${x.tekst}`));
p();
p(`## Таблица «${t.sravnenie.zagolovok}»`);
p();
const k = t.sravnenie.kolonki;
p(`| ${k.vozmozhnost} | ${k.besplatno} | ${k.uchenik} | ${k.repetitor} |`);
p('|---|---|---|---|');
for (const r of c.SRAVNENIE)
  p(`| ${r.vozmozhnost} | ${cell(r.besplatno)} | ${cell(r.uchenik)} | ${cell(r.repetitor)} |`);
p();
p(`Под таблицей: ${t.sravnenie.snoska}`);
p();
p(`На телефоне таблица свёрнута под кнопкой «${t.sravnenie.raskryt}».`);
p();
p(`## ${t.kak.zagolovok}`);
p();
t.kak.shagi.forEach((x, i) => p(`${i + 1}. **${x.nazvanie}.** ${x.tekst}`));
p();
p(`## ${t.voprosy.zagolovok}`);
p();
for (const v of t.voprosy.spisok) {
  p(`**${v.vopros}**`);
  p();
  p(v.otvet);
  p();
}
p('## Строка для школ');
p();
p(`${t.shkoly.tekst} ${t.shkoly.ssylka} (ссылка на Telegram-канал).`);
p();
p('## «Мягкая стена» (пока только на /styleguide/tarify/)');
p();
p(`**${t.stena.zagolovok}**`);
p();
p(t.stena.tekst);
p();
p(`Кнопка: «${t.stena.ssylka}».`);
p();
p('## Утверждено владельцем (12.11.2026)');
p();
p(
  '- **Возврат денег** — как в ответе выше: возврат за дни, оставшиеся до конца оплаченного периода; точные условия — в оферте.',
);
p(
  '- **Генератор у «Ученика»** — тот же лимит, что у бесплатного доступа: платный тариф не хуже бесплатного.',
);
p(
  '- **Генераторы без тарифа (14.11.2026)** — открыты только №1, 2, 10, 11 и «Собрать вариант», в каждом одна пробная генерация (всего, не в день). Генераторы остальных заданий — в пробном доступе и на платных тарифах. Аккаунт владельца — всё открыто.',
);
p(
  '- **Серые пункты** «Через 7 дней — снова бесплатный доступ» (пробный) и «Больше 30 учеников в классе — напишите нам» (репетитор) — остаются.',
);
p();
p('## Ещё не готово');
p();
p(
  '- **Оферта и подвал.** Черновик оферты — `docs/oferta.md`. Реквизиты в подвале, страница `/oferta/` и ссылка на её раздел «Возврат денег» из вопросов выше появятся, когда будут заполнены ИНН и почта (`app/src/content/legal/prodavets.json`) и включён флаг `NEXT_PUBLIC_LEGAL_READY`.',
);
p();
fs.writeFileSync(path.join(APP, '..', 'docs', 'tarify-teksty.md'), L.join('\n'));
console.log('docs/tarify-teksty.md обновлён');
