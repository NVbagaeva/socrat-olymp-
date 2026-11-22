/**
 * Реестр чертежей опорных задач №18: id задачи → живая сцена движка
 * lib/skhemy. Тексты задач — content/zadanie18/opornye/.
 */

import type { Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { sPodpisyamiIz } from '@/lib/skhemy/vidimye';
import { opornayaVidimaya18, type Parametry } from '../trenazher/sceny';
import { OP_KAS_OKR, OP_KAS_SEK, OP_OPIS_TRAP } from './kasatelnye';
import { OP_DVE_VERSHINY, OP_KVADRAT, OP_TREZUBEC } from './okruzhnost';
import { OP_BISS_MED, OP_MENELAY } from './otnosheniya';
import { OP_RASSTOYANIYA, OP_TRI_UGLA } from './ploshchadi';
import { SCENY_NOVYE } from './novye';
import { OP_BABOCHKA, OP_CHETYRE, OP_PERP_DIAG } from './trapeciya';
import { OP_BISSEKTRISA, OP_MEDIANA, OP_VYSOTY } from './treugolnik';

const SCENY: readonly ZhivayaSkhema[] = [
  OP_VYSOTY,
  OP_BISSEKTRISA,
  OP_MEDIANA,
  OP_TREZUBEC,
  OP_KVADRAT,
  OP_DVE_VERSHINY,
  OP_KAS_SEK,
  OP_OPIS_TRAP,
  OP_KAS_OKR,
  OP_BABOCHKA,
  OP_CHETYRE,
  OP_PERP_DIAG,
  OP_MENELAY,
  OP_BISS_MED,
  OP_TRI_UGLA,
  OP_RASSTOYANIYA,
  ...SCENY_NOVYE,
];

/**
 * Опорные задачи, у которых числа условия дают нечитаемый чертёж (радиусы
 * 8 и 2, угол 150°): начальное положение — по видимым параметрам того
 * же типа тренажёра (lib/zadanie18/trenazher/vidimye.ts), подписи —
 * числа задачи. Потянули точку — чертёж и подписи снова живые.
 */
const KAK_TRENAZHER: Readonly<Record<string, readonly [string, Parametry]>> = {
  'kasayushchiesya-ef': ['kas-ef', { R1: 8, R2: 2 }],
  'dve-okruzhnosti-diametr': ['dve-okr', { k: 4, AB: 2 }],
  'okruzhnost-cherez-centr': ['cherez-centr', { d: 4 }],
  'vpisannyy-ravnye-hordy': ['vpis-lmn', { KM: 8 }],
  'kvadraty-na-storonah': ['kvadraty', { AC: 14, BC: 16 }],
  'diagonali-trapecii': ['diag-trap', { a: 9, b: 4, d1: 12, d2: 5 }],
  'vysoty-perpendikulyary': ['vys-perp', { B: 30 }],
};

/**
 * Опорные задачи без своего типа тренажёра: начальное положение —
 * читаемое (угол между линиями не уже 15°), значения под чертежом —
 * по числам задачи.
 */
const NACHALO_VIDIMOE: Readonly<Record<string, Tochki>> = {
  /* Диагональ AC почти вдоль AB (13°): B — левее, диагонали по-прежнему
     перпендикулярны: h² = (x + BC)(AD − x). */
  'chetyre-tochki-trapecii': {
    A: [0, 0],
    B: [2.4, Math.sqrt(4.4 * 3.6)],
    D: [6, 0],
    p: [1 / 3, 0],
  },
  /* PA почти вдоль AB (14°): P — выше. */
  'rasstoyaniya-do-storon': { P: [3.6, 1.25], p: [4 * Math.sqrt(3), 0] },
};

function vidimaya(s: ZhivayaSkhema): ZhivayaSkhema {
  const k = KAK_TRENAZHER[s.id];
  if (k !== undefined) return opornayaVidimaya18(s, k[0], k[1]);
  const n = NACHALO_VIDIMOE[s.id];
  return n === undefined ? s : sPodpisyamiIz(s, { ...s, nachalo: n });
}

const REESTR: Readonly<Record<string, ZhivayaSkhema>> = Object.fromEntries(
  SCENY.map((s) => [s.id, vidimaya(s)]),
);

const TOCHNYE: Readonly<Record<string, ZhivayaSkhema>> = Object.fromEntries(
  SCENY.map((s) => [s.id, s]),
);

/**
 * Сцена в точной пропорции: начальное положение — числа задачи. По ней
 * scripts/verify_opornye18 пересчитывает данные и ответ.
 */
export function scenaOpornoyTochno18(id: string): ZhivayaSkhema | undefined {
  return TOCHNYE[id];
}

export function scenaOpornoy18(id: string): ZhivayaSkhema | undefined {
  return REESTR[id];
}

export function trebuetsyaScenaOpornoy18(id: string): ZhivayaSkhema {
  const s = REESTR[id];
  if (s === undefined) throw new Error(`Нет чертежа опорной задачи ${id}`);
  return s;
}
