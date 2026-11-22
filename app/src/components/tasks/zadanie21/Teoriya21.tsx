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
import {
  RAZDELY_TEORII_21,
  type BlokTeorii21,
  type Kartinka21,
  type RazdelTeorii21,
} from '@/content/teoriya21';
import { assetUrl } from '@/lib/assetUrl';
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

const PAPKA = '/images/zadanie-21';

/** Картинка на белой карточке: WebP нескольких ширин и запасной JPEG. */
function Kartinka({ k, sizes }: { k: Kartinka21; sizes: string }) {
  const src = (w: number, ext: string) => assetUrl(`${PAPKA}/${k.imya}-${w}.${ext}`);
  return (
    <picture className="z21-kart__ramka">
      <source
        type="image/webp"
        srcSet={k.shiriny.map((w) => `${src(w, 'webp')} ${w}w`).join(', ')}
        sizes={sizes}
      />
      <img
        src={src(k.shiriny[0] ?? k.w, 'jpg')}
        width={k.w}
        height={k.h}
        alt={k.alt}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

/** Цвета кукол по порядку слоёв: синий, голубой, оранжевый (у двух слоёв — без голубого). */
const cvetaSloev = (n: number): string[] =>
  n === 2 ? ['siniy', 'oranzh'] : ['siniy', 'goluboy', 'oranzh'];

/** Подписи цветов кукол: кружок цвета и текст. */
function Legenda({ punkty }: { punkty: readonly string[] }) {
  const cveta = cvetaSloev(punkty.length);
  return (
    <ul className="z21-legenda">
      {punkty.map((t, i) => (
        <li key={t}>
          <span
            className={`z21-legenda__krug z21-cvet--${cveta[i] ?? 'siniy'}`}
            aria-hidden="true"
          />
          <Tex text={t} />
        </li>
      ))}
    </ul>
  );
}

const ROLI: Record<number, string[]> = {
  2: ['внешняя', 'внутренняя'],
  3: ['внешняя', 'средняя', 'внутренняя'],
};

/** Слои матрёшки: вложенные рамки цветов кукол, в каждой — функция и её производная. */
function Sloi({ sloi }: { sloi: readonly { tex: string; proizv: string }[] }) {
  const roli = ROLI[sloi.length] ?? sloi.map(() => '');
  const cveta = cvetaSloev(sloi.length);
  const sloy = (i: number): ReactNode => {
    const s = sloi[i];
    if (s === undefined) return null;
    return (
      <div className={`z21-mat__sloy z21-cvet--${cveta[i] ?? 'siniy'}`}>
        <p className="z21-mat__shapka">
          <span className="z21-mat__rol">{roli[i]}</span>
          <Tex text={`$${s.tex}$`} />
          <Tex className="z21-mat__d" text={`$${s.proizv}$`} />
        </p>
        {sloy(i + 1)}
      </div>
    );
  };
  return <div className="z21-mat__sloi">{sloy(0)}</div>;
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
    case 'kartinka':
      return (
        <figure className="z21-kart">
          <Kartinka k={b.kartinka} sizes="(max-width: 767px) calc(100vw - 32px), 600px" />
          <figcaption className="z21-kart__podpis">
            <Legenda punkty={b.legenda} />
            <span className="z21-kart__tekst">
              <Tex text={b.podpis} />
            </span>
          </figcaption>
        </figure>
      );
    case 'matreshka':
      return (
        <section className={b.kartinka ? 'ramka z21-mat z21-mat--s-kartinkoy' : 'ramka z21-mat'}>
          <h4 className="z21-mat__title">
            <Tex text={b.title} />
          </h4>
          <div className="z21-mat__telo">
            {b.kartinka ? (
              <figure className="z21-mat__kart">
                <Kartinka k={b.kartinka} sizes="(max-width: 767px) 50vw, 200px" />
                {b.legenda ? (
                  <figcaption>
                    <Legenda punkty={b.legenda} />
                  </figcaption>
                ) : null}
              </figure>
            ) : null}
            <Sloi sloi={b.sloi} />
          </div>
          <p className="z21-mat__itog">
            <Tex text={`$${b.itog}$`} />
          </p>
          {b.poyasnenie ? (
            <p className="ramka__p z21-mat__poyasnenie">
              <Tex text={b.poyasnenie} />
            </p>
          ) : null}
        </section>
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

/** Вкладка «Теория»: разделы подряд, содержание рядом (оболочка теории №4/№7). */
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
