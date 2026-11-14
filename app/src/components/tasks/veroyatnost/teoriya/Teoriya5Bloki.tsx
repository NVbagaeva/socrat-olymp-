import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import { typesetKrupno } from '@/lib/tex';
import type { PunktVyvoda, Shag5, Zadacha5 } from '@/content/veroyatnost-teoriya5';
import { Vykladka } from './Vykladka';
import './teoriya5.css';

/**
 * Общие блоки новых разделов теории №5 (совместные, независимые
 * события, условная вероятность).
 *
 * Определения, формулы, «Важно» и «Вывод» — общие рамки теории
 * (components/teoriya/Ramki) в «Стеклянной сцене» вкладки. Здесь —
 * то, чего в рамках нет: разобранная задача с подписанными шагами
 * («Шаг 1. …» — сначала словами, потом выкладка), плашка «Не путай!»
 * и список вывода.
 *
 * Выкладки шагов собирает Vykladka: на узком экране формула рвётся
 * по «=» и знакам, а не выступает за край карточки.
 */

/** Тон карточки задачи: белое стекло или светло-голубое — чередуются. */
export type Ton5 = 'belyy' | 'goluboy';

/** Шаг разбора: «Шаг 1. Что делаем», объяснение, выкладка. */
function Shag({ shag, no, children }: { shag: Shag5; no: number; children?: ReactNode }) {
  return (
    <li className="t5-shag">
      <p className="t5-shag__title">
        <span className="t5-shag__no">Шаг {no}.</span> <Tex text={shag.title} />
      </p>
      <p className="t5-shag__text">
        <Tex text={shag.text} />
      </p>
      {children}
      {shag.stroki === undefined ? null : <Vykladka stroki={shag.stroki} krupnyeDrobi />}
    </li>
  );
}

/**
 * Разобранная задача: условие, рисунок (children), шаги, ответ и
 * «Почему это работает». `vstavki` — свой блок внутри шага по его
 * номеру с нуля (пропорция, таблица), между объяснением и выкладкой.
 */
export function Razbor5({
  z,
  ton,
  yakor,
  children,
  vstavki,
  posle,
}: {
  z: Zadacha5;
  ton: Ton5;
  yakor: string;
  children?: ReactNode;
  vstavki?: Readonly<Record<number, ReactNode>>;
  /** Блок после ответа: таблица, «Проверь себя». */
  posle?: ReactNode;
}) {
  return (
    <section className={`t5-zadacha t5-zadacha--${ton}`} id={yakor}>
      <p className="t5-zadacha__plashka">Задача</p>
      <h4 className="t5-zadacha__title">
        <Tex text={z.title} zagolovok />
      </h4>
      <p className="t5-zadacha__uslovie">
        <Tex text={z.uslovie} />
      </p>
      {children}
      <p className="t5-zadacha__reshenie">Решение</p>
      <ol className="t5-shagi">
        {z.shagi.map((shag, i) => (
          <Shag key={shag.title} shag={shag} no={i + 1}>
            {vstavki?.[i]}
          </Shag>
        ))}
      </ol>
      <p className="t5-zadacha__otvet">
        Ответ: <span dangerouslySetInnerHTML={{ __html: typesetKrupno(z.otvet) }} />
      </p>
      {posle}
      {z.pochemu === undefined ? null : (
        <div className="t5-pochemu">
          <p className="t5-pochemu__title">Почему это работает</p>
          <p className="t5-pochemu__text">
            <Tex text={z.pochemu} />
          </p>
          {z.pochemuStroki === undefined ? null : (
            <Vykladka stroki={z.pochemuStroki} krupnyeDrobi />
          )}
          {z.pochemuItog === undefined ? null : (
            <p className="t5-pochemu__text">
              <Tex text={z.pochemuItog} />
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** Абзацы с формулами. */
export function Abzacy5({ stroki, className }: { stroki: readonly string[]; className: string }) {
  return (
    <>
      {stroki.map((s) => (
        <p className={className} key={s}>
          <Tex text={s} />
        </p>
      ))}
    </>
  );
}

/**
 * «Не путай!» — своя яркая плашка: оранжевый акцент, а не терракота
 * «Важно» и не зелень «Вывода». Внутри — пример, на котором видно,
 * почему путать нельзя.
 */
export function NePutay({
  title,
  yakor,
  children,
}: {
  title: string;
  yakor: string;
  children: ReactNode;
}) {
  return (
    <aside className="t5-neputay" id={yakor}>
      <p className="t5-neputay__title">
        <span className="t5-neputay__znak" aria-hidden="true">
          ⇄
        </span>
        {title}
      </p>
      {children}
    </aside>
  );
}

/** Шаги внутри плашки (пример «Не путай!»): тот же вид «Шаг 1. …». */
export function ShagiPlashki({ shagi }: { shagi: readonly Shag5[] }) {
  return (
    <ol className="t5-shagi t5-shagi--plashka">
      {shagi.map((shag, i) => (
        <Shag key={shag.title} shag={shag} no={i + 1} />
      ))}
    </ol>
  );
}

/** Список вывода: правило словами, формула — выкладкой под ним. */
export function SpisokVyvoda({ punkty }: { punkty: readonly PunktVyvoda[] }) {
  return (
    <ul className="t5-vyvod">
      {punkty.map((p) => (
        <li key={p.text}>
          <Tex text={p.text} />
          {p.formula === undefined ? null : <Vykladka stroki={[p.formula]} krupnyeDrobi />}
        </li>
      ))}
    </ul>
  );
}

/** Рисунок с подписью внутри карточки. */
export function Risunok5({ children, podpis }: { children: ReactNode; podpis?: string }) {
  return (
    <figure className="t5-risunok">
      {children}
      {podpis === undefined ? null : (
        <figcaption className="t5-risunok__podpis">
          <Tex text={podpis} />
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Главная формула — рамка «Формула» общих рамок теории (ramka--formula),
 * но набрана выкладкой: на телефоне длинная формула («формула полной
 * вероятности») переносится по «=» и «+», а не уезжает за край с
 * прокруткой.
 */
export function Formula5({
  formula,
  podpis,
  yakor,
}: {
  formula: string;
  podpis?: string;
  yakor?: string;
}) {
  return (
    <figure
      className="ramka ramka--formula t5-formula"
      {...(yakor === undefined ? {} : { id: yakor })}
    >
      <Vykladka stroki={[formula]} krupnyeDrobi />
      {podpis === undefined ? null : (
        <figcaption className="ramka__podpis">
          <Tex text={podpis} />
        </figcaption>
      )}
    </figure>
  );
}
