'use client';

export interface Shag {
  id: string;
  /** Текст шага с обоснованием — готовая вёрстка (KaTeX). */
  html: string;
}

export interface Shagi15Props {
  steps: readonly Shag[];
  /** Индекс показанного шага; −1 — только фигура. */
  upTo: number;
  playing: boolean;
  onChange: (upTo: number) => void;
  onPlay: (playing: boolean) => void;
}

/**
 * Полоса пошагового показа построения, как в GeoGebra:
 * ⏮ ◀ шаг 3 из 7 ▶ ⏭ и «Воспроизвести». Текст текущего шага с
 * обоснованием — под чертежом. Те же шаги — в решениях для учителя
 * и в подсказках тренажёра.
 */
export function Shagi15({ steps, upTo, playing, onChange, onPlay }: Shagi15Props) {
  const n = steps.length;
  const cur = Math.min(upTo, n - 1);
  const text = cur >= 0 ? steps[cur]?.html : null;
  const atStart = cur < 0;
  const atEnd = cur >= n - 1;
  return (
    <div className="s15-steps">
      <div className="s15-steps__bar" role="group" aria-label="Шаги построения">
        <button
          type="button"
          className="s15-steps__btn"
          onClick={() => onChange(-1)}
          disabled={atStart}
          aria-label="К началу"
        >
          ⏮
        </button>
        <button
          type="button"
          className="s15-steps__btn"
          onClick={() => onChange(cur - 1)}
          disabled={atStart}
          aria-label="Шаг назад"
        >
          ◀
        </button>
        <span className="s15-steps__count" aria-live="polite">
          {cur < 0 ? 'фигура' : `шаг ${cur + 1} из ${n}`}
        </span>
        <button
          type="button"
          className="s15-steps__btn"
          onClick={() => onChange(cur + 1)}
          disabled={atEnd}
          aria-label="Шаг вперёд"
        >
          ▶
        </button>
        <button
          type="button"
          className="s15-steps__btn"
          onClick={() => onChange(n - 1)}
          disabled={atEnd}
          aria-label="К концу"
        >
          ⏭
        </button>
        <button
          type="button"
          className={['btn', 'btn--secondary', 's15-steps__play'].join(' ')}
          onClick={() => onPlay(!playing)}
          aria-pressed={playing}
        >
          {playing ? '⏸ Пауза' : '▶ Воспроизвести'}
        </button>
      </div>
      <div className="s15-steps__text" aria-live="polite">
        {text === null || text === undefined ? (
          <span className="s15-steps__hint">Нажмите ▶, чтобы увидеть построение по шагам.</span>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: text }} />
        )}
      </div>
    </div>
  );
}
