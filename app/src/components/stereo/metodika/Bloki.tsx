import katex from 'katex';
import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import {
  IkAlgoritm,
  IkGalochka,
  IkIdeya,
  IkKrestik,
  IkLampa,
  IkLovushka,
  IkNazad,
  IkVazhno,
  IkVpered,
  IkZadacha,
} from './Ikonki';
import { Svernuto } from './Svernuto';

/**
 * Блоки новых экранов №3 (макеты этапа 1): раздел главы со счётчиком,
 * «Идея метода», степпер шагов, «Задача», «Решение», «Ответ», «Важно»,
 * «Лайфхак», «Ловушка» в две колонки. Только оформление: тексты
 * приходят из данных главы (lib/stereo/glava2.ts).
 *
 * Общие рамки теории (components/teoriya/Ramki.tsx) не тронуты — ими
 * пользуются другие разделы сайта.
 */

export function Formula({ tex }: { tex: string }) {
  return (
    <span
      className="o3-formula"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: false, displayMode: true }),
      }}
    />
  );
}

export function Abzacy({ paras }: { paras: readonly string[] }) {
  return (
    <>
      {paras.map((para) => (
        <p className="o3-p" key={para}>
          <Tex text={para} />
        </p>
      ))}
    </>
  );
}

/** Сосед раздела для стрелок «назад / вперёд». */
export interface SosedRazdela {
  id: string;
  title: string;
}

/**
 * Раздел главы: заголовок с оранжевой чертой, счётчик «k / n» и
 * стрелки к соседним разделам. Стрелки — обычные ссылки на якоря:
 * глава остаётся одной страницей, а «Содержание» рядом липнет.
 */
export function RazdelGlavy({
  id,
  title,
  lead,
  k,
  n,
  prev,
  next,
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  k: number;
  n: number;
  prev?: SosedRazdela;
  next?: SosedRazdela;
  children: ReactNode;
}) {
  return (
    <section className="o3-razdel" id={id} aria-labelledby={`${id}-t`}>
      <header className="o3-razdel__head">
        <div className="o3-razdel__zag">
          <h4 className="o3-razdel__title" id={`${id}-t`}>
            {title}
          </h4>
          {lead === undefined ? null : (
            <p className="o3-razdel__lead">
              <Tex text={lead} />
            </p>
          )}
        </div>
        <nav className="o3-schet" aria-label={`Раздел ${k} из ${n}`}>
          {prev === undefined ? (
            <span className="o3-schet__btn is-off" aria-hidden="true">
              <IkNazad />
            </span>
          ) : (
            <a className="o3-schet__btn" href={`#${prev.id}`} aria-label={`Назад: ${prev.title}`}>
              <IkNazad />
            </a>
          )}
          <span className="o3-schet__n" aria-hidden="true">
            <b>{k}</b> / {n}
          </span>
          {next === undefined ? (
            <span className="o3-schet__btn is-off" aria-hidden="true">
              <IkVpered />
            </span>
          ) : (
            <a className="o3-schet__btn" href={`#${next.id}`} aria-label={`Вперёд: ${next.title}`}>
              <IkVpered />
            </a>
          )}
        </nav>
      </header>
      {children}
    </section>
  );
}

/** «Идея метода»: оранжевая рамка с мишенью. */
export function RamkaIdeya({ title = 'Идея метода', children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="o3-ramka o3-ramka--ideya">
      <IkIdeya className="o3-ramka__ik" />
      <div className="o3-ramka__telo">
        <p className="o3-ramka__title">{title}</p>
        {children}
      </div>
    </aside>
  );
}

export interface ShagSteppera {
  title: string;
  telo?: ReactNode;
}

/**
 * Вертикальный степпер: синие номера в кружках, соединительная линия,
 * у шага — карточка. На телефоне шаг сворачивается до заголовка
 * (svernut), на компьютере открыт.
 */
export function Stepper({
  shagi,
  nomera,
  svernut = false,
  className,
}: {
  shagi: readonly ShagSteppera[];
  /** Свои номера шагов (номера шагов алгоритма); не заданы — 1, 2, 3… */
  nomera?: readonly number[];
  svernut?: boolean;
  className?: string;
}) {
  return (
    <ol className={className === undefined ? 'o3-stepper' : `o3-stepper ${className}`}>
      {shagi.map((shag, i) => {
        const zag = (
          <span className="o3-stepper__t">
            <Tex text={shag.title} zagolovok />
          </span>
        );
        return (
          <li className="o3-stepper__shag" key={`${i}-${shag.title}`}>
            <span className="o3-stepper__n" aria-hidden="true">
              {nomera?.[i] ?? i + 1}
            </span>
            <div className="o3-stepper__karta">
              {svernut && shag.telo !== undefined ? (
                <Svernuto zagolovok={zag} otkryto={i === 0}>
                  {shag.telo}
                </Svernuto>
              ) : (
                <>
                  {zag}
                  {shag.telo}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Заголовок карточки со значком: «Алгоритм применения», «Решение». */
export function ZagolovokKarty({ ikonka, children }: { ikonka: ReactNode; children: ReactNode }) {
  return (
    <span className="o3-karta__zag">
      {ikonka}
      <span>{children}</span>
    </span>
  );
}

/** Карточка «Алгоритм»: степпер шагов под заголовком с шестерёнкой. */
export function KartaAlgoritm({ title, shagi }: { title: string; shagi: readonly ShagSteppera[] }) {
  return (
    <section className="o3-karta o3-karta--algoritm">
      <h5 className="o3-karta__h">
        <ZagolovokKarty ikonka={<IkAlgoritm className="o3-karta__ik" />}>{title}</ZagolovokKarty>
      </h5>
      <Stepper shagi={shagi} svernut />
    </section>
  );
}

/** «Задача»: синяя плашка и условие. */
export function KartaZadacha({ uslovie, children }: { uslovie: string; children?: ReactNode }) {
  return (
    <section className="o3-karta o3-karta--zadacha">
      <p className="o3-plashka">
        <IkZadacha className="o3-plashka__ik" />
        Задача
      </p>
      <p className="o3-p o3-uslovie">
        <Tex text={uslovie} />
      </p>
      {children}
    </section>
  );
}

/** «Решение»: степпер по шагам алгоритма; на телефоне свёрнуто. */
export function KartaReshenie({
  shagi,
  nomera,
}: {
  shagi: readonly ShagSteppera[];
  nomera?: readonly number[];
}) {
  return (
    <section className="o3-karta o3-karta--reshenie">
      <Svernuto
        zagolovok={<ZagolovokKarty ikonka={<IkAlgoritm className="o3-karta__ik" />}>Решение</ZagolovokKarty>}
      >
        <Stepper shagi={shagi} {...(nomera === undefined ? {} : { nomera })} className="o3-stepper--reshenie" />
      </Svernuto>
    </section>
  );
}

/** «Ответ: $20$.» → «$20$»: слово «Ответ» уже стоит заголовком рамки. */
function bezSlovaOtvet(otvet: string): string {
  return otvet.replace(/^Ответ:\s*/, '').replace(/\.$/, '');
}

/** «Ответ»: оранжевая рамка с галочкой. */
export function RamkaOtvet({ otvet }: { otvet: string }) {
  return (
    <aside className="o3-ramka o3-ramka--otvet">
      <span className="o3-ramka__krug" aria-hidden="true">
        <IkGalochka />
      </span>
      <div className="o3-ramka__telo">
        <p className="o3-ramka__title">Ответ</p>
        <p className="o3-p">
          <Tex text={bezSlovaOtvet(otvet)} />
        </p>
      </div>
    </aside>
  );
}

/** «Важно: …» → ярлык «Важно» и подзаголовок «…». */
function razrezat(title: string, yarlyk: string): { yarlyk: string; pod: string | null } {
  const m = /^([^:]+):\s*(.+)$/.exec(title);
  if (m === null) return { yarlyk: title || yarlyk, pod: null };
  const pod = m[2] ?? '';
  return { yarlyk: m[1] ?? yarlyk, pod: pod === '' ? null : pod.charAt(0).toUpperCase() + pod.slice(1) };
}

function RamkaSoZnachkom({
  vid,
  title,
  ikonka,
  children,
}: {
  vid: 'vazhno' | 'layfhak';
  title: string;
  ikonka: ReactNode;
  children: ReactNode;
}) {
  const { yarlyk, pod } = razrezat(title, vid === 'vazhno' ? 'Важно' : 'Лайфхак');
  return (
    <aside className={`o3-ramka o3-ramka--${vid}`}>
      <Svernuto
        zagolovok={
          <span className="o3-ramka__shapka">
            <span className="o3-ramka__krug" aria-hidden="true">
              {ikonka}
            </span>
            <span className="o3-ramka__title">{yarlyk}</span>
          </span>
        }
      >
        <div className="o3-ramka__telo">
          {pod === null ? null : (
            <p className="o3-ramka__pod">
              <Tex text={pod} />
            </p>
          )}
          {children}
        </div>
      </Svernuto>
    </aside>
  );
}

export function RamkaVazhno({ title, children }: { title: string; children: ReactNode }) {
  return (
    <RamkaSoZnachkom vid="vazhno" title={title} ikonka={<IkVazhno />}>
      {children}
    </RamkaSoZnachkom>
  );
}

export function RamkaLayfhak({ title, children }: { title: string; children: ReactNode }) {
  return (
    <RamkaSoZnachkom vid="layfhak" title={title} ikonka={<IkLampa />}>
      {children}
    </RamkaSoZnachkom>
  );
}

/**
 * «Ловушка»: красно-розовая рамка, заголовок с формулировкой в одну
 * строку, ниже две колонки — «В чём ошибка?» и «Как правильно?», у
 * каждой свой чертёж. На телефоне колонки друг под другом.
 */
export function RamkaLovushka({
  title,
  neverno,
  verno,
  risunokNeverno,
  risunokVerno,
  zadacha,
}: {
  title: string;
  neverno: readonly string[];
  verno: readonly string[];
  risunokNeverno?: ReactNode;
  risunokVerno?: ReactNode;
  /** Задача ловушки с верным решением — под колонками. */
  zadacha?: ReactNode;
}) {
  return (
    <aside className="o3-ramka o3-ramka--lovushka">
      <p className="o3-lov__head">
        <IkLovushka className="o3-lov__ik" />
        <span className="o3-ramka__title">Ловушка</span>
        <span className="o3-lov__chip">
          <Tex text={title} />
        </span>
      </p>
      <div className="o3-lov__dve">
        <div className="o3-lov__kol o3-lov__kol--neverno">
          <p className="o3-lov__metka">
            <span className="o3-lov__znak" aria-hidden="true">
              <IkKrestik />
            </span>
            В чём ошибка?
          </p>
          <Abzacy paras={neverno} />
          {risunokNeverno === undefined ? null : <div className="o3-lov__ris">{risunokNeverno}</div>}
        </div>
        <div className="o3-lov__kol o3-lov__kol--verno">
          <p className="o3-lov__metka">
            <span className="o3-lov__znak" aria-hidden="true">
              <IkGalochka />
            </span>
            Как правильно?
          </p>
          <Abzacy paras={verno} />
          {risunokVerno === undefined ? null : <div className="o3-lov__ris">{risunokVerno}</div>}
        </div>
      </div>
      {zadacha === undefined ? null : <div className="o3-lov__zadacha">{zadacha}</div>}
    </aside>
  );
}
