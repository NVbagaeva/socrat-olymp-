import katex from 'katex';
import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';

/**
 * Рамки теории — общий набор для разделов сайта (первым его берёт
 * «Понятие производной» в №9, дальше — №1 и другие). Шесть видов,
 * у каждого своя роль:
 *
 *   Определение     — цветная полоса слева, светлая заливка, плашка;
 *   Главная формула — двойная рамка по центру, крупная формула KaTeX;
 *   Задача          — номер в кружке ①②, как в конспекте;
 *   Пример          — пунктирная рамка, решение по шагам с подписями;
 *   Важно!          — рамка с восклицательным знаком: напоминания;
 *   Вывод           — рамка со стрелкой ⇒.
 *
 * Разметка простая и одинаковая на телефоне и на печати; оформление —
 * styles/ramki.css (палитра сайта, ч/б печать остаётся читаемой: роль
 * рамки видна по форме — полоса, двойная линия, пунктир, значок, —
 * а не только по цвету). Вся математика — KaTeX: строки с $…$ идут
 * через Tex, формулы — через katex.renderToString.
 */

function Formula({ tex, className }: { tex: string; className?: string }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: false, displayMode: true }),
      }}
    />
  );
}

/** Абзацы со строками «текст $формула$». */
export function Abzacy({ paras }: { paras: readonly string[] }) {
  return (
    <>
      {paras.map((para) => (
        <p className="ramka__p" key={para}>
          <Tex text={para} />
        </p>
      ))}
    </>
  );
}

export function RamkaOpredelenie({
  title = 'Определение',
  children,
  formula,
}: {
  title?: string;
  children?: ReactNode;
  formula?: string;
}) {
  return (
    <section className="ramka ramka--opredelenie">
      <span className="ramka__plashka">{title}</span>
      {children}
      {formula === undefined ? null : <Formula tex={formula} className="ramka__formula" />}
    </section>
  );
}

export function RamkaFormula({ formula, podpis }: { formula: string; podpis?: string }) {
  return (
    <figure className="ramka ramka--formula">
      <Formula tex={formula} className="ramka__formula ramka__formula--glavnaya" />
      {podpis === undefined ? null : (
        <figcaption className="ramka__podpis">
          <Tex text={podpis} />
        </figcaption>
      )}
    </figure>
  );
}

export function RamkaZadacha({
  no,
  title,
  children,
  id,
}: {
  no: number;
  title: string;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <section className="ramka ramka--zadacha" {...(id === undefined ? {} : { id })}>
      <h4 className="ramka__zagolovok">
        <span className="ramka__nomer" aria-hidden="true">
          {no}
        </span>
        <span className="sr-only">Задача {no}. </span>
        <Tex text={title} zagolovok />
      </h4>
      {children}
    </section>
  );
}

export interface ShagPrimera {
  /** Подпись этапа: «Даём приращение». */
  label: string;
  /** Пояснение — после выкладки этапа. */
  paras?: readonly string[];
  /** Выносные формулы этапа: идут сразу под подписью. */
  formuly?: readonly string[];
}

export function RamkaPrimer({
  title,
  uslovie,
  shagi,
  otvet,
  children,
}: {
  title: string;
  uslovie?: string;
  shagi: readonly ShagPrimera[];
  otvet?: string;
  children?: ReactNode;
}) {
  return (
    <section className="ramka ramka--primer">
      <span className="ramka__plashka ramka__plashka--primer">Пример</span>
      <h4 className="ramka__zagolovok">
        <Tex text={title} zagolovok />
      </h4>
      {uslovie === undefined ? null : (
        <p className="ramka__p ramka__uslovie">
          <Tex text={uslovie} />
        </p>
      )}
      {children}
      <ol className="ramka__shagi">
        {shagi.map((shag) => (
          <li className="ramka__shag" key={shag.label}>
            <span className="ramka__shag-label">
              <Tex text={shag.label} />
            </span>
            {/* Сначала выкладка, потом пояснение к ней. */}
            {(shag.formuly ?? []).map((f) => (
              <Formula tex={f} className="ramka__formula" key={f} />
            ))}
            {(shag.paras ?? []).map((para) => (
              <p className="ramka__p" key={para}>
                <Tex text={para} />
              </p>
            ))}
          </li>
        ))}
      </ol>
      {otvet === undefined ? null : (
        <p className="ramka__otvet">
          <Tex text={otvet} />
        </p>
      )}
    </section>
  );
}

export function RamkaVazhno({
  title = 'Важно!',
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <aside className="ramka ramka--vazhno">
      <span className="ramka__znak" aria-hidden="true">
        !
      </span>
      <div className="ramka__telo">
        <p className="ramka__titul">{title}</p>
        {children}
      </div>
    </aside>
  );
}

export function RamkaVyvod({
  title = 'Вывод',
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <aside className="ramka ramka--vyvod">
      <span className="ramka__znak ramka__znak--vyvod" aria-hidden="true">
        ⇒
      </span>
      <div className="ramka__telo">
        <p className="ramka__titul">{title}</p>
        {children}
      </div>
    </aside>
  );
}

/**
 * «Лайфхак» — приём счёта или чертежа. Как «Важно!», значок слева;
 * у приёма всегда есть задача, на которой видно, почему он работает
 * (children).
 */
export function RamkaLayfhak({
  title = 'Лайфхак',
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <aside className="ramka ramka--layfhak">
      <span className="ramka__znak ramka__znak--layfhak" aria-hidden="true">
        ✦
      </span>
      <div className="ramka__telo">
        <p className="ramka__titul">{title}</p>
        {children}
      </div>
    </aside>
  );
}

/**
 * «Ловушка» — отдельной рамкой: неверный ход, почему он неверен и как
 * правильно. Две колонки «Неверно / Верно» на компьютере, одна под
 * другой на телефоне.
 */
export function RamkaLovushka({
  title,
  neverno,
  verno,
  children,
}: {
  title: string;
  /** Неверный ход: абзацы со строками «текст $формула$». */
  neverno: readonly string[];
  /** Как правильно. */
  verno: readonly string[];
  children?: ReactNode;
}) {
  return (
    <aside className="ramka ramka--lovushka">
      <p className="ramka__titul ramka__titul--lovushka">
        <span className="ramka__znak ramka__znak--lovushka" aria-hidden="true">
          ⚠
        </span>
        <span>
          Ловушка: <Tex text={title} />
        </span>
      </p>
      {children}
      <div className="ramka__dve">
        <div className="ramka__neverno">
          <p className="ramka__metka">Неверно</p>
          <Abzacy paras={neverno} />
        </div>
        <div className="ramka__verno">
          <p className="ramka__metka">Верно</p>
          <Abzacy paras={verno} />
        </div>
      </div>
    </aside>
  );
}
