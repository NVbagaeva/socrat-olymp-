'use client';

import { clsx } from 'clsx';
import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { TARIFY } from '@/content/tarify';
import { storage } from '@/lib/storage';
import { plashki, segodnya, tsenaDoEge, type Rol, type Srok } from '@/lib/tarify/config';
import { Plashka } from './Plashka';

const KLYUCH_ROLI = 'tarify:rol';

/**
 * Плашки в порядке разметки: платная первой. На телефоне она первой и
 * видна, на широком экране CSS ставит её справа (tarify.css).
 */
function poryadok(rol: Rol) {
  const [besplatno, probnyy, platnyy] = plashki(rol);
  return [platnyy, besplatno, probnyy];
}

/** Сохранённая роль: читается из браузера, меняется в другой вкладке. */
function chitatRol(): Rol | null {
  const value = storage.get<string>(KLYUCH_ROLI, '');
  return value === 'uchenik' || value === 'repetitor' ? value : null;
}
function podpiskaRoli(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}
const bezPodpiski = () => () => {};

/** Переключатель из двух вариантов на родных радиокнопках. */
function Pereklyuchatel<T extends string>({
  name,
  legenda,
  value,
  options,
  onChange,
  krupnyy = false,
}: {
  name: string;
  legenda: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  krupnyy?: boolean;
}) {
  return (
    <fieldset className={clsx('tf-pereklyuchatel', krupnyy && 'tf-pereklyuchatel--krupnyy')}>
      <legend className="sr-only">{legenda}</legend>
      {options.map((option) => (
        <label key={option.value} className="tf-pereklyuchatel__variant">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

/**
 * Выбор роли и срока и три плашки. Роль запоминается в браузере.
 * Цена «До ЕГЭ» зависит от даты покупки, поэтому дата берётся в
 * браузере после загрузки: в статической сборке она застыла бы на дне
 * сборки.
 */
export function TarifyVybor() {
  const sohranyonnaya = useSyncExternalStore(podpiskaRoli, chitatRol, () => null);
  const [vybrannaya, setVybrannaya] = useState<Rol | null>(null);
  const rol: Rol = vybrannaya ?? sohranyonnaya ?? 'uchenik';
  const [srok, setSrok] = useState<Srok>('d30');
  /* Дата — только в браузере; при сборке её нет, и цена «До ЕГЭ»
     считается на сегодня уже после загрузки. */
  const data = useSyncExternalStore(bezPodpiski, segodnya, () => undefined);
  const [aktivnaya, setAktivnaya] = useState(0);
  const ryad = useRef<HTMLDivElement>(null);

  const vybratRol = (next: Rol) => {
    setVybrannaya(next);
    storage.set(KLYUCH_ROLI, next);
  };

  /* Срок «До ЕГЭ» за месяц до экзамена не продаётся — переключатель
     срока тогда не нужен. */
  const egeProdaetsya = tsenaDoEge(rol, data) !== null;
  const tekushchiySrok: Srok = egeProdaetsya ? srok : 'd30';

  /* Точки под плашками на телефоне: какая плашка сейчас в кадре. */
  const onScroll = useCallback(() => {
    const node = ryad.current;
    if (!node) return;
    const cards = Array.from(node.children) as HTMLElement[];
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, index) => {
      const dist = Math.abs(card.offsetLeft - node.offsetLeft - node.scrollLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    setAktivnaya(best);
  }, []);

  const kPlashke = (index: number) => {
    const node = ryad.current;
    const card = node?.children[index] as HTMLElement | undefined;
    if (!node || !card) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollTo({
      left: card.offsetLeft - node.offsetLeft,
      behavior: reduce ? 'auto' : 'smooth',
    });
  };

  const spisok = poryadok(rol);
  const { vybor } = TARIFY;

  return (
    <section className="tf-vybor" aria-labelledby="tf-vybor-z">
      <h2 id="tf-vybor-z" className="sr-only">
        {vybor.zagolovok}
      </h2>
      <div className="tf-vybor__pereklyuchateli">
        <Pereklyuchatel<Rol>
          name="tf-rol"
          legenda={vybor.rol.legenda}
          value={rol}
          onChange={vybratRol}
          krupnyy
          options={[
            { value: 'uchenik', label: vybor.rol.uchenik },
            { value: 'repetitor', label: vybor.rol.repetitor },
          ]}
        />
        {egeProdaetsya ? (
          <Pereklyuchatel<Srok>
            name="tf-srok"
            legenda={vybor.srok.legenda}
            value={tekushchiySrok}
            onChange={setSrok}
            options={[
              { value: 'd30', label: vybor.srok.d30 },
              { value: 'ege', label: vybor.srok.ege },
            ]}
          />
        ) : null}
        <p className="tf-vybor__poyasnenie" aria-live="polite">
          {tekushchiySrok === 'ege' ? vybor.egePoyasnenie : ' '}
        </p>
      </div>

      <div className="tf-ryad" ref={ryad} onScroll={onScroll}>
        {spisok.map((plashka) => (
          <Plashka
            key={plashka.id}
            plashka={plashka}
            rol={rol}
            srok={tekushchiySrok}
            {...(data === undefined ? {} : { data })}
          />
        ))}
      </div>

      <div className="tf-tochki" role="group" aria-label={vybor.tochki}>
        {spisok.map((plashka, index) => (
          <button
            key={plashka.id}
            type="button"
            className="tf-tochka"
            aria-label={vybor.tochka(index + 1, plashka.nazvanie)}
            aria-current={aktivnaya === index ? 'true' : undefined}
            onClick={() => kPlashke(index)}
          >
            <span />
          </button>
        ))}
      </div>
    </section>
  );
}
