'use client';

import { useState, type ReactNode } from 'react';
import { Select } from '@/components/ui';
import { TRENAZHER_19 } from '@/content/zadanie19';
import { Rabota19, type Zadanie19View } from './Rabota19';

/** Фильтры банка №19: метод и уровень. Работа пересобирается под выбор. */
export function Bank19({
  metody,
  urovni,
  zadaniya,
  primer,
}: {
  metody: { metod: number; title: string }[];
  urovni: { id: string; title: string }[];
  zadaniya: (Zadanie19View & { metod: number })[];
  primer: ReactNode;
}) {
  const [metod, setMetod] = useState<number | 0>(0);
  const [uroven, setUroven] = useState('');
  const spisok = zadaniya.filter(
    (z) => (metod === 0 || z.metod === metod) && (uroven === '' || z.uroven === uroven),
  );
  return (
    <div className="z19-bank">
      <div className="z19-bank__filtry">
        <label className="z19-bank__pole">
          <span className="z16-zad__label">{TRENAZHER_19.metod}</span>
          <Select value={metod} onChange={(e) => setMetod(Number(e.target.value))}>
            <option value={0}>{TRENAZHER_19.vse}</option>
            {metody.map((m) => (
              <option value={m.metod} key={m.metod}>
                {m.title}
              </option>
            ))}
          </Select>
        </label>
        <label className="z19-bank__pole">
          <span className="z16-zad__label">{TRENAZHER_19.uroven}</span>
          <Select value={uroven} onChange={(e) => setUroven(e.target.value)}>
            <option value="">{TRENAZHER_19.vseUrovni}</option>
            {urovni.map((u) => (
              <option value={u.id} key={u.id}>
                {u.title}
              </option>
            ))}
          </Select>
        </label>
      </div>
      {spisok.length === 0 ? (
        <p className="z16-glava__lead">{TRENAZHER_19.pusto}</p>
      ) : (
        <Rabota19 key={`${metod}-${uroven}`} zadaniya={spisok} primer={primer} />
      )}
    </div>
  );
}
