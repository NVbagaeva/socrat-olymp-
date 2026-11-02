/**
 * Генератор листов задания №14 на общем генераторе (components/generator/).
 *
 * Темы — группы методов, подтипы — методы (блоки опорных задач). Задача
 * позиции «метод + номер» — функция ключа, варианта и seed: замена одной
 * задачи не трогает остальные. Лист ученика и лист учителя собираются
 * из одного набора: у ученика — условия и пустая окружность, у учителя —
 * ответы, решения и окружности с отбором.
 *
 * Адрес набора — тот же у экрана генератора и листов печати:
 * s (состав), src, v, seed, z (замены), k (вид работы), sv (свой
 * заголовок), d (дата), t (учитель), th (рамки «Запомни»), ex (образцы).
 */

import {
  GENERATOR14_PRESETS,
  GENERATOR14_SOURCES,
  GENERATOR14_TEXTS,
  GRUPPY_14,
  SHEET_14,
} from '@/content/generator14';
import { GEN_UI } from '@/content/generatorUi';
import {
  razobratSostav,
  slotySostava,
  sostavIzSlotov,
  sostavStroka,
} from '@/lib/generator/obshchiy/klyuchi';
import { defaultExtras, vidRabotyIz, vidRabotyText } from '@/lib/generator/obshchiy/state';
import type {
  GenConfig,
  GenEngine,
  GenExtras,
  GenState,
  GenTask,
  SourceId,
} from '@/lib/generator/obshchiy/types';
import { zerno } from '@/lib/vychisleniya/rng';
import { typeset } from '../tex';
import { BANK_14, BLOKI_14 } from './dannye';
import { krugHtml, krugiHtml, krugiOtbora } from './krugHtml';
import { otvetA, otvetB, razborB, uslovieA, uslovieB } from './tekst';
import type { Metod14, Uravnenie14 } from './tipy';

export const BASE_14 = '/zadaniya/14';

const VIDY = GEN_UI.vidyRaboty as Record<string, string>;

/* ── Пулы задач ─────────────────────────────────────────────────── */

const OPORNYE: Uravnenie14[] = BLOKI_14.flatMap((b) =>
  b.zadachi.flatMap((z) => (z.vid === 'uravnenie' && z.promezhutok !== undefined ? [z] : [])),
);

function istochnikPul(src: SourceId): Uravnenie14[] {
  return src === 'bank' ? BANK_14 : src === 'new' ? OPORNYE : [...BANK_14, ...OPORNYE];
}

/** Задачи метода: сначала те, где метод главный, затем где он есть. */
export function pulMetoda(m: string, src: SourceId): Uravnenie14[] {
  const pul = istochnikPul(src);
  const glavnye = pul.filter((z) => z.metody[0] === m);
  return glavnye.length >= 4
    ? glavnye
    : [...glavnye, ...pul.filter((z) => z.metody[0] !== m && z.metody.includes(m as Metod14))];
}

/** Перестановка пула по seed и методу — своя у каждого набора. */
function peremeshat<T>(xs: readonly T[], seed: string): T[] {
  let s = zerno(seed) >>> 0 || 1;
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export interface Params14 {
  sostav: { id: string; n: number; k: number }[];
  src: SourceId;
  variants: number;
  seed: string;
  zameny: Record<string, number>;
  kind: string | null;
  svoy: string;
  date: string;
  teacher: string;
  theory: boolean;
  examples: 0 | 1 | 2;
}

export interface Poziciya14 {
  pos: string;
  no: number;
  metod: string;
  z: Uravnenie14;
}

/** Задачи листа по вариантам. */
export function planLista14(p: Params14): Poziciya14[][] {
  const sloty = slotySostava(p.sostav);
  const out: Poziciya14[][] = [];
  for (let v = 0; v < p.variants; v += 1) {
    const zanyato = new Set<string>();
    const ryad: Poziciya14[] = [];
    sloty.forEach((s, i) => {
      const pul = peremeshat(pulMetoda(s.id, p.src), `${p.seed}|${s.id}`);
      if (pul.length === 0) return;
      const key = `${v + 1}.${s.id}_${s.k}`;
      const zam = p.zameny[key] ?? 0;
      let idx = (s.k * p.variants + v + zam * p.variants * 3) % pul.length;
      for (let t = 0; t < pul.length && zanyato.has((pul[idx] as Uravnenie14).id); t += 1) {
        idx = (idx + 1) % pul.length;
      }
      const z = pul[idx] as Uravnenie14;
      zanyato.add(z.id);
      ryad.push({ pos: key, no: i + 1, metod: s.id, z });
    });
    out.push(ryad);
  }
  return out;
}

/* ── HTML задачи ────────────────────────────────────────────────── */

export function uslovieHtml(z: Uravnenie14): string {
  const b = uslovieB(z);
  return `<p>${typeset(uslovieA(z))}</p>${b === null ? '' : `<p>${typeset(b)}</p>`}`;
}

export function otvetHtml(z: Uravnenie14): string {
  const b = otvetB(z);
  return `а) ${typeset(otvetA(z))}${b === null ? '' : `; б) ${typeset(b)}`}`;
}

export function resheniyeHtml(z: Uravnenie14): string {
  const sh = (xs: string[]) =>
    `<ol class="z14-list-shagi">${xs.map((t) => `<li>${typeset(t)}</li>`).join('')}</ol>`;
  const b = otvetB(z);
  return (
    `<p><b>а)</b></p>${sh(z.reshenie)}<p>Ответ а: ${typeset(otvetA(z))}</p>` +
    (b === null ? '' : `<p><b>б)</b></p>${sh(razborB(z))}<p>Ответ б: ${typeset(b)}</p>`)
  );
}

export const PUSTOY_KRUG = (): string => krugHtml({ pustoy: true }, 'k14--list');

export function krugUchitelya(z: Uravnenie14): string {
  return z.promezhutok === undefined
    ? ''
    : krugiHtml(krugiOtbora(z.serii, z.promezhutok), 'k14--list');
}

/** «Запомни» блока метода — рамка с правилом и примером. */
export function zapomniHtml(metod: string): string {
  const b = BLOKI_14.find((x) => x.id === metod);
  if (b === undefined) return '';
  return (
    `<div class="gen-recap z14-list-ramka"><b>${SHEET_14.ramka}. ${b.nazvanie}</b>` +
    `<p>${typeset(b.zapomni)}</p><p><i>Пример.</i> ${typeset(b.primer)}</p></div>`
  );
}

/** Образец: разобранная первая задача блока метода. */
export function obrazecHtml(metod: string): string {
  const b = BLOKI_14.find((x) => x.id === metod);
  const z = b?.zadachi[0];
  if (z === undefined || z.vid !== 'uravnenie') return '';
  return `<div class="gen-recap z14-list-obrazec"><b>${SHEET_14.obrazec}</b>${uslovieHtml(z)}${resheniyeHtml(z)}</div>`;
}

/* ── Конфиг и адрес ─────────────────────────────────────────────── */

export function config14(): GenConfig {
  return {
    id: '14',
    scope: '14',
    slot: `${BASE_14}/generator/`,
    section: GENERATOR14_TEXTS.section,
    sheet: GENERATOR14_TEXTS.sheet,
    topics: GRUPPY_14.map((g) => ({
      id: g.id,
      title: g.title,
      subtypes: g.metody.map((m) => {
        const b = BLOKI_14.find((x) => x.id === m);
        return {
          id: m,
          code: String(b?.no ?? ''),
          title: b?.nazvanie ?? m,
          level: 1 as const,
          bank: pulMetoda(m, 'mix').length,
        };
      }),
    })),
    levels: [],
    sources: GENERATOR14_SOURCES,
    presets: GENERATOR14_PRESETS,
    limits: { maxPerTopic: 12, maxTasks: 20, variantsMax: 4 },
    extras: { kinds: Object.entries(VIDY).map(([id, title]) => ({ id, title })) },
  };
}

const METODY = new Set<string>(BLOKI_14.map((b) => b.id));

export function paramsIzSostoyaniya14(state: GenState & { seed: string }): Params14 {
  const e = state.extras;
  return {
    sostav: sostavIzSlotov(state.plan),
    src: state.source,
    variants: state.variants,
    seed: state.seed,
    zameny: state.zameny,
    kind: e.kind,
    svoy: e.svoy ?? '',
    date: e.date,
    teacher: e.teacher,
    theory: e.theory,
    examples: e.examples,
  };
}

export function query14(p: Params14): string {
  const q = new URLSearchParams();
  q.set('s', sostavStroka(p.sostav));
  q.set('src', p.src);
  q.set('v', String(p.variants));
  q.set('seed', p.seed);
  const z = Object.entries(p.zameny)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${k}:${n}`)
    .join(',');
  if (z !== '') q.set('z', z);
  if (p.kind !== null) q.set('k', p.kind);
  if (p.svoy !== '') q.set('sv', p.svoy);
  if (p.date !== '') q.set('d', p.date);
  if (p.teacher !== GENERATOR14_TEXTS.sheet.teacher) q.set('t', p.teacher);
  if (p.theory) q.set('th', '1');
  if (p.examples > 0) q.set('ex', String(p.examples));
  return q.toString();
}

export function parseQuery14(q: URLSearchParams): Params14 | null {
  const s = q.get('s');
  const seed = q.get('seed');
  if (s === null || seed === null || seed === '') return null;
  const sostav = slotySostava(razobratSostav(s, true, /[a-z0-9-]+/, (id) => METODY.has(id)));
  if (sostav.length === 0) return null;
  const src = q.get('src');
  const zameny: Record<string, number> = {};
  for (const part of (q.get('z') ?? '').split(',')) {
    const m = /^(\d+\.[a-z0-9-]+_\d+):(\d+)$/.exec(part);
    if (m !== null) zameny[m[1] as string] = Number(m[2]);
  }
  const ex = Number(q.get('ex') ?? 0);
  return {
    sostav: sostavIzSlotov(sostav),
    src: src === 'bank' || src === 'new' ? src : 'mix',
    variants: Math.max(1, Math.min(4, Number(q.get('v') ?? 1) || 1)),
    seed,
    zameny,
    kind: q.get('k'),
    svoy: q.get('sv') ?? '',
    date: q.get('d') ?? '',
    teacher: q.get('t') ?? GENERATOR14_TEXTS.sheet.teacher,
    theory: q.get('th') === '1',
    examples: ex === 1 || ex === 2 ? ex : 0,
  };
}

function extrasIzParams(p: Params14, config: GenConfig): GenExtras {
  return {
    ...defaultExtras(config),
    ...vidRabotyIz(
      config,
      p.kind === 'svoy' ? p.svoy : p.kind === null ? '' : (VIDY[p.kind] ?? ''),
    ),
    date: p.date,
    teacher: p.teacher,
    theory: p.theory,
    examples: p.examples,
  };
}

/** Заголовок вида работы для листа: «Самостоятельная работа» или свой. */
export function zagolovok14(p: Params14): string {
  if (p.kind === 'svoy') return p.svoy;
  return p.kind === null ? '' : (VIDY[p.kind] ?? '');
}

/** Перед задачей: «Запомни» и образец — у первой задачи своего метода. */
export function leadPozicii(p: Params14, ryad: Poziciya14[], i: number): string {
  const poz = ryad[i];
  if (poz === undefined) return '';
  const pervaya = ryad.findIndex((x) => x.metod === poz.metod) === i;
  if (!pervaya) return '';
  return (p.theory ? zapomniHtml(poz.metod) : '') + (p.examples > 0 ? obrazecHtml(poz.metod) : '');
}

export function engine14(config: GenConfig): GenEngine {
  return {
    async build(state) {
      const p = paramsIzSostoyaniya14(state);
      return {
        variants: planLista14(p).map((ryad) =>
          ryad.map((poz, i): GenTask => {
            const lead = leadPozicii(p, ryad, i);
            return {
              pos: poz.pos,
              no: poz.no,
              questionHtml: uslovieHtml(poz.z),
              answerHtml: otvetHtml(poz.z),
              solutionHtml: resheniyeHtml(poz.z),
              fromBank: false,
              ...(lead === '' ? {} : { lead }),
              figureSvg: PUSTOY_KRUG(),
              figureTeacherSvg: krugUchitelya(poz.z),
            };
          }),
        ),
        note: null,
      };
    },
    hrefs(state) {
      const q = query14(paramsIzSostoyaniya14(state));
      return {
        student: `${BASE_14}/pechat/?${q}`,
        teacher: `${BASE_14}/pechat/otvety/?${q}`,
        all: `${BASE_14}/pechat/vse/?${q}`,
        link: `${BASE_14}/generator/?${q}`,
      };
    },
    subtitle(state) {
      return vidRabotyText(config, state.extras) || GENERATOR14_TEXTS.podzagolovok;
    },
    parse(q) {
      const p = parseQuery14(q);
      if (p === null) return null;
      return {
        source: p.src,
        levels: [],
        variants: p.variants,
        plan: slotySostava(p.sostav),
        seed: p.seed,
        zameny: p.zameny,
        extras: extrasIzParams(p, config),
      };
    },
  };
}
