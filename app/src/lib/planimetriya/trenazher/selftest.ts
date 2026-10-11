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
 * Листы: все 12 уроков серии (по умолчанию и с настройками учителя) и режимы генератора (отработка с рамкой
 * и примерами, варианты) собираются, номера задач идут подряд, на
 * листе нет повторов задач, листы ученика и учителя — из одного
 * набора.
 */

import { otvetEge } from '../bank/analogi';
import { UROKI_1 } from '../../../content/repetitory1';
import { answerMatches, openText } from '../secret';
import { parseSheetQuery1, sheetSpec1, sobratList } from '../sheet1';
import { chislo } from '../stseny/dsl';
import { dannyeTrenazhera1 } from './dannye';
import { nomerAnaloga, planSessii, type ZadachaPlan } from './sessiya';
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

  /* Сессии из всех источников. */
  for (const istochnik of ['bank', 'mix', 'new'] as const) {
    const podtipy = vse.filter((p) => istochnik !== 'bank' || p.vBanke > 0).map((p) => p.id);
    const plan = planSessii({ podtipy, istochnik, count: 30 }, d.bank, `s-${istochnik}`);
    if (plan.length !== 30) problems.push(`сессия «${istochnik}»: ${plan.length} задач из 30`);
    if (istochnik === 'bank' && plan.some((x) => x.vid !== 'bank'))
      problems.push('сессия «только банк»: попала не задача банка');
    if (istochnik === 'new' && plan.some((x) => x.vid === 'bank'))
      problems.push('сессия «только новые»: попала задача банка');
  }

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
