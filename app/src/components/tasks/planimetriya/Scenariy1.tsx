'use client';

import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { FigureZoom } from '@/components/ui';
import { SCENARIY1 } from '@/content/planimetriya1';
import type { ScenariyHtml, ShagScenariyaHtml } from '@/lib/planimetriya/scenariy';
import { Ikonka } from '../steklo';
import { FaktKnopka1 } from './fakt/FaktKnopka1';
import './scenariy1.css';

const T = SCENARIY1;

function Chertezh({ svg, label }: { svg: string; label: string }) {
  return (
    <FigureZoom className="sc1__chertezh" label={label}>
      <span className="pl-wrap" dangerouslySetInnerHTML={{ __html: svg }} />
    </FigureZoom>
  );
}

/** Ход по шагу: сколько ошибок, на каком уточняющем вопросе. */
interface Hod {
  oshibok: number;
  mimo: number[];
  /** Уточняющие вопросы: сколько пройдено и ошибки текущего. */
  pod: number;
  podMimo: number[];
}

const NOVYY: Hod = { oshibok: 0, mimo: [], pod: 0, podMimo: [] };

/**
 * Пройденный шаг: вопрос, верная кнопка, «Да, потому что…», формулы и
 * чертёж, на котором появилось то, о чём шаг. otkryt — ответ показан
 * после второй ошибки.
 */
function Proyden({ s, n, otkryt }: { s: ShagScenariyaHtml; n: number; otkryt: boolean }) {
  return (
    <li className="trn-vopros sc1-shag is-proyden">
      {s.risunokPosle === null ? null : (
        <div className="trn-vopros__risunok">
          <Chertezh svg={s.risunokPosle} label={T.risunok(n)} />
        </div>
      )}
      {s.vvodHtml === '' ? null : (
        <p className="trn-vopros__vvod" dangerouslySetInnerHTML={{ __html: s.vvodHtml }} />
      )}
      <p className="trn-vopros__tekst" dangerouslySetInnerHTML={{ __html: s.voprosHtml }} />
      <p
        className="trn-vopros__knopka is-verno sc1-otvet"
        dangerouslySetInnerHTML={{ __html: s.knopkiHtml[s.verno] ?? '' }}
      />
      <div className="sc1-da" role="status">
        <p>
          <b>{otkryt ? T.pravilno : T.da}</b>{' '}
          <span dangerouslySetInnerHTML={{ __html: s.daHtml }} />
        </p>
        {s.formulyHtml.map((f, i) => (
          <p className="sc1-formula" key={i} dangerouslySetInnerHTML={{ __html: f }} />
        ))}
      </div>
      {s.fakt === null ? null : <FaktKnopka1 fakt={s.fakt} />}
    </li>
  );
}

/** Кнопки вопроса. */
function Knopki({
  s,
  mimo,
  onOtvet,
}: {
  s: ShagScenariyaHtml;
  mimo: readonly number[];
  onOtvet: (j: number) => void;
}) {
  return (
    <div className="trn-vopros__knopki" role="group" aria-label={T.varianty}>
      {s.knopkiHtml.map((html, j) => (
        <button
          type="button"
          key={j}
          className={clsx('trn-vopros__knopka', mimo.includes(j) && 'is-mimo')}
          disabled={mimo.includes(j)}
          onClick={() => onOtvet(j)}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}
    </div>
  );
}

/**
 * Текущий шаг. Верно — шаг пройден. Первая ошибка — уточнение
 * (мини-объяснение и уточняющие вопросы), правильный ответ не
 * называется; затем тот же вопрос. Вторая ошибка — правильный ответ с
 * объяснением.
 */
function Tekushchiy({
  s,
  n,
  hod,
  setHod,
  onProyden,
}: {
  s: ShagScenariyaHtml;
  n: number;
  hod: Hod;
  setHod: (h: Hod) => void;
  onProyden: (otkryt: boolean) => void;
}) {
  const vUtochnenii = hod.oshibok === 1 && hod.pod < s.podvoprosy.length;
  const pod = vUtochnenii ? s.podvoprosy[hod.pod] : undefined;
  return (
    <li className="trn-vopros sc1-shag is-tekushchiy">
      {s.risunokDo === null ? null : (
        <div className="trn-vopros__risunok">
          <Chertezh svg={pod?.risunokPosle ?? s.risunokDo} label={T.risunok(n)} />
        </div>
      )}
      {s.vvodHtml === '' ? null : (
        <p className="trn-vopros__vvod" dangerouslySetInnerHTML={{ __html: s.vvodHtml }} />
      )}
      <p className="trn-vopros__tekst" dangerouslySetInnerHTML={{ __html: s.voprosHtml }} />
      {hod.oshibok === 0 || pod === undefined ? (
        <Knopki
          s={s}
          mimo={hod.mimo}
          onOtvet={(j) => {
            if (j === s.verno) {
              onProyden(false);
              return;
            }
            if (hod.oshibok >= 1) onProyden(true);
            else setHod({ ...hod, oshibok: 1, mimo: [...hod.mimo, j] });
          }}
        />
      ) : null}
      {hod.oshibok === 1 ? (
        <div className="sc1-utochnenie" role="status">
          <p>
            <b>{T.nePotoropis}</b>{' '}
            {s.utochnenieHtml === '' ? (
              T.podumay
            ) : (
              <span dangerouslySetInnerHTML={{ __html: s.utochnenieHtml }} />
            )}
          </p>
          {s.podvoprosy.length === 0 ? null : (
            <ol className="sc1-podvoprosy">
              {s.podvoprosy.slice(0, hod.pod).map((p, i) => (
                <li key={i}>
                  <p dangerouslySetInnerHTML={{ __html: p.voprosHtml }} />
                  <p className="sc1-da">
                    <b>{T.da}</b> <span dangerouslySetInnerHTML={{ __html: p.daHtml }} />
                  </p>
                  {p.formulyHtml.map((f, k) => (
                    <p className="sc1-formula" key={k} dangerouslySetInnerHTML={{ __html: f }} />
                  ))}
                </li>
              ))}
              {pod === undefined ? null : (
                <li>
                  <p
                    className="sc1-podvopros"
                    dangerouslySetInnerHTML={{ __html: pod.voprosHtml }}
                  />
                  <Knopki
                    s={pod}
                    mimo={hod.podMimo}
                    onOtvet={(j) =>
                      setHod(
                        j === pod.verno
                          ? { ...hod, pod: hod.pod + 1, podMimo: [] }
                          : { ...hod, podMimo: [...hod.podMimo, j] },
                      )
                    }
                  />
                  {hod.podMimo.length > 0 && pod.utochnenieHtml !== '' ? (
                    <p
                      className="sc1-utochnenie__mini"
                      dangerouslySetInnerHTML={{ __html: pod.utochnenieHtml }}
                    />
                  ) : null}
                </li>
              )}
            </ol>
          )}
          {s.podvoprosy.length > 0 && pod === undefined ? <p>{T.vernyomsya}</p> : null}
        </div>
      ) : null}
      {s.fakt === null ? null : <FaktKnopka1 fakt={s.fakt} podsvetit={hod.oshibok > 0} />}
    </li>
  );
}

type KnopkaVybora =
  | { sposob: number; nevernaya: -1; html: string }
  | { sposob: null; nevernaya: number; html: string };

/**
 * Кнопки первого вопроса: построение способа 1, неудачный вариант,
 * построение способа 2, ещё неудачный… — верные не стоят подряд.
 */
function knopkiVybora(sc: ScenariyHtml): KnopkaVybora[] {
  const out: KnopkaVybora[] = [];
  const n = Math.max(sc.sposoby.length, sc.vybor?.nevernye.length ?? 0);
  for (let i = 0; i < n; i += 1) {
    const sp = sc.sposoby[i];
    const nev = sc.vybor?.nevernye[i];
    if (i % 2 === 1 && nev !== undefined)
      out.push({ sposob: null, nevernaya: i, html: nev.knopkaHtml });
    if (sp !== undefined) out.push({ sposob: i, nevernaya: -1, html: sp.knopkaHtml });
    if (i % 2 === 0 && nev !== undefined)
      out.push({ sposob: null, nevernaya: i, html: nev.knopkaHtml });
  }
  return out;
}

/**
 * Подсказка №1 — сценарий вопросов (lib/planimetriya/scenariy.ts).
 * Несколько способов — сначала выбор, после способа — «Посмотреть
 * другой способ». В конце — плашка «Приём» с карточкой теории.
 */
export function Scenariy1({ sc, title = T.title }: { sc: ScenariyHtml; title?: ReactNode }) {
  const [sposob, setSposob] = useState<number | null>(sc.sposoby.length === 1 ? 0 : null);
  /* Пройденные шаги по способам: номер шага → ответ показан после двух ошибок. */
  const [proydeno, setProydeno] = useState<Record<number, boolean[]>>({});
  const [hod, setHod] = useState<Hod>(NOVYY);
  /* Первый вопрос — выбор хода: неудачные кнопки, которые уже нажаты. */
  const [vyborMimo, setVyborMimo] = useState<number[]>([]);

  const vybor = (i: number) => {
    setSposob(i);
    setHod(NOVYY);
  };

  const sp = sposob === null ? undefined : sc.sposoby[sposob];
  const sdelano = sposob === null ? [] : (proydeno[sposob] ?? []);
  const gotov = sp !== undefined && sdelano.length >= sp.shagi.length;
  const tekushchiy = sp?.shagi[sdelano.length];
  const drugie = sc.sposoby
    .map((_, i) => i)
    .filter((i) => i !== sposob && (proydeno[i]?.length ?? 0) < (sc.sposoby[i]?.shagi.length ?? 0));

  return (
    <div className="trn-voprosy sc1">
      <p className="trn-voprosy__title">
        <Ikonka name="lampa" /> {title}
      </p>
      {sc.vybor !== null && sposob === null ? (
        /* Первый вопрос — какое построение сделать. Кнопки: построения
           способов вперемешку с неудачными; неудачное объясняется. */
        <div className="trn-vopros sc1-shag sc1-vybor">
          {sc.vybor.risunok === null ? null : (
            <div className="trn-vopros__risunok">
              <Chertezh svg={sc.vybor.risunok} label={T.risunok(1)} />
            </div>
          )}
          <p
            className="trn-vopros__tekst sc1-vybor__vopros"
            dangerouslySetInnerHTML={{ __html: sc.vybor.voprosHtml }}
          />
          <div className="trn-vopros__knopki" role="group" aria-label={T.varianty}>
            {knopkiVybora(sc).map((k) =>
              k.sposob !== null ? (
                <button
                  type="button"
                  className="trn-vopros__knopka"
                  key={`s${k.sposob}`}
                  onClick={() => vybor(k.sposob as number)}
                  dangerouslySetInnerHTML={{ __html: k.html }}
                />
              ) : (
                <button
                  type="button"
                  className={clsx(
                    'trn-vopros__knopka',
                    vyborMimo.includes(k.nevernaya) && 'is-mimo',
                  )}
                  key={`n${k.nevernaya}`}
                  disabled={vyborMimo.includes(k.nevernaya)}
                  onClick={() => setVyborMimo([...vyborMimo, k.nevernaya])}
                  dangerouslySetInnerHTML={{ __html: k.html }}
                />
              ),
            )}
          </div>
          {vyborMimo.length === 0 ? null : (
            <p className="sc1-utochnenie" role="status">
              <b>{T.nePotoropis}</b>{' '}
              <span
                dangerouslySetInnerHTML={{
                  __html:
                    sc.vybor.nevernye[vyborMimo[vyborMimo.length - 1] ?? 0]?.pochemuHtml ?? '',
                }}
              />
            </p>
          )}
        </div>
      ) : sc.sposoby.length > 1 && sposob === null ? (
        <div className="sc1-vybor">
          <p className="trn-vopros__tekst sc1-vybor__vopros">{T.vybor}</p>
          <div className="trn-vopros__knopki">
            {sc.sposoby.map((x, i) => (
              <button type="button" className="trn-vopros__knopka" key={i} onClick={() => vybor(i)}>
                <b>{T.sposob(i + 1)}:</b>{' '}
                <span dangerouslySetInnerHTML={{ __html: x.nazvanieHtml }} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {sp === undefined ? null : (
        <>
          {sc.sposoby.length > 1 ? (
            <p className="sc1-sposob">
              <b>{T.sposob((sposob ?? 0) + 1)}.</b>{' '}
              <span dangerouslySetInnerHTML={{ __html: sp.nazvanieHtml }} />
            </p>
          ) : null}
          {sc.vybor !== null ? (
            <div className="sc1-da sc1-vybrano">
              <p dangerouslySetInnerHTML={{ __html: sc.vybor.voprosHtml }} />
              <p
                className="trn-vopros__knopka is-verno sc1-otvet"
                dangerouslySetInnerHTML={{ __html: sp.knopkaHtml }}
              />
              {sp.zachemHtml === '' ? null : (
                <p>
                  <b>{T.da}</b> <span dangerouslySetInnerHTML={{ __html: sp.zachemHtml }} />
                </p>
              )}
            </div>
          ) : null}
          <ol className="trn-voprosy__spisok">
            {sp.shagi.slice(0, sdelano.length).map((s, i) => (
              <Proyden s={s} n={i + 1} otkryt={sdelano[i] === true} key={`${sposob}-${i}`} />
            ))}
            {tekushchiy === undefined ? null : (
              <Tekushchiy
                key={`${sposob}-${sdelano.length}`}
                s={tekushchiy}
                n={sdelano.length + 1}
                hod={hod}
                setHod={setHod}
                onProyden={(otkryt) => {
                  setProydeno({ ...proydeno, [sposob ?? 0]: [...sdelano, otkryt] });
                  setHod(NOVYY);
                }}
              />
            )}
          </ol>
          {gotov && sp.vyvodHtml !== '' ? (
            <p className="sc1-vyvod" dangerouslySetInnerHTML={{ __html: sp.vyvodHtml }} />
          ) : null}
          {gotov ? <p className="trn-voprosy__gotovo">{T.gotovo}</p> : null}
          {gotov && drugie.length > 0 ? (
            <div className="sc1-drugoy">
              {drugie.map((i) => (
                <button
                  type="button"
                  className="stk-btn stk-btn--tihaya"
                  key={i}
                  onClick={() => vybor(i)}
                >
                  {T.drugoySposob}: {T.sposob(i + 1).toLowerCase()} —{' '}
                  <span dangerouslySetInnerHTML={{ __html: sc.sposoby[i]?.nazvanieHtml ?? '' }} />
                </button>
              ))}
            </div>
          ) : null}
          {gotov && sc.priem !== null ? (
            <aside className="sc1-priem">
              <p className="sc1-priem__label">{T.priem}</p>
              <p
                className="sc1-priem__nazvanie"
                dangerouslySetInnerHTML={{ __html: sc.priem.nazvanieHtml }}
              />
              <FaktKnopka1 fakt={sc.priem.fakt} />
            </aside>
          ) : null}
        </>
      )}
    </div>
  );
}
