/**
 * Автотест тренажёра и листов №1 (scripts/check-planimetriya.mjs).
 *
 * Тренажёр: по каждому прототипу — задача банка (если есть), аналог и
 * новые задачи на нескольких seed. У каждой: ответ ЕГЭ (целое или
 * конечная дробь), ответ не подписан ни на чертеже условия, ни на
 * чертежах вопросов подсказки, буквы условия совпадают с буквами
 * чертежа, отпечаток открывает закрытые блоки, а движок не записал
 * нарушений во всех режимах.
 *
 * Листы: все 16 уроков серии (по умолчанию и с настройками учителя) и режимы генератора (отработка с рамкой
 * и примерами, варианты) собираются, номера задач идут подряд, на
 * листе нет повторов задач, листы ученика и учителя — из одного
 * набора.
 */

import { otvetEge } from '../bank/analogi';
import { UROKI_1 } from '../../../content/repetitory1';
import { answerMatches, openText } from '../secret';
import { parseSheetQuery1, sheetSpec1, sobratList } from '../sheet1';
import { PROTOTIPY } from '../stseny';
import { chislo, type Params } from '../stseny/dsl';
import { dannyeTrenazhera1 } from './dannye';
import { klyuchNovoy1, planPoKlyuchu1, trenazherConfig1, zadachi1 } from './filtry1';
import { klyuchZadachi, nomerAnaloga, type ZadachaPlan } from './sessiya';
import { razreshit, sobratZadachu, sostavZadachi, type Podskazki1, type Razbor1 } from './zadacha';

export interface ItogTrenazhera {
  zadach: number;
  listov: number;
  problems: string[];
}

/** Подпись ответа на чертеже: число и, может быть, знак градуса. */
function podpisanOtvet(svg: string, otvet: number): boolean {
  const t = chislo(otvet);
  return new RegExp(
    `class="pl-znachenie"[^>]*>${t.replace('.', '\\.')}(<tspan[^>]*>°</tspan>)?</text>`,
  ).test(svg);
}

/** Буквы точек на чертеже: подписи pl-bukva. */
function bukvyChertezha(svg: string): string[] {
  return [...svg.matchAll(/class="pl-bukva"[^>]*>([A-Z])/g)].map((m) => m[1] ?? '');
}

export function checkTrenazher(seedov = 3): ItogTrenazhera {
  const d = dannyeTrenazhera1();
  const problems: string[] = [];
  let zadach = 0;
  const vse = d.razdely.flatMap((r) => r.podtipy);
  for (const p of vse) {
    const plany: ZadachaPlan[] = [
      ...d.bank
        .filter((b) => b.id === p.id && !b.analog)
        .slice(0, 1)
        .map((b) => ({ vid: 'bank' as const, no: b.no, id: p.id })),
      { vid: 'analog', no: nomerAnaloga(p.proto, 1), id: p.id },
      ...Array.from({ length: seedov }, (_, i) => ({
        vid: 'new' as const,
        id: p.id,
        seed: `t${i}`,
      })),
    ];
    for (const plan of plany) {
      const metka = `тип ${p.kod} (${plan.vid})`;
      zadach += 1;
      try {
        const r = razreshit(plan, d.bank);
        const s = sostavZadachi(r);
        if (!otvetEge(s.otvet)) problems.push(`${metka}: ответ ${s.otvet} не ЕГЭ`);
        /* Число условия, равное ответу (у 73-го радиус всегда равен
           хорде), — данное, а не подсказка. */
        const vUsloviiChislo = new RegExp(`(^|[^\\d,])${chislo(s.otvet)}([^\\d,]|$)`).test(
          s.uslovie.replace(/\{,\}/g, ','),
        );
        if (podpisanOtvet(s.risunokSvg, s.otvet))
          problems.push(`${metka}: ответ подписан на чертеже условия`);
        s.podskazki.voprosy.forEach((v, i) => {
          if (!vUsloviiChislo && podpisanOtvet(v.risunokSvg, s.otvet))
            problems.push(`${metka}: ответ подписан на чертеже вопроса ${i + 1}`);
        });
        const naChertezhe = new Set(bukvyChertezha(s.risunokSvg));
        const vUslovii = new Set(
          [...s.uslovie.matchAll(/\$([^$]*)\$/g)].flatMap(
            (m) => (m[1] ?? '').replace(/\\[a-zA-Z]+/g, '').match(/[A-Z]/g) ?? [],
          ),
        );
        for (const b of vUslovii) {
          if (naChertezhe.size > 0 && !naChertezhe.has(b) && !'RSP'.includes(b))
            problems.push(`${metka}: буквы ${b} из условия нет на чертеже`);
        }
        const z = sobratZadachu(plan, d.bank);
        if (!answerMatches(chislo(s.otvet), z.seal))
          problems.push(`${metka}: отпечаток не принимает ответ`);
        const pk = JSON.parse(openText(z.podskazki, z.seal)) as Podskazki1;
        const rz = JSON.parse(openText(z.razbor, z.seal)) as Razbor1;
        if (pk.voprosy.length === 0) problems.push(`${metka}: нет вопросов подсказки`);
        if (rz.shagi.length === 0) problems.push(`${metka}: нет шагов решения`);
      } catch (e) {
        problems.push(`${metka}: ${(e as Error).message}`);
      }
    }
  }

  /* 20 аналогов на прототип с другими числами (отпечатки сверяет
     самотест банка) и с другими буквами: вариант тренажёра и генератора
     переименовывает точки. Без новых букв — только прототипы, в
     условии которых букв нет (правильный многоугольник). */
  for (const pr of PROTOTIPY) {
    const id = `p${String(pr.id).padStart(2, '0')}`;
    const an = d.bank.filter((b) => b.id === id && b.analog);
    if (an.length !== 20) problems.push(`прототип ${pr.id}: аналогов ${an.length}, нужно 20`);
    const sBukvami = /\$[^$]*[A-Z]/.test(pr.uslovie(pr.primer as Params));
    for (const a of an) {
      const r = razreshit({ vid: 'analog', id, no: a.no }, d.bank);
      const novye = Object.entries(r.variant.bukvy).some(([k, v]) => k !== v);
      if (sBukvami && !novye)
        problems.push(`прототип ${pr.id}, аналог ${a.no}: буквы как в образце`);
    }
  }

  /* Список задач общего тренажёра: все задачи банка и аналоги, ключи
     однозначные и читаются обратно, источник и уровень — по задаче. */
  const refs = zadachi1(d);
  if (refs.length !== d.bank.length)
    problems.push(`в списке ${refs.length} задач из ${d.bank.length}`);
  if (new Set(refs.map((r) => r.key)).size !== refs.length)
    problems.push('ключи задач повторяются');
  for (const r of refs) {
    const plan = planPoKlyuchu1(r.key, 'x');
    if (plan === null || klyuchZadachi(plan) !== r.key)
      problems.push(`${r.key}: ключ не читается обратно`);
  }
  if (refs.filter((r) => r.istochnik === 'fipi').length !== d.bank.filter((b) => !b.analog).length)
    problems.push('«открытый банк ФИПИ» — не все задачи банка');
  const level = new Map(vse.map((p) => [p.id, p.level]));
  if (refs.some((r) => r.uroven !== level.get(r.podtip)))
    problems.push('уровень задачи не её прототипа');
  const cfg = trenazherConfig1(d, (t) => t);
  if (cfg.temy.flatMap((t) => t.podtipy.map((p) => p.id)).join() !== vse.map((p) => p.id).join())
    problems.push('конфиг фильтров: не те прототипы');
  if (cfg.temy.some((t) => t.podtipy.some((p) => p.title.includes('$'))))
    problems.push('конфиг фильтров: в названии без формул остался $');
  const nov = planPoKlyuchu1(klyuchNovoy1('p05'), 'seed1');
  if (nov === null || nov.vid !== 'new' || nov.seed !== 'seed1') problems.push('ключ новой задачи');
  if (planPoKlyuchu1('p05', 'x') !== null || planPoKlyuchu1('x05|b1', 'x') !== null)
    problems.push('чужой ключ читается');

  /* Листы. */
  const adresa = [
    ...UROKI_1.map((u) => `m=u&i=m&u=${u.no}&k=K7Q2AB-3.1&seed=K7Q2AB`),
    'm=u&i=m&u=4&k=Z9X1C0&b=shpargalka,sam&n=razbor:2,dz:6,proverka:8&seed=Z9X1C0',
    'm=u&i=m&u=6&k=Z9X1C0-6.1&pr=1&seed=Z9X1C0',
    'm=o&i=m&s=p01:2,p05:2,p24:2,p35:2,p41:1,p62:1&f=2&seed=o',
    'm=o&i=b&s=p03:3,p14:3&seed=ob',
    'm=v&i=m&s=p01:1,p13:1,p17:1,p24:1,p35:1,p41:1,p46:1,p49:1&v=4&f=0&seed=v',
  ];
  let listov = 0;
  for (const q of adresa) {
    try {
      const p = parseSheetQuery1(new URLSearchParams(q));
      const list = sobratList(p, d.bank);
      for (const [vi, zs] of list.poVariantam.entries()) {
        const nomera = zs.map((z) => z.no).join(',');
        if (nomera !== zs.map((_, i) => i + 1).join(','))
          problems.push(`лист ${q}, вариант ${vi + 1}: номера не подряд`);
        const klyuchi = zs.map((z) =>
          z.poz.vid === 'bank' || z.poz.vid === 'analog'
            ? `${z.poz.vid}${z.poz.no}`
            : z.questionHtml,
        );
        if (new Set(klyuchi).size !== klyuchi.length)
          problems.push(`лист ${q}, вариант ${vi + 1}: задачи повторяются`);
        for (const z of zs) {
          if (z.answer === '' || z.answerHtml === '')
            problems.push(`лист ${q}: нет ответа у ${z.pos}`);
        }
      }
      const uchenik = sheetSpec1(p, list, 'uchenik');
      const uchitel = sheetSpec1(p, list, 'uchitel');
      const ids = (s: typeof uchenik) =>
        ('variants' in s && s.variants !== undefined
          ? s.variants.flatMap((v) => v.blocks)
          : s.blocks
        )
          .flatMap((b) => b.tasks.map((t) => t.id))
          .join(',');
      if (ids(uchenik) !== ids(uchitel))
        problems.push(`лист ${q}: у ученика и учителя разные задачи`);
      /* Сырой TeX на листе: всё, что в $…$, должно быть набрано KaTeX. */
      const syroy = JSON.stringify([uchenik, uchitel]).match(/\$[^$"]*\\[a-z]+[^$"]*\$/);
      if (syroy !== null) problems.push(`лист ${q}: сырой TeX ${syroy[0].slice(0, 40)}`);
      listov += 1;
    } catch (e) {
      problems.push(`лист ${q}: ${(e as Error).message}`);
    }
  }
  return { zadach, listov, problems };
}
