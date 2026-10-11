#!/usr/bin/env node
/* scripts/check-legal.mjs — правовые документы и правила согласий.

   Запуск: pnpm test:legal

   Без браузера и без сборки:
     1. тексты src/content/legal/*.md — слово в слово из утверждённого
        файла docs/legal/ishodnik-dokumenty-pd.md (каждая строка есть в
        исходнике, порядок тот же, ничего не потеряно внутри документа);
     2. в документах нет других подстановок, кроме [ФИО], [ПОЧТА], [ДАТА],
        и после подстановки из operator.json скобок не остаётся;
     3. разбор: оглавление политики — 11 разделов, соглашения — 8,
        у согласия якоря variant-a и variant-b;
     4. проверка operator.json: пустые и примерные значения — ошибка;
     5. правила регистрации: без галочек кнопка неактивна, год рождения,
        почта родителя младше 18, повтор письма раз в минуту, новая
        редакция → снова галочки, прогресс до подтверждения;
     6. письмо родителю: текст варианта Б и ссылка подтверждения.

   Ненулевой код возврата — нашлось расхождение, список печатается. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { legalConfigProblems } from '../src/lib/legal/operatorProblems.mjs';

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
};

const SOURCE = fs
  .readFileSync(path.join(APP, '..', 'docs', 'legal', 'ishodnik-dokumenty-pd.md'), 'utf8')
  .split('\n');
const DOCS = ['politika', 'soglasie', 'soglashenie'];

/* 1. Слово в слово. Строки документа идут в исходнике по порядку;
   между ними в исходнике пропущены только служебные пометки для
   разработчика («Текст показывается по ссылке…») и строка редакции,
   которую страница выводит сама. */
const ALLOWED_GAPS = [
  /^\*\*Редакция от \[ДАТА\]\*\*$/,
  /^Текст показывается по ссылке/,
  /^Текст отправляется на почту родителя/,
  /^$/,
];
for (const id of DOCS) {
  const lines = fs
    .readFileSync(path.join(APP, 'src', 'content', 'legal', `${id}.md`), 'utf8')
    .split('\n')
    .filter((l) => l !== '');
  let at = SOURCE.indexOf(lines[0]);
  check(at >= 0, `${id}.md: первая строка не найдена в исходнике`);
  for (const line of lines.slice(1)) {
    const next = SOURCE.indexOf(line, at + 1);
    if (next < 0) {
      failures.push(`${id}.md: строки нет в исходнике: «${line.slice(0, 70)}…»`);
      break;
    }
    for (const skipped of SOURCE.slice(at + 1, next)) {
      if (!ALLOWED_GAPS.some((re) => re.test(skipped))) {
        failures.push(`${id}.md: пропущена строка исходника: «${skipped.slice(0, 70)}…»`);
      }
    }
    at = next;
  }

  const text = lines.join('\n');
  const marks = new Set(text.match(/\[[^\]]+\]/g) ?? []);
  for (const m of marks)
    check(['[ФИО]', '[ПОЧТА]', '[ДАТА]'].includes(m), `${id}.md: неизвестная подстановка ${m}`);
}

/* 2–3. Подстановка и разбор. */
const md = requireSrc('lib/legal/markdown.ts');
const { fillPlaceholders } = requireSrc('lib/legal/operator.ts');
const opConfig = JSON.parse(
  fs.readFileSync(path.join(APP, 'src', 'content', 'legal', 'operator.json'), 'utf8'),
);
const filled = legalConfigProblems(opConfig).length === 0;
for (const id of DOCS) {
  const out = fillPlaceholders(
    fs.readFileSync(path.join(APP, 'src', 'content', 'legal', `${id}.md`), 'utf8'),
  );
  if (filled) check(!/\[(ФИО|ПОЧТА|ДАТА)\]/.test(out), `${id}: после подстановки остались скобки`);
}
const heads = (id) =>
  md
    .parseLegal(fs.readFileSync(path.join(APP, 'src', 'content', 'legal', `${id}.md`), 'utf8'))
    .filter((b) => b.type === 'h');
check(
  heads('politika').length === 11,
  `политика: разделов ${heads('politika').length}, ожидалось 11`,
);
check(
  heads('soglashenie').length === 8,
  `соглашение: разделов ${heads('soglashenie').length}, ожидалось 8`,
);
check(
  heads('soglasie')
    .map((h) => h.id)
    .join() === 'variant-a,variant-b',
  `согласие: якоря ${heads('soglasie')
    .map((h) => h.id)
    .join()}`,
);
check(
  heads('politika')[6]?.id === 'razdel-7',
  'политика: у раздела «Файлы cookie» нет якоря razdel-7 (ссылка из баннера)',
);
const list = md.parseLegal('5.2. Привлекает:\n- хостинг;\n- почту.\nЭти лица обрабатывают.');
check(
  list.map((b) => b.type).join() === 'p,ul,p' && list[1].items.length === 2,
  'разбор: список без пустых строк вокруг не распознан',
);
const link = md.parseInline('см. **Политику** (budetege.ru/politika).');
check(
  link.some((x) => x.kind === 'bold') &&
    link.some((x) => x.kind === 'link' && x.href === '/politika/'),
  'разбор: полужирный или ссылка на документ',
);

/* 4. operator.json. */
check(
  legalConfigProblems({ fio: '[ФИО]', pochta: '[ПОЧТА]', data: '[ДАТА]' }).length === 3,
  'проверка конфигурации пропустила плейсхолдеры',
);
check(
  legalConfigProblems({ fio: 'Иванова', pochta: 'a@b.ru', data: '15.10.2026' }).length === 1,
  'ФИО из одного слова принято',
);
check(
  legalConfigProblems({ fio: 'Иванова Мария Петровна', pochta: 'a@b', data: '15.10.2026' })
    .length === 1,
  'почта без домена принята',
);
check(
  legalConfigProblems({ fio: 'Иванова Мария Петровна', pochta: 'a@b.ru', data: '31.02.2026' })
    .length === 1,
  'несуществующая дата принята',
);
check(
  legalConfigProblems({
    fio: 'Иванова Мария Петровна',
    pochta: 'privacy@budetege.ru',
    data: '15.10.2026',
  }).length === 0,
  'верные данные не приняты',
);

/* 5. Правила. */
const C = requireSrc('lib/account/consents.ts');
const NOW = new Date('2026-10-11T12:00:00Z');
const base = {
  name: 'Маша',
  email: 'masha@x.ru',
  password: '12345678',
  role: 'student',
  birthYear: '2000',
  parentEmail: '',
  acceptSoglashenie: true,
  acceptSoglasie: true,
};
check(C.checkRegistration(base, NOW).canSubmit, 'верная форма взрослого ученика не проходит');
check(
  !C.checkRegistration({ ...base, acceptSoglashenie: false }, NOW).canSubmit,
  'без галочки соглашения кнопка активна',
);
check(
  !C.checkRegistration({ ...base, acceptSoglasie: false }, NOW).canSubmit,
  'без галочки согласия кнопка активна',
);
check(
  !C.checkRegistration({ ...base, acceptSoglasie: false, acceptSoglashenie: false }, NOW).canSubmit,
  'без обеих галочек кнопка активна',
);
check(
  !C.checkRegistration({ ...base, birthYear: '' }, NOW).canSubmit,
  'ученик без года рождения проходит',
);
check(
  C.checkRegistration({ ...base, role: 'tutor', birthYear: '' }, NOW).canSubmit,
  'репетитору требуется год рождения',
);
const kid = C.checkRegistration({ ...base, birthYear: '2011' }, NOW);
check(
  kid.needsParent && !kid.canSubmit && kid.errors.parentEmail,
  'ученик 2011 г. р. без почты родителя проходит',
);
check(
  C.checkRegistration({ ...base, birthYear: '2011', parentEmail: 'mama@x.ru' }, NOW).canSubmit,
  'ученик с почтой родителя не проходит',
);
check(
  !C.checkRegistration({ ...base, birthYear: '2011', parentEmail: 'MASHA@x.ru' }, NOW).canSubmit,
  'почта родителя совпадает с почтой ученика',
);
check(
  C.parentConsentNeeded(2008, NOW) && !C.parentConsentNeeded(2007, NOW),
  'граница 18 лет (год 18-летия — с родителем)',
);
check(C.resendWaitSeconds(null, NOW) === 0, 'первое письмо — сразу');
check(
  C.resendWaitSeconds(new Date(NOW.getTime() - 20_000).toISOString(), NOW) === 40,
  'через 20 с ждать 40 с',
);
check(
  C.resendWaitSeconds(new Date(NOW.getTime() - 60_000).toISOString(), NOW) === 0,
  'через минуту — можно',
);
const rec = (kind, version) => ({ kind, version, acceptedAt: NOW.toISOString(), ip: null });
check(
  C.outdatedConsents(
    [rec('soglashenie', '2026-10-15'), rec('soglasie', '2026-10-15')],
    '2026-10-15',
  ).length === 0,
  'принятые документы просятся снова',
);
check(
  C.outdatedConsents(
    [rec('soglashenie', '2026-10-15'), rec('soglasie', '2026-10-15')],
    '2027-02-01',
  ).length === 2,
  'новая редакция не просит галочки',
);
check(
  !C.progressSavingAllowed({ role: 'student', parentRequired: true, parentConfirmedAt: null }),
  'прогресс сохраняется до подтверждения родителя',
);
check(
  C.progressSavingAllowed({
    role: 'student',
    parentRequired: true,
    parentConfirmedAt: NOW.toISOString(),
  }),
  'после подтверждения прогресс не сохраняется',
);

/* 6. Письмо родителю. */
const { buildParentLetter } = requireSrc('lib/account/parentLetter.ts');
const variantB = md.plainText(
  md.section(
    md.parseLegal(
      fillPlaceholders(
        fs.readFileSync(path.join(APP, 'src', 'content', 'legal', 'soglasie.md'), 'utf8'),
      ),
    ),
    'variant-b',
  ),
);
check(variantB.startsWith('Я, родитель или законный представитель'), 'вариант Б вырезан неверно');
check(
  !variantB.includes('Вариант А') && !variantB.includes('совершеннолетний'),
  'в вариант Б попал вариант А',
);
const letter = buildParentLetter({
  childName: 'Маша',
  confirmUrl: 'https://budetege.ru/soglasie-roditelya/?t=abc',
  consentText: variantB,
});
check(
  letter.text.includes(variantB) &&
    letter.text.includes('?t=abc') &&
    letter.text.includes('/soglasie/#variant-b'),
  'письмо родителю без текста согласия или ссылки',
);

if (failures.length) {
  console.error(
    `Правовые документы: ${failures.length} расхождений\n${failures.map((f) => `  — ${f}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(
  `Правовые документы и правила согласий: всё сходится${filled ? '' : ' (operator.json ещё не заполнен — это черновик)'}.`,
);
