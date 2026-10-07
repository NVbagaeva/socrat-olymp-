'use client';

/**
 * Витрина чертежа задания №15 — служебная страница для ручной
 * проверки движка: сечения из тестов ядра, режимы, виды, анимации,
 * натуральная величина, экспорт и счётчик кадров.
 *
 * Движок (three.js, KaTeX, ядро) подгружается через import() после
 * открытия страницы — в общий код сайта он не попадает.
 */

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import type { Dvizhok, Rezhim, StandartnyyVid } from './chertezh/dvizhok';

export interface PrimerVitriny {
  id: string;
  /** Подпись кнопки, уже набранная KaTeX на сборке. */
  titleHtml: string;
}

const VIDY: { id: StandartnyyVid; title: string }[] = [
  { id: 'speredi', title: 'Спереди' },
  { id: 'sverhu', title: 'Сверху' },
  { id: 'sboku', title: 'Сбоку' },
];

function skachat(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Vitrina15({ primery }: { primery: PrimerVitriny[] }) {
  const host = useRef<HTMLDivElement>(null);
  const dv = useRef<Dvizhok | null>(null);
  const [gotov, setGotov] = useState(false);
  const [oshibka, setOshibka] = useState(false);
  const [primerId, setPrimerId] = useState(primery[0]?.id ?? '');
  const [rezhim, setRezhim] = useState<Rezhim>('shkola');
  const [razrez, setRazrez] = useState(false);
  const [natural, setNatural] = useState('');
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    let otmena = false;
    import('./chertezh/dvizhok')
      .then((m) => {
        if (otmena || !host.current) return;
        const d = m.sozdat(host.current);
        d.onFps = setFps;
        d.zadatPrimer(primerId);
        dv.current = d;
        setGotov(true);
      })
      .catch(() => setOshibka(true));
    return () => {
      otmena = true;
      dv.current?.dispose();
      dv.current = null;
    };
    // Движок создаётся один раз; пример меняется методом движка.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vybratPrimer = (id: string) => {
    setPrimerId(id);
    setRazrez(false);
    dv.current?.zadatPrimer(id);
    setNatural((n) => (n === '' ? '' : (dv.current?.naturalnayaSvg() ?? '')));
  };

  return (
    <div className="z15-vit">
      <div className="z15-vit__bar" role="group" aria-label="Сечение">
        {primery.map((p) => (
          <button
            key={p.id}
            type="button"
            className={clsx(
              'btn btn--secondary btn--sm z15-vit__btn',
              primerId === p.id && 'is-on',
            )}
            aria-pressed={primerId === p.id}
            disabled={!gotov}
            onClick={() => vybratPrimer(p.id)}
            dangerouslySetInnerHTML={{ __html: p.titleHtml }}
          />
        ))}
      </div>

      <div className="z15-vit__bar">
        <div className="z15-vit__group" role="group" aria-label="Режим">
          {(
            [
              ['shkola', 'Школьный чертёж'],
              ['3d', '3D'],
            ] as const
          ).map(([id, title]) => (
            <button
              key={id}
              type="button"
              className={clsx(
                'btn btn--secondary btn--sm z15-vit__btn no-math-check',
                rezhim === id && 'is-on',
              )}
              aria-pressed={rezhim === id}
              disabled={!gotov}
              onClick={() => {
                setRezhim(id);
                dv.current?.ustanovitRezhim(id);
              }}
            >
              {title}
            </button>
          ))}
        </div>
        <div className="z15-vit__group" role="group" aria-label="Вид">
          <button
            type="button"
            className="btn btn--secondary btn--sm z15-vit__btn"
            disabled={!gotov}
            onClick={() => dv.current?.sbros()}
          >
            Сбросить вид
          </button>
          {VIDY.map((v) => (
            <button
              key={v.id}
              type="button"
              className="btn btn--secondary btn--sm z15-vit__btn"
              disabled={!gotov}
              onClick={() => dv.current?.vid(v.id)}
            >
              {v.title}
            </button>
          ))}
        </div>
      </div>

      <div className="z15-ch" ref={host}>
        {oshibka ? <p className="z15-ch__msg">Чертёж не загрузился. Обновите страницу.</p> : null}
        {!gotov && !oshibka ? <p className="z15-ch__msg">Загружаем чертёж…</p> : null}
      </div>

      <div className="z15-vit__bar">
        <div className="z15-vit__group" role="group" aria-label="Сечение">
          <button
            type="button"
            className="btn btn--secondary btn--sm z15-vit__btn"
            disabled={!gotov}
            onClick={() => dv.current?.pokazatSechenie()}
          >
            Показать сечение заново
          </button>
          <button
            type="button"
            className={clsx('btn btn--secondary btn--sm z15-vit__btn', razrez && 'is-on')}
            aria-pressed={razrez}
            disabled={!gotov}
            onClick={() => {
              setRazrez(!razrez);
              dv.current?.razrezat(!razrez);
            }}
          >
            {razrez ? 'Соединить' : 'Разрезать'}
          </button>
          <button
            type="button"
            className={clsx('btn btn--secondary btn--sm z15-vit__btn', natural !== '' && 'is-on')}
            aria-pressed={natural !== ''}
            disabled={!gotov}
            onClick={() => setNatural(natural === '' ? (dv.current?.naturalnayaSvg() ?? '') : '')}
          >
            Натуральная величина
          </button>
        </div>
        <div className="z15-vit__group" role="group" aria-label="Экспорт">
          <button
            type="button"
            className="btn btn--ghost btn--sm z15-vit__btn"
            disabled={!gotov}
            onClick={() => {
              const svg = dv.current?.eksportSvg();
              if (svg)
                skachat(new Blob([svg], { type: 'image/svg+xml' }), `sechenie-${primerId}.svg`);
            }}
          >
            Скачать SVG
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm z15-vit__btn"
            disabled={!gotov}
            onClick={() => {
              void dv.current?.eksportPng().then((b) => {
                if (b) skachat(b, `sechenie-${primerId}.png`);
              });
            }}
          >
            Скачать PNG
          </button>
        </div>
        <span className="z15-vit__fps" aria-live="off">
          {fps === null ? '' : `${fps} кадр/с`}
        </span>
      </div>

      {natural !== '' ? (
        <figure className="z15-vit__natural">
          <figcaption>Сечение в натуральную величину</figcaption>
          <div dangerouslySetInnerHTML={{ __html: natural }} />
        </figure>
      ) : null}
    </div>
  );
}
