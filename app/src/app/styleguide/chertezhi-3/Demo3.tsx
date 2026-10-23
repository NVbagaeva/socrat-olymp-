'use client';

import { useState } from 'react';
import { Chertezh3 } from '@/components/chertezh3/Chertezh3';
import type { Scenariy } from '@/lib/chertezh3/scenariy';

export interface DemoZadacha {
  id: string;
  uslovieHtml: string;
  shagi: string[];
  refs: string[][];
  scenariy: Scenariy;
  podpisiHtml: Record<string, string>;
}

/** Интерактивные чертежи предпросмотра: вращение и подсветка шагов. */
export function Demo3({ zadachi }: { zadachi: DemoZadacha[] }) {
  return (
    <div className="ch3p__demo">
      {zadachi.map((z) => (
        <DemoOdna key={z.id} z={z} />
      ))}
    </div>
  );
}

function DemoOdna({ z }: { z: DemoZadacha }) {
  const [shag, setShag] = useState<number | null>(null);
  return (
    <article className="ch3p__demo-item" data-demo={z.id}>
      <p dangerouslySetInnerHTML={{ __html: `<b>${z.id}.</b> ${z.uslovieHtml}` }} />
      <Chertezh3
        scenariy={z.scenariy}
        podpisiHtml={z.podpisiHtml}
        podsvetka={shag === null ? null : (z.refs[shag] ?? null)}
      />
      <ol className="ch3p__steps">
        {z.shagi.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              aria-pressed={shag === i}
              className={shag === i ? 'is-active' : ''}
              onClick={() => setShag(shag === i ? null : i)}
              dangerouslySetInnerHTML={{ __html: s }}
            />
          </li>
        ))}
      </ol>
    </article>
  );
}
