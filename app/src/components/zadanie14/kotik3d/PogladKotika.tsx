'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { BarExtraApi } from '@/components/tasks/session';
import { Kotik3d } from './Kotik3d';
import { myrr, type Myrr } from './myrr';
import { KOTIK_PROVERKA, type ProverkaDetail } from './signal';

/** Сколько раз погладить, чтобы котик был доволен. */
const NADO = 3;
/** Подсказка — после стольких ошибок подряд… */
const OSHIBOK = 3;
/** …или стольких минут работы без перерыва. */
const MINUT = 10;
const ZAKRYTO = 'kotik:podskazka-zakryta';

/**
 * «Погладь котика 🐾» — кнопка на панели тренировки рядом с «Паузой».
 *
 * После 3 ошибок подряд или 10 минут без перерыва рядом мягко
 * появляется подсказка «Устал? Погладь котика» — закрывается крестиком
 * и в этой сессии браузера больше не появляется. Кнопка открывает
 * стеклянное окно поверх тренажёра; пока оно открыто, таймер на паузе.
 * После трёх поглаживаний — «Котик доволен!» и «Продолжить»:
 * тренировка идёт с того же места.
 */
export function PogladKotika({ api, zapasnaya }: { api: BarExtraApi; zapasnaya: ReactNode }) {
  const [otkryto, setOtkryto] = useState(false);
  const [podskazka, setPodskazka] = useState(false);
  const [raz, setRaz] = useState(0);
  const [zvuk, setZvuk] = useState(false);
  const zvukRef = useRef<Myrr | null>(null);
  const podryad = useRef(0);
  const otdyh = useRef(0);

  /* Подсказка: ошибки подряд — по сигналам экрана, время — по таймеру. */
  useEffect(() => {
    let zakryta = false;
    try {
      zakryta = window.sessionStorage.getItem(ZAKRYTO) === '1';
    } catch {
      /* без хранилища — подсказка просто может повториться */
    }
    if (zakryta) return;
    const proverka = (e: Event) => {
      const d = (e as CustomEvent<ProverkaDetail>).detail;
      podryad.current = d.verno ? 0 : podryad.current + 1;
      if (podryad.current >= OSHIBOK) setPodskazka(true);
    };
    window.addEventListener(KOTIK_PROVERKA, proverka);
    const t = window.setInterval(() => {
      if (api.elapsed() - otdyh.current >= MINUT * 60 * 1000) setPodskazka(true);
    }, 5000);
    return () => {
      window.removeEventListener(KOTIK_PROVERKA, proverka);
      window.clearInterval(t);
    };
  }, [api]);

  useEffect(() => () => zvukRef.current?.stop(), []);

  function otkryt() {
    setOtkryto(true);
    setRaz(0);
    setPodskazka(false);
    if (!api.paused) api.pause();
  }

  function zakryt() {
    setOtkryto(false);
    zvukRef.current?.stop();
    zvukRef.current = null;
    setZvuk(false);
    podryad.current = 0;
    otdyh.current = api.elapsed();
    api.resume();
  }

  function pereklZvuk() {
    if (zvuk) {
      zvukRef.current?.stop();
      zvukRef.current = null;
      setZvuk(false);
    } else {
      zvukRef.current = myrr();
      setZvuk(zvukRef.current !== null);
    }
  }

  function zakrytPodskazku() {
    setPodskazka(false);
    try {
      window.sessionStorage.setItem(ZAKRYTO, '1');
    } catch {
      /* не страшно */
    }
  }

  const dovolen = raz >= NADO;
  return (
    <span className="kotik-knopka">
      <button
        type="button"
        className="btn btn--secondary btn--sm kotik-knopka__btn"
        onClick={otkryt}
      >
        Погладь котика <span aria-hidden="true">🐾</span>
      </button>
      {podskazka && !otkryto ? (
        <span className="kotik-knopka__podskazka" role="status">
          Устал? Погладь котика
          <button
            type="button"
            className="kotik-knopka__krestik"
            aria-label="Закрыть подсказку"
            onClick={zakrytPodskazku}
          >
            ×
          </button>
        </span>
      ) : null}
      {otkryto
        ? createPortal(
            <div className="kotik-okno" role="dialog" aria-modal="true" aria-label="Погладь котика">
              <div className="kotik-okno__panel">
                <div className="kotik-okno__shapka">
                  <p className="kotik-okno__title">
                    {dovolen
                      ? 'Котик доволен! Возвращаемся к окружности?'
                      : 'Проведи пальцем или мышью по голове или спинке'}
                  </p>
                  <button
                    type="button"
                    className="kotik-okno__zvuk"
                    aria-pressed={zvuk}
                    aria-label={zvuk ? 'Выключить мурчание' : 'Включить мурчание'}
                    onClick={pereklZvuk}
                  >
                    {zvuk ? '🔊' : '🔈'}
                  </button>
                </div>
                <Kotik3d rezhim="okno" zapasnaya={zapasnaya} onPoglazhivanie={setRaz} />
                <div className="kotik-okno__niz">
                  <span className="kotik-okno__schet" aria-live="polite">
                    {Array.from({ length: NADO }, (_, i) => (
                      <span key={i} className={i < raz ? 'is-da' : ''} aria-hidden="true">
                        ♥
                      </span>
                    ))}
                    <span className="sr-only">
                      Погладили {Math.min(raz, NADO)} из {NADO}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={dovolen ? 'btn btn--primary' : 'btn btn--ghost'}
                    onClick={zakryt}
                  >
                    {dovolen ? 'Продолжить' : 'Вернуться к окружности'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
