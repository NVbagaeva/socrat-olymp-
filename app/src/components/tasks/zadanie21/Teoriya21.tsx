import type { ReactNode } from 'react';
import {
  RamkaFormula,
  RamkaOpredelenie,
  RamkaPrimer,
  RamkaVazhno,
  RamkaVyvod,
} from '@/components/teoriya/Ramki';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { Tex } from '@/components/ui/Tex';
import { RAZDELY_TEORII_21, type BlokTeorii21, type RazdelTeorii21 } from '@/content/teoriya21';
import '../teoriya/teoriya-steklo.css';

function Abzacy({ paras }: { paras: readonly string[] }) {
  return (
    <>
      {paras.map((p) => (
        <p className="ramka__p" key={p}>
          <Tex text={p} />
        </p>
      ))}
    </>
  );
}

function Blok21({ b }: { b: BlokTeorii21 }): ReactNode {
  switch (b.vid) {
    case 'opredelenie':
      return (
        <RamkaOpredelenie
          title={b.title ?? 'Определение'}
          {...(b.formula ? { formula: b.formula } : {})}
        >
          <Abzacy paras={b.paras} />
        </RamkaOpredelenie>
      );
    case 'formula':
      return <RamkaFormula formula={b.formula} {...(b.podpis ? { podpis: b.podpis } : {})} />;
    case 'vazhno':
      return (
        <RamkaVazhno title={b.title ?? 'Важно!'}>
          <Abzacy paras={b.paras} />
        </RamkaVazhno>
      );
    case 'vyvod':
      return (
        <RamkaVyvod title={b.title ?? 'Вывод'}>
          <Abzacy paras={b.paras} />
        </RamkaVyvod>
      );
    case 'spisok':
      return (
        <RamkaOpredelenie title={b.title}>
          <ol className="z21-spisok">
            {b.punkty.map((s) => (
              <li key={s}>
                <Tex text={s} />
              </li>
            ))}
          </ol>
        </RamkaOpredelenie>
      );
    case 'primer':
      return <RamkaPrimer title={b.title} uslovie={b.uslovie} shagi={b.shagi} otvet={b.otvet} />;
    case 'lovushka':
      return (
        <RamkaVazhno title={b.title}>
          <p className="ramka__p">
            <Tex text={`**Ошибка.** ${b.oshibka}`} />
          </p>
          <p className="ramka__p">
            <Tex text={`**Правильно.** ${b.pravilno}`} />
          </p>
        </RamkaVazhno>
      );
    default:
      return null;
  }
}

function Telo({ r }: { r: RazdelTeorii21 }) {
  return (
    <div className="z21-teoriya teor-steklo">
      <p className="z21-teoriya__lead">
        <Tex text={r.lead} />
      </p>
      {r.bloki.map((b, i) => (
        <Blok21 b={b} key={`${r.id}-${i}`} />
      ))}
    </div>
  );
}

/** Вкладка «Теория»: шесть разделов подряд, содержание рядом (оболочка теории №4/№7). */
export function Teoriya21({ vkladka }: { vkladka: string }) {
  const tela = Object.fromEntries(RAZDELY_TEORII_21.map((r) => [r.id, <Telo r={r} key={r.id} />]));
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={RAZDELY_TEORII_21.map((r) => ({ id: r.id, title: r.title }))}
      tela={tela}
      dekor={{
        kartinka: (
          <span className="z21-dekor">
            <Tex text="$y'\colon\ +\ \to\ -$" />
          </span>
        ),
        note: 'Производная → нули → знаки → точка или значение',
      }}
      trackKey="21"
    />
  );
}
