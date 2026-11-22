'use client';

/**
 * Запись одной задачи в журнал — то, чем пользуются экраны разделов.
 *
 *   const z = useZapisZadachi(meta);  // meta — задача на экране или null
 *   z?.popytka('0,5', false);         // каждая попытка ответа
 *   z?.shagPodskazki(2);              // открыт второй шаг подсказки
 *   z?.oshibkaPodskazki(2);           // неверная кнопка на втором шаге
 *   z?.fakt();  z?.reshenie();        // «Показать свойство», «Показать решение»
 *   z?.zakryt(true, '0.5');           // задача закрыта: верно ли и верный ответ
 *   z?.propustit();                   // «Пропустить»
 *
 * Без входа ученика, без флага журнала или вне его разделов хук отдаёт
 * null — экраны вызывают методы через «?.» и больше ничего не знают.
 *
 * Время. Общий таймер страницы (./aktivnoe.ts) идёт, пока вкладка видна
 * и есть действия. Запись берёт его показание при открытии задачи и
 * считает разницу; общее время — по часам от открытия.
 */

import { useEffect, useMemo } from 'react';
import { currentUser } from '@/lib/auth/session';
import { aktivnyyTaymer, type AktivnyyTaymer } from './aktivnoe';
import { zhurnalRazdel } from './config';
import {
  iskhodPoKhodu,
  novayaZapis,
  sOshibkoyPodskazki,
  sOtmetkoy,
  sPopytkoy,
  sShagomPodskazki,
  sVremenem,
  zakryta,
  type Iskhod,
  type NovayaZadacha,
  type VidPopytki,
  type ZapisZadachi,
} from './model';
import { dosylka, otpravit, zapisatZadachu } from './ochered';

/* ── Таймер страницы ───────────────────────────────────────────── */

let taymer: AktivnyyTaymer | null = null;
const otkrytye = new Set<Zapisyvatel>();

function taymerStranitsy(): AktivnyyTaymer {
  if (taymer !== null) return taymer;
  const t = aktivnyyTaymer(Date.now(), document.visibilityState === 'visible');
  taymer = t;
  const deystvie = () => t.deystvie(Date.now());
  for (const sobytie of ['pointerdown', 'keydown', 'input', 'scroll', 'wheel', 'touchstart']) {
    window.addEventListener(sobytie, deystvie, { passive: true, capture: true });
  }
  document.addEventListener('visibilitychange', () => {
    const vidna = document.visibilityState === 'visible';
    t.vidimost(vidna, Date.now());
    if (!vidna) {
      /* Перед отправкой — свежее время у открытых задач. */
      for (const z of otkrytye) z.obnovitVremya();
      void otpravit();
    }
  });
  dosylka();
  return t;
}

/* ── Запись задачи ─────────────────────────────────────────────── */

export interface ZapisZadachiApi {
  popytka(answer: string, ok: boolean, vid?: VidPopytki): void;
  shagPodskazki(shag: number): void;
  oshibkaPodskazki(shag: number): void;
  fakt(): void;
  reshenie(): void;
  /** Закрыть задачу: исход по ходу решения (верно с первой попытки, с подсказкой…). */
  zakryt(verno: boolean, answerKey?: string): void;
  /** Закрыть с заданным исходом: «ушёл», «пропустил», исход экрана. */
  zakrytKak(iskhod: Iskhod, answerKey?: string): void;
  propustit(answerKey?: string): void;
}

class Zapisyvatel implements ZapisZadachiApi {
  private z: ZapisZadachi;
  private readonly aktivnoeOt: number;
  private readonly otkryta: number;

  constructor(meta: NovayaZadacha) {
    const t = taymerStranitsy();
    this.otkryta = Date.now();
    this.aktivnoeOt = t.aktivnoe(this.otkryta);
    this.z = novayaZapis(meta, this.otkryta);
    otkrytye.add(this);
  }

  private izmenit(next: ZapisZadachi): void {
    const now = Date.now();
    const aktivnoe = (taymer?.aktivnoe(now) ?? this.aktivnoeOt) - this.aktivnoeOt;
    this.z = sVremenem(next, aktivnoe, now - this.otkryta);
    if (this.z.outcome !== null) otkrytye.delete(this);
    zapisatZadachu(this.z);
  }

  obnovitVremya(): void {
    if (this.z.outcome === null) this.izmenit(this.z);
  }

  /** Экран ушёл с задачи. Открытая остаётся открытой: учитель увидит «не закончил». */
  otpustit(): void {
    this.obnovitVremya();
    otkrytye.delete(this);
  }

  popytka(answer: string, ok: boolean, vid: VidPopytki = 'answer'): void {
    this.izmenit(sPopytkoy(this.z, answer, ok, vid, Date.now()));
  }
  shagPodskazki(shag: number): void {
    this.izmenit(sShagomPodskazki(this.z, shag));
  }
  oshibkaPodskazki(shag: number): void {
    this.izmenit(sOshibkoyPodskazki(this.z, shag));
  }
  fakt(): void {
    this.izmenit(sOtmetkoy(this.z, 'shown_fact'));
  }
  reshenie(): void {
    this.izmenit(sOtmetkoy(this.z, 'shown_solution'));
  }
  zakryt(verno: boolean, answerKey?: string): void {
    /* Верный ответ неизвестен экрану (ответ закрыт отпечатком) — им будет верная попытка ученика. */
    const key = answerKey ?? (verno ? [...this.z.popytki].reverse().find((p) => p.ok)?.answer : undefined);
    this.zakrytKak(iskhodPoKhodu(this.z, verno), key);
  }
  zakrytKak(iskhod: Iskhod, answerKey?: string): void {
    this.izmenit(zakryta(this.z, iskhod, Date.now(), answerKey));
  }
  propustit(answerKey?: string): void {
    this.izmenit(zakryta(sOtmetkoy(this.z, 'skipped'), 'skipped', Date.now(), answerKey));
  }
}

/** Пишется ли журнал этой задаче сейчас: ученик вошёл, раздел в журнале. */
export function pishetsya(taskNo: number): boolean {
  if (typeof window === 'undefined' || !zhurnalRazdel(taskNo)) return false;
  return currentUser()?.role === 'student';
}

/** Начать запись задачи вне React. null — журнал этой задаче не пишется. */
export function nachatZapis(meta: NovayaZadacha): ZapisZadachiApi | null {
  return pishetsya(meta.task_no) ? new Zapisyvatel(meta) : null;
}

/**
 * Запись задачи на экране. Новая запись — когда меняется id задачи
 * (meta.id); при уходе с задачи время дописывается.
 */
export function useZapisZadachi(meta: NovayaZadacha | null): ZapisZadachiApi | null {
  const id = meta?.id ?? null;
  /* meta пересобирается на каждом рендере; запись живёт, пока тот же id. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const zapis = useMemo(() => (meta === null ? null : nachatZapis(meta)), [id]);
  useEffect(
    () => () => {
      if (zapis instanceof Zapisyvatel) zapis.otpustit();
    },
    [zapis],
  );
  return zapis;
}
