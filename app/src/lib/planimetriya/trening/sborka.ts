/**
 * Задача тренажёра №1 по ключу — собирается в браузере тем же движком,
 * что и у прежнего тренажёра (trenazher/zadacha.ts: razreshit,
 * sostavZadachi — без правок): условие, чертёж условия, отпечаток
 * ответа, разбор по шагам и подсказки-вопросы. Сверху — чертежи шагов
 * решения: шаг со своим слоем показывает построения до этого слоя,
 * последний — все построения (лист учителя).
 *
 * Модуль тяжёлый (движок чертежей, решения, KaTeX): тренажёр
 * подгружает его вместе с первой задачей (zagruzka.ts).
 */

import type { VoprosPodskazki } from '@/components/tasks/trening/PodskazkaVoprosy';
import { typesetKrupno as typeset } from '../../tex';
import { analogi } from '../bank/analogi';
import { BANK_FIPI } from '../bank/fipi';
import { POROG } from '../figury';
import { renderPlan, shagovPodskazki } from '../render';
import { reshenie } from '../reshenie';
import { sealAnswer } from '../secret';
import { PROTOTIPY, prototip } from '../stseny';
import { planPoKlyuchu1 } from '../trenazher/filtry1';
import { klyuchProto, nomerAnaloga, type UslovieBanka } from '../trenazher/sessiya';
import {
  razreshit,
  sostavZadachi,
  type RazreshennayaZadacha,
  type ShagHtml,
} from '../trenazher/zadacha';
import { pereimenovat } from '../variant';
import { prototipKlyucha1 } from './klyuch';

/** Задача экрана: ключ, прототип, условие (HTML), отпечаток, чертёж условия. */
export interface Zadacha1T {
  id: string;
  prototypeId: string;
  params: Record<string, unknown>;
  /** Условие, уже набранное KaTeX. */
  text: string;
  seal: string;
  /** Номер задачи открытого банка; null — аналог или новая. */
  fipi: number | null;
  /** Чертёж условия, как в ФИПИ: без построений. */
  risunokSvg: string;
}

export interface Shag1T extends ShagHtml {
  /** Чертёж шага: построения до его слоя; у последнего — все. */
  risunokSvg: string | null;
}

export interface Vopros1T extends VoprosPodskazki {
  /** Чертёж вопроса: слой этого шага подсвечен. */
  risunokSvg: string;
}

/** Разбор задачи: шаги с чертежами, сверка, ответ, все построения, вопросы. */
export interface Reshenie1T {
  shagi: Shag1T[];
  sverkaHtml: string;
  otvetHtml: string;
  uchitelSvg: string;
  voprosy: Vopros1T[];
}

let bank: UslovieBanka[] | null = null;

/** Задачи банка и аналоги числами — как у прежнего тренажёра (trenazher/dannye.ts). */
function bankZadach(): UslovieBanka[] {
  bank ??= [
    ...BANK_FIPI.map((z) => ({
      no: z.n,
      id: klyuchProto(z.proto),
      params: z.params,
      analog: false,
    })),
    ...PROTOTIPY.flatMap((p) =>
      analogi(p.id).map((a) => ({
        no: nomerAnaloga(p.id, a.no),
        id: klyuchProto(p.id),
        params: a.params,
        analog: true,
      })),
    ),
  ];
  return bank;
}

export interface Sobrannaya1 {
  z: Zadacha1T;
  s: Reshenie1T;
}

/**
 * Разбор задачи с готовыми числами и вариантом: условие и чертёж
 * условия, шаги с чертежами, вопросы подсказки, ответ. Общий для
 * тренажёра (в браузере) и примера типа на «О задании» (на сборке).
 */
export function razborZadachi(r: RazreshennayaZadacha) {
  const sostav = sostavZadachi(r);
  const p = prototip(r.proto);
  const scena = p.stsena(r.params, POROG);
  const shagiResheniya = reshenie(r.proto, r.params).shagi;
  const n = shagovPodskazki(scena);
  const alt = `Чертёж к решению: ${pereimenovat(p.nazvanie, r.variant.bukvy).replace(/\$/g, '')}`;
  const posledniy = sostav.razbor.shagi.length - 1;
  const shagi: Shag1T[] = sostav.razbor.shagi.map((s, i) => {
    const sloy = shagiResheniya[i]?.sloy;
    return {
      ...s,
      risunokSvg:
        i === posledniy
          ? sostav.razbor.risunokSvg
          : sloy !== undefined && sloy <= n
            ? renderPlan(scena, {
                rezhim: { rezhim: 'podskazka', shag: sloy },
                variant: r.variant,
                chisla: true,
                alt,
              })
            : null,
    };
  });
  const s: Reshenie1T = {
    shagi,
    sverkaHtml: sostav.razbor.sverka,
    otvetHtml: sostav.razbor.otvetHtml,
    uchitelSvg: sostav.razbor.risunokSvg,
    voprosy: sostav.podskazki.voprosy.map((v) => ({
      voprosHtml: v.vopros,
      variantyHtml: v.knopki,
      verno: v.verno,
      ...(v.poyasnenie === '' ? {} : { kommentariyHtml: v.poyasnenie }),
      risunokSvg: v.risunokSvg,
    })),
  };
  return { sostav, s };
}

/** Собрать задачу по ключу. Чужой ключ или сбой движка — null. */
export function sobrat1(id: string): Sobrannaya1 | null {
  const plan = planPoKlyuchu1(id, '');
  if (plan === null) return null;
  try {
    const r = razreshit(plan, bankZadach());
    const { sostav, s } = razborZadachi(r);
    return {
      z: {
        id,
        prototypeId: prototipKlyucha1(id),
        params: r.params as unknown as Record<string, unknown>,
        text: typeset(sostav.uslovie),
        seal: sealAnswer(sostav.otvet),
        fipi: r.fipi,
        risunokSvg: sostav.risunokSvg,
      },
      s,
    };
  } catch {
    return null;
  }
}
