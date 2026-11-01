/**
 * Карточки задания №18 «Планиметрия»: ключевые схемы.
 *
 * Колода собирается из самих схем (content/zadanie18/), своих текстов
 * у неё нет: у каждой схемы две карточки.
 *   — «Узнай схему по чертежу» (тип «по чертежу»): живой чертёж схемы
 *     в случайном положении, повороте и отражении, без букв — назвать
 *     схему и её следствия; на обороте тот же чертёж с буквами;
 *   — «Вспомни следствия» (тип «свойство»): название и «Дано» —
 *     перечислить, что даёт схема; на обороте чертёж с буквами.
 * Оборот — ключевые следствия схемы (`kartochka`), те же, что на её
 * странице. «Повторить теорию» ведёт на страницу схемы.
 *
 * Чертежи рисует движок lib/skhemy на сборке (lib/kartochki/podgotovka).
 * Следствия проверены численно: pnpm test:skhemy-18.
 */

import type { Kartochka, Koloda } from '@/lib/kartochki/tipy';
import { trebuetsyaSkhema18 } from '@/lib/zadanie18/skhemy';
import {
  NOMER_18,
  PODTEMA_UZNAY,
  PODTEMA_VSPOMNI,
  kartochkaUznay,
  kartochkaVspomni,
  stranitsaSkhemy,
} from '@/lib/zadanie18/kartochki';
import { SOBRANNYE, SPISOK_SKHEM } from '../zadanie18/spisok';

const sledstviya = (punkty: readonly string[]) => punkty.map((p) => `• ${p}`).join('\n');

const kartochki: Kartochka[] = SOBRANNYE.flatMap((s): Kartochka[] => {
  const level = SPISOK_SKHEM.find((x) => x.id === s.id)?.klassicheskaya
    ? ('важно для ЕГЭ' as const)
    : ('база' as const);
  const skhema = () => trebuetsyaSkhema18(s.id);
  return [
    {
      id: kartochkaUznay(s.id),
      task: NOMER_18,
      topic: PODTEMA_UZNAY,
      type: 'chertezh',
      front: 'Какая это схема и что из неё следует?',
      back: `**${s.nazvanie}**\n${sledstviya(s.kartochka)}`,
      figure: {
        dvizhok: 'skhema',
        skhema,
        alt: 'Чертёж ключевой схемы без букв',
        povorot: true,
        bukvy: false,
        bukvyNaOborote: true,
      },
      level,
      source: s.id,
    },
    {
      id: kartochkaVspomni(s.id),
      task: NOMER_18,
      topic: PODTEMA_VSPOMNI,
      type: 'svoystvo',
      front: `${s.nazvanie}\n${s.dano}\nЧто следует из этой схемы?`,
      back: sledstviya(s.kartochka),
      figure: { dvizhok: 'skhema', skhema, alt: s.nazvanie, bukvy: true },
      level,
      source: s.id,
    },
  ];
});

const koloda: Koloda = {
  task: NOMER_18,
  slug: '18',
  title: 'Планиметрия',
  teoriya: 'skhemy/',
  stranitsa: stranitsaSkhemy,
  podtemy: [
    { id: PODTEMA_UZNAY, title: 'Узнай схему по чертежу' },
    { id: PODTEMA_VSPOMNI, title: 'Вспомни следствия' },
  ],
  kartochki,
};

export default koloda;
