'use client';

import type { Bukva } from '@/lib/zadanie13/vyrazhenie';

/** Клавиша: что вставить и как подписать. */
export type Klavisha =
  | { t: 'vstavit'; v: string; label: string; aria?: string }
  | { t: 'steret' }
  | { t: 'vlevo' }
  | { t: 'vpravo' }
  | { t: 'gotovo' };

const PODPIS_BUKVY: Record<Bukva, string> = {
  S: 'S',
  x: 'x',
  y: 'y',
  k: 'k',
  r: 'r',
  n: 'n',
  'x₁': 'x₁',
  'x₂': 'x₂',
  'x₃': 'x₃',
  'x₄': 'x₄',
};

const ZNAKI: Klavisha[] = [
  { t: 'vstavit', v: '/', label: 'a/b', aria: 'дробь' },
  { t: 'vstavit', v: '·', label: '·', aria: 'умножить' },
  { t: 'vstavit', v: '+', label: '+', aria: 'плюс' },
  { t: 'vstavit', v: '−', label: '−', aria: 'минус' },
  { t: 'vstavit', v: '(', label: '(' },
  { t: 'vstavit', v: ')', label: ')' },
  { t: 'vstavit', v: '^', label: 'xⁿ', aria: 'степень' },
  { t: 'vstavit', v: ',', label: ',', aria: 'запятая' },
];

/**
 * Экранная клавиатура «Заполни таблицу»: буквы задачи (S, x, k, r, n,
 * x₁ …), цифры, дробь, ·, +, −, скобки, степень. На телефоне —
 * панель внизу экрана, системная клавиатура не открывается.
 */
export function Klaviatura13({
  bukvy,
  onKey,
  zagolovok,
}: {
  bukvy: readonly Bukva[];
  onKey: (k: Klavisha) => void;
  /** Куда вводим: «Месяц 2 · Переплата». */
  zagolovok: string;
}) {
  const knopka = (k: Klavisha, key: string, cls = '') => {
    const label =
      k.t === 'vstavit'
        ? k.label
        : k.t === 'steret'
          ? '⌫'
          : k.t === 'vlevo'
            ? '←'
            : k.t === 'vpravo'
              ? '→'
              : 'Готово';
    const aria =
      k.t === 'vstavit'
        ? (k.aria ?? k.label)
        : k.t === 'steret'
          ? 'стереть'
          : k.t === 'vlevo'
            ? 'курсор влево'
            : k.t === 'vpravo'
              ? 'курсор вправо'
              : 'готово';
    return (
      <button
        key={key}
        type="button"
        className={`z13-kl__k ${cls}`}
        aria-label={aria}
        /* Фокус остаётся в поле: курсор и выделение не сбрасываются. */
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => onKey(k)}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="z13-kl" role="group" aria-label="Клавиатура для ввода выражения">
      <p className="z13-kl__kuda">{zagolovok}</p>
      <div className="z13-kl__ryad z13-kl__ryad--bukvy">
        {bukvy.map((b) =>
          knopka({ t: 'vstavit', v: b, label: PODPIS_BUKVY[b] }, b, 'z13-kl__k--bukva'),
        )}
      </div>
      <div className="z13-kl__setka">
        {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'].map((d) =>
          knopka({ t: 'vstavit', v: d, label: d }, d, 'z13-kl__k--cifra'),
        )}
        {ZNAKI.map((z, i) => knopka(z, `z${i}`))}
        {knopka({ t: 'vlevo' }, 'l')}
        {knopka({ t: 'vpravo' }, 'r')}
        {knopka({ t: 'steret' }, 'del')}
        {knopka({ t: 'gotovo' }, 'ok', 'z13-kl__k--gotovo')}
      </div>
    </div>
  );
}
