'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FAKT1 } from '@/content/fakty1';
import type { KartochkaFakta1 } from '@/lib/planimetriya/fakt-kartochka';
import { Ikonka } from '../../steklo';
import './fakt1.css';

/** Факт шага: что открыть и как он ложится на эту задачу. */
export interface FaktShaga1 {
  /** Идентификатор в реестре (content/spravochnik1/fakty.ts). */
  id: string;
  /** Название на кнопке, набранное KaTeX. */
  nazvanieHtml: string;
  /** «В нашей задаче»: факт на буквах этой задачи; пусто — блока нет. */
  vNasheyHtml: string;
}

/** Название без разметки — для читалок. */
function tekst(html: string): string {
  return html.replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '');
}

type Sostoyanie = KartochkaFakta1 | 'zagruzka' | 'oshibka';

/**
 * Кнопка «Показать свойство»: значок книги и название конкретного
 * факта. Открывает карточку факта — на компьютере окном, на телефоне
 * шторкой снизу; страница под ней не меняется, тренировка не
 * сбрасывается. Открытие карточки ошибкой не считается: кнопка ничего
 * не пишет в журнал тренировки.
 *
 * Карточка — та же, что в справочнике (lib/planimetriya/fakt-kartochka):
 * модуль со справочником и движком подгружается по первому нажатию.
 */
export function FaktKnopka1({
  fakt,
  podsvetit = false,
}: {
  fakt: FaktShaga1;
  /** После неверного ответа кнопка подсвечивается. */
  podsvetit?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [k, setK] = useState<Sostoyanie>('zagruzka');

  useEffect(() => {
    if (!open || typeof k !== 'string' || k === 'oshibka') return;
    let zhiv = true;
    import('@/lib/planimetriya/fakt-kartochka')
      .then((m) => {
        if (zhiv) setK(m.kartochkaFakta1(fakt.id) ?? 'oshibka');
      })
      .catch(() => {
        if (zhiv) setK('oshibka');
      });
    return () => {
      zhiv = false;
    };
  }, [open, k, fakt.id]);

  return (
    <>
      <button
        type="button"
        className={clsx('fakt1-knopka', podsvetit && 'is-podsvechena')}
        onClick={() => setOpen(true)}
        aria-label={FAKT1.knopkaAria(tekst(fakt.nazvanieHtml))}
        aria-haspopup="dialog"
        data-fakt={fakt.id}
      >
        <Ikonka name="kniga" />
        <span dangerouslySetInnerHTML={{ __html: fakt.nazvanieHtml }} />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="fakt1-okno"
        closeLabel={FAKT1.zakryt}
        title={<span dangerouslySetInnerHTML={{ __html: fakt.nazvanieHtml }} />}
      >
        {k === 'zagruzka' ? (
          <p className="fakt1__sluzhebnoe" role="status">
            {FAKT1.zagruzka}
          </p>
        ) : k === 'oshibka' ? (
          <p className="fakt1__sluzhebnoe" role="alert">
            {FAKT1.oshibka}{' '}
            <button type="button" className="fakt1__povtor" onClick={() => setK('zagruzka')}>
              ↻
            </button>
          </p>
        ) : (
          <Kartochka k={k} vNasheyHtml={fakt.vNasheyHtml} />
        )}
      </Modal>
    </>
  );
}

/** Карточка факта: блок справочника, чертёж, пример, «В нашей задаче». */
function Kartochka({ k, vNasheyHtml }: { k: KartochkaFakta1; vNasheyHtml: string }) {
  return (
    <div className="fakt1">
      <div className="fakt1__glavnoe">
        <section className={`spr1-blok spr1-blok--${k.klass} fakt1__blok`}>
          <span className="spr1-blok__label">{k.vid}</span>
          <p className="fakt1__tekst" dangerouslySetInnerHTML={{ __html: k.tekstHtml }} />
          {k.formulaHtml === '' ? null : (
            <span
              className="spr1-blok__formula rich-formula"
              dangerouslySetInnerHTML={{ __html: k.formulaHtml }}
            />
          )}
          {k.dop === null ? null : (
            <span className="spr1-blok__dop">
              <span
                className="spr1-blok__dop-podpis"
                dangerouslySetInnerHTML={{ __html: `${k.dop.podpisHtml}:` }}
              />
              <span
                className="spr1-blok__formula rich-formula"
                dangerouslySetInnerHTML={{ __html: k.dop.formulaHtml }}
              />
            </span>
          )}
        </section>
        <figure
          className={clsx(
            'spr1-chertezh fakt1__ris',
            k.risunki.length > 1 && 'spr1-chertezh--neskolko',
          )}
        >
          {k.risunki.map((svg, i) => (
            <span
              className="pl-wrap spr1-chertezh__ris"
              key={i}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ))}
        </figure>
      </div>

      {k.primer === null ? null : (
        <details className="spr1-primer fakt1__primer">
          <summary className="spr1-primer__knopka">
            <span className="spr1-primer__otkryt">{FAKT1.primer} ▸</span>
            <span className="spr1-primer__zakryt">{FAKT1.svernut} ▴</span>
          </summary>
          <div className="spr1-primer__telo">
            <article className="spr1-razbor">
              <header className="spr1-razbor__head">
                <h5
                  className="spr1-razbor__title"
                  dangerouslySetInnerHTML={{ __html: k.primer.titleHtml }}
                />
              </header>
              <div className="spr1-razbor__body">
                <div className="spr1-razbor__uslovie">
                  <p
                    className="spr1-razbor__tekst"
                    dangerouslySetInnerHTML={{ __html: k.primer.uslovieHtml }}
                  />
                  <figure className="spr1-chertezh spr1-razbor__ris">
                    <span
                      className="pl-wrap spr1-chertezh__ris"
                      dangerouslySetInnerHTML={{ __html: k.primer.risunokSvg }}
                    />
                  </figure>
                </div>
                <ol className="spr1-razbor__shagi">
                  {k.primer.shagi.map((s, i) => (
                    <li className="spr1-razbor__shag" key={i}>
                      <span
                        className="spr1-razbor__etap"
                        dangerouslySetInnerHTML={{ __html: s.etapHtml }}
                      />
                      {s.tekstHtml === '' ? null : (
                        <span
                          className="spr1-razbor__poyasnenie"
                          dangerouslySetInnerHTML={{ __html: s.tekstHtml }}
                        />
                      )}
                      {s.tex.map((f, j) => (
                        <span
                          className="spr1-razbor__vykladka rich-formula"
                          key={j}
                          dangerouslySetInnerHTML={{ __html: f }}
                        />
                      ))}
                    </li>
                  ))}
                </ol>
                <p className="spr1-razbor__otvet">
                  <span className="spr1-razbor__otvet-label">{FAKT1.otvet}:</span>{' '}
                  <span
                    className="rich-formula"
                    dangerouslySetInnerHTML={{ __html: k.primer.otvetHtml }}
                  />
                </p>
              </div>
            </article>
          </div>
        </details>
      )}

      {vNasheyHtml === '' ? null : (
        <section className="fakt1__nasha" aria-label={FAKT1.vNashey}>
          <span className="fakt1__nasha-label">{FAKT1.vNashey}</span>
          <p className="fakt1__nasha-tekst" dangerouslySetInnerHTML={{ __html: vNasheyHtml }} />
        </section>
      )}

      {/* Новая вкладка: тренировка остаётся открытой на своём месте. */}
      <a className="fakt1__vse" href={k.temaHref} target="_blank" rel="noopener">
        {FAKT1.vse}: <span dangerouslySetInnerHTML={{ __html: k.temaHtml }} /> → {FAKT1.spravochnik}
      </a>
    </div>
  );
}
