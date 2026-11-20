/**
 * Автотест разметки чертежей задания №1 (scripts/check-razmetka-1.mjs).
 *
 * Прогоняет все места, где рисует движок планиметрии, теми же
 * функциями, что собирают страницы: образцы прототипов (условие, каждый
 * шаг подсказки, лист учителя, миниатюры), все задачи банка и аналоги с
 * разбором, новые задачи тренажёра, опорные задачи, листы генератора и
 * уроков, теорию, справочник, карточки «Показать свойство» и живые
 * чертежи. Наблюдатель движка
 * (render.nablyudat) отдаёт сюда каждый нарисованный чертёж, и он
 * проверяется правилами razmetka.ts.
 */

import { UROKI_1 } from '../../content/repetitory1';
import { TEMY_SPRAVOCHNIKA_1 } from '../../content/spravochnik1';
import { FAKTY_1 } from '../../content/spravochnik1/fakty';
import { O_ZADANII_1 } from '../../content/zadanie1';
import { kartochkaFakta1 } from './fakt-kartochka';
import { POROG } from './figury';
import { BLOKI } from './prep/bloki';
import { fixedSeed } from './prep/generate';
import { sealMikro } from './prep/seal';
import { type KodRazmetki, type ProblemaRazmetki, proveritRazmetku } from './razmetka';
import { type Nablyudenie, PL, nablyudat, renderPlan, shagovPodskazki } from './render';
import { parseSheetQuery1, sheetSpec1, sobratList } from './sheet1';
import { chertezhPrimera, chertezhTemy, KARTOCHKI_S_CHERTEZHOM } from './spravochnik-chertezhi';
import { PROTOTIPY } from './stseny';
import type { Params } from './stseny/dsl';
import { KLYUCHI_TEORII, risunokTeorii } from './teoriya';
import { dannyeTrenazhera1 } from './trenazher/dannye';
import type { ZadachaPlan } from './trenazher/sessiya';
import { razreshit } from './trenazher/zadacha';
import { razborZadachi } from './trening/sborka';
import type { Optsii, Scena } from './types';
import { ZHIVYE } from './zhivye';

export interface PlohoyChertezh {
  razdel: string;
  metka: string;
  problems: ProblemaRazmetki[];
  scena: Scena;
  optsii: Optsii;
}

export interface RazdelRazmetki {
  id: string;
  title: string;
  chertezhey: number;
  plohih: number;
}

export interface ItogRazmetki {
  razdely: RazdelRazmetki[];
  chertezhey: number;
  plohih: number;
  poKodam: Record<KodRazmetki, number>;
  plohie: PlohoyChertezh[];
  oshibki: string[];
}

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function checkRazmetka(seedov = 3, bystro = false): ItogRazmetki {
  const itog: ItogRazmetki = {
    razdely: [],
    chertezhey: 0,
    plohih: 0,
    poKodam: { ugol: 0, podpis: 0, tochki: 0, splyushchen: 0, struktura: 0 },
    plohie: [],
    oshibki: [],
  };
  let razdel: RazdelRazmetki = { id: '', title: '', chertezhey: 0, plohih: 0 };
  let metka = '';
  const videli = new Set<number>();
  const nablyudatel = (n: Nablyudenie) => {
    /* Один и тот же чертёж (тот же SVG) считается один раз. */
    const h = hash(n.svg);
    if (videli.has(h)) return;
    videli.add(h);
    razdel.chertezhey += 1;
    itog.chertezhey += 1;
    let problems: ProblemaRazmetki[];
    try {
      problems = proveritRazmetku(n.scena, n.optsii, n.otchet);
    } catch (e) {
      problems = [
        { kod: 'struktura', tekst: `проверка упала: ${(e as Error).message}`, shtraf: 100 },
      ];
    }
    if (problems.length === 0) return;
    razdel.plohih += 1;
    itog.plohih += 1;
    for (const k of new Set(problems.map((p) => p.kod))) itog.poKodam[k] += 1;
    const r = n.optsii.rezhim;
    const rezhim =
      r === undefined || r.rezhim === 'uchenik'
        ? 'условие'
        : r.rezhim === 'podskazka'
          ? `подсказка ${r.shag}${r.vopros ? ' (вопрос)' : ''}`
          : 'решение';
    itog.plohie.push({
      razdel: razdel.id,
      metka: `${metka}, ${rezhim}`,
      problems,
      scena: n.scena,
      optsii: n.optsii,
    });
  };
  const nachat = (id: string, title: string) => {
    razdel = { id, title, chertezhey: 0, plohih: 0 };
    itog.razdely.push(razdel);
  };
  const proba = (m: string, fn: () => void) => {
    metka = m;
    try {
      fn();
    } catch (e) {
      itog.oshibki.push(`${m}: ${(e as Error).message}`);
    }
  };

  nablyudat(nablyudatel);
  try {
    const d = dannyeTrenazhera1();

    nachat('prototipy', 'Образцы прототипов: условие, подсказки, решение, миниатюры');
    for (const p of PROTOTIPY) {
      proba(`прототип ${p.id}`, () => {
        const scena = p.stsena(p.primer as Params, POROG);
        const n = shagovPodskazki(scena);
        renderPlan(scena, {});
        renderPlan(scena, { chisla: true });
        for (let i = 1; i <= n; i += 1) {
          renderPlan(scena, { rezhim: { rezhim: 'podskazka', shag: i } });
          renderPlan(scena, { rezhim: { rezhim: 'podskazka', shag: i }, chisla: true });
        }
        renderPlan(scena, { rezhim: { rezhim: 'uchitel' }, chisla: true });
      });
    }
    for (const t of O_ZADANII_1.tipy) {
      const p = PROTOTIPY.find((x) => x.id === t.mini);
      if (p === undefined) continue;
      proba(`миниатюра ${t.id}`, () => {
        renderPlan(p.stsena(p.primer as Params, POROG), { ...PL.mini });
      });
    }

    nachat('bank', 'Банк: 214 задач ФИПИ и аналоги — условие, вопросы подсказки, шаги разбора');
    for (const b of bystro ? d.bank.filter((x) => !x.analog || x.no % 5 === 0) : d.bank) {
      const plan: ZadachaPlan = { vid: b.analog ? 'analog' : 'bank', no: b.no, id: b.id };
      proba(`${b.analog ? 'аналог' : 'задача банка'} №${b.no} (${b.id})`, () => {
        razborZadachi(razreshit(plan, d.bank));
      });
    }

    nachat('novye', 'Тренажёр: новые задачи');
    for (const p of d.razdely.flatMap((r) => r.podtipy)) {
      for (let i = 0; i < seedov; i += 1) {
        proba(`новая задача ${p.id}, seed r${i}`, () => {
          razborZadachi(razreshit({ vid: 'new', id: p.id, seed: `r${i}` }, d.bank));
        });
      }
    }

    nachat('opornye', 'Опорные задачи: условие и разбор');
    for (const b of BLOKI) {
      for (const m of b.zadachi) {
        for (const seed of [
          fixedSeed(m.id),
          ...Array.from({ length: seedov }, (_, i) => `r${i}`),
        ]) {
          proba(`опорная ${m.id}, ${seed}`, () => {
            sealMikro(m, seed);
          });
        }
      }
    }

    nachat('listy', 'Листы генератора и уроков');
    const adresa = [
      ...UROKI_1.map((u) => `m=u&i=m&u=${u.no}&k=K7Q2AB-3.1&seed=K7Q2AB`),
      'm=u&i=m&u=4&k=Z9X1C0&b=shpargalka,sam&n=razbor:2,dz:6,proverka:8&seed=Z9X1C0',
      'm=o&i=m&s=p01:2,p05:2,p24:2,p35:2,p41:1,p62:1&f=2&seed=o',
      'm=o&i=b&s=p03:3,p14:3&seed=ob',
      'm=v&i=m&s=p01:1,p13:1,p17:1,p24:1,p35:1,p41:1,p46:1,p49:1&v=4&f=0&seed=v',
    ];
    for (const q of adresa) {
      proba(`лист ${q}`, () => {
        const p = parseSheetQuery1(new URLSearchParams(q));
        const list = sobratList(p, d.bank);
        sheetSpec1(p, list, 'uchenik');
        sheetSpec1(p, list, 'uchitel');
      });
    }

    nachat('teoriya', 'Теория: рисунки карточек, фактов и живые чертежи');
    for (const k of KLYUCHI_TEORII) {
      proba(`теория ${k}`, () => {
        const r = risunokTeorii(k);
        renderPlan(r.scena, r.optsii);
      });
    }
    for (const z of ZHIVYE) {
      proba(`живой чертёж ${z.id}`, () => {
        renderPlan(z.scena(z.nachalo), { okno: z.okno, chisla: true });
      });
    }

    nachat('spravochnik', 'Справочник: чертежи карточек и примеров');
    for (const k of KARTOCHKI_S_CHERTEZHOM) {
      proba(`справочник ${k}`, () => {
        const c = chertezhTemy(k);
        for (const r of Array.isArray(c) ? c : [c]) renderPlan(r.scena, r.optsii);
      });
    }
    for (const t of TEMY_SPRAVOCHNIKA_1) {
      (t.primery ?? []).forEach((p, i) => {
        proba(`справочник ${t.id}, пример ${i + 1}`, () => {
          const r = chertezhPrimera(t.id, i, p);
          renderPlan(r.scena, r.optsii);
        });
      });
    }

    nachat('fakty', 'Карточки «Показать свойство»: чертежи темы и примеров');
    for (const id of Object.keys(FAKTY_1)) {
      proba(`карточка факта ${id}`, () => {
        kartochkaFakta1(id);
      });
    }
  } finally {
    nablyudat(null);
  }
  return itog;
}
