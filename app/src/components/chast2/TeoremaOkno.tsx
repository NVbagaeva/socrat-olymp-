'use client';

import { useEffect, useState, type RefObject } from 'react';
import { Modal } from '@/components/ui';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import './chast2.css';

/**
 * Окно теоремы: ссылка в решении ({{t:id|…}} → кнопка .teor-ssylka)
 * открывает формулировку с чертежом и доказательством. Слушатель —
 * один на контейнер: решения собираются HTML-строкой.
 */
export function TeoremaOkno({ root }: { root: RefObject<HTMLElement | null> }) {
  const [id, setId] = useState<string | null>(null);
  const [html, setHtml] = useState<{ id: string; title: string; body: string } | null>(null);

  useEffect(() => {
    const el = root.current;
    if (el === null) return undefined;
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '.teor-ssylka[data-teorema]',
      );
      if (t === null || t === undefined || !el.contains(t)) return;
      e.preventDefault();
      setId(t.dataset['teorema'] ?? null);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [root]);

  useEffect(() => {
    if (id === null) return undefined;
    let live = true;
    void Promise.all([import('@/lib/povyshennye/chast2/html'), import('@/lib/teoremy')]).then(
      ([h, t]) => {
        if (live) setHtml({ id, title: t.teorema(id).nazvanie, body: h.teoremaHtml(id, 280) });
      },
    );
    return () => {
      live = false;
    };
  }, [id]);

  const shown = html !== null && html.id === id ? html : null;
  return (
    <Modal
      open={shown !== null}
      onClose={() => setId(null)}
      title={shown?.title ?? ''}
      closeLabel="Закрыть"
    >
      {shown === null ? null : (
        <div
          className="teor-okno"
          data-testid="teorema-okno"
          ref={(n) => {
            if (n !== null) upgrade(n, katex);
          }}
          dangerouslySetInnerHTML={{ __html: shown.body }}
        />
      )}
    </Modal>
  );
}
