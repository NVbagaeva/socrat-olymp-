import Link from 'next/link';
import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import { TIPY_3 } from '@/content/stereo/tipy';
import { GLAVY_3 } from '@/content/stereo/glavy';
import { STEREO } from '@/content/stereo/zadaniya';
import { ZADANIYA } from '@/lib/paths';
import { razbor3 } from '@/lib/stereo/razbory3';
import type { BlokGlavy, GlavaDannye, PrimerGlavy, ZadachaBloka } from '@/lib/stereo/glavy/tipy';
import { renderPloskiy } from '@/lib/stereo/ploskiy';
import { Chertezh3d } from '../Chertezh3d';
import {
  Abzacy,
  Formula,
  KartaAlgoritm,
  KartaReshenie,
  KartaZadacha,
  RamkaIdeya,
  RamkaLayfhak,
  RamkaLovushka,
  RamkaOtvet,
  RamkaVazhno,
  RazdelGlavy,
} from '../metodika/Bloki';
import { IkKub, IkStrelka, IkTreugolnik } from '../metodika/Ikonki';
import { RisSteklo } from './Glava2Treugolnik';

/** «C2» → «C_2». */
function tex(name: string): string {
  return name.replace(/^([A-Za-z])(\d+)$/, '$1_$2');
}

/** Имя плоского треугольника: из описания («треугольник SOA: …») или по вершинам. */
function imyaTreugolnika(t: NonNullable<PrimerGlavy['ploskiy']>): string {
  const m = /треугольник ([A-Z][A-Z₀-₉]*)/.exec(t.alt);
  if (m?.[1] !== undefined) {
    return m[1].replace(/([A-Z])([₀-₉]+)/g, (_, b: string, d: string) => `${b}_${[...d].map((c) => String(c.charCodeAt(0) - 0x2080)).join('')}`);
  }
  const v = t.vershiny;
  return `${tex(v[1])}${tex(v[0])}${tex(v[2])}`;
}

/** Задача внутри «Важно», «Лайфхака» и «Ловушки». */
function ZadachaVRamke({ z }: { z: ZadachaBloka }) {
  return (
    <div className="o3-zr">
      <p className="o3-p o3-zr__uslovie">
        <b>Задача.</b> <Tex text={z.uslovie} />
      </p>
      <Abzacy paras={z.reshenie} />
      {(z.formuly ?? []).map((f) => (
        <Formula tex={f} key={f} />
      ))}
      <p className="o3-p o3-zr__otvet">
        <Tex text={z.otvet} />
      </p>
    </div>
  );
}

/**
 * Разобранный пример. С плоской фигурой — две панели с мостиком, с
 * одним чертежом — одна панель, без чертежа — только задача, решение
 * и ответ.
 */
function Primer({ primer }: { primer: PrimerGlavy }) {
  const shagiChertezha = primer.shagiChertezha ?? [];
  const most =
    primer.most ?? (primer.ploskiy === undefined ? '' : `Выносим треугольник $${imyaTreugolnika(primer.ploskiy)}$ отдельно`);
  return (
    <div className="o3-primer">
      <h5 className="o3-primer__title">
        <Tex text={primer.title} zagolovok />
      </h5>
      {primer.model === undefined ? null : (
        <div className={primer.ploskiy === undefined ? 'o3-dve o3-dve--odna' : 'o3-dve'}>
          <section className="o3-panel" aria-label="Объёмный чертёж">
            <header className="o3-panel__head">
              <IkKub className="o3-panel__ik" />
              <div>
                <p className="o3-panel__t">{primer.ploskiy === undefined ? 'Чертёж' : '1. Объёмный чертёж'}</p>
                <p className="o3-panel__pod">
                  {shagiChertezha.length > 0
                    ? 'Чертёж можно повернуть и пройти по шагам решения.'
                    : 'Чертёж можно повернуть.'}
                </p>
              </div>
            </header>
            <Chertezh3d
              model={primer.model}
              uslovie={primer.uslovie}
              {...(shagiChertezha.length > 0 ? { shagi: shagiChertezha } : {})}
              tema="ekran"
              sKontsa
              className="o3-panel__ris"
            />
          </section>
          {primer.ploskiy === undefined ? null : (
            <>
              <div className="o3-most" aria-hidden="true">
                <IkStrelka className="o3-most__strelka" />
                <p className="o3-most__t">
                  <Tex text={most} />
                </p>
              </div>
              <section className="o3-panel" aria-label="Плоский треугольник">
                <header className="o3-panel__head">
                  <IkTreugolnik className="o3-panel__ik o3-panel__ik--vydel" />
                  <div>
                    <p className="o3-panel__t">2. Плоский треугольник</p>
                    <p className="o3-panel__pod">Тот же треугольник отдельно — в натуральную величину, с данными.</p>
                  </div>
                </header>
                <figure
                  className="o3-panel__ploskiy"
                  dangerouslySetInnerHTML={{ __html: renderPloskiy(primer.ploskiy, 'ekran') }}
                />
              </section>
            </>
          )}
        </div>
      )}
      <KartaZadacha uslovie={primer.uslovie} />
      <KartaReshenie
        shagi={primer.shagi.map((shag) => ({
          title: shag.title,
          telo: (
            <div className="o3-stepper__telo">
              {(shag.formuly ?? []).map((f) => (
                <Formula tex={f} key={f} />
              ))}
              <Abzacy paras={shag.paras} />
            </div>
          ),
        }))}
      />
      <RamkaOtvet otvet={primer.otvet} />
    </div>
  );
}

/** Типы задач №3 со ссылками на разборы и на главу. */
function Tipy() {
  const base = `${ZADANIYA}/${STEREO['3'].slug}`;
  return (
    <ul className="o3-tipy">
      {TIPY_3.map((tip, i) => {
        const glava = GLAVY_3.find((g) => g.id === tip.glava);
        const estRazbor = razbor3(tip.id) !== undefined;
        return (
          <li key={tip.id} className="o3-tip">
            <span className="o3-tip__no" aria-hidden="true">
              {i + 1}
            </span>
            <span className="o3-tip__telo">
              <span className="o3-tip__title">
                <Tex text={tip.title} />
              </span>
              <span className="o3-tip__ssylki">
                {estRazbor ? (
                  <Link href={`${base}/razbor/${tip.id}/`}>Разобранный пример</Link>
                ) : null}
                {glava === undefined ? null : (
                  <a href={`#teoriya-${glava.id}`}>
                    Глава {glava.nomer}
                  </a>
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Blok({ blok, shpargalki }: { blok: BlokGlavy; shpargalki?: ReactNode }) {
  switch (blok.vid) {
    case 'abzacy':
      return <Abzacy paras={blok.paras} />;
    case 'ideya':
      return (
        <RamkaIdeya {...(blok.title === undefined ? {} : { title: blok.title })}>
          <Abzacy paras={blok.paras} />
        </RamkaIdeya>
      );
    case 'algoritm':
      return (
        <KartaAlgoritm
          title={blok.title}
          shagi={blok.shagi.map((s) => ({ title: s.title, telo: <p className="o3-stepper__text"><Tex text={s.text} /></p> }))}
        />
      );
    case 'opredelenie':
      return (
        <section className="o3-ramka o3-ramka--opredelenie">
          <p className="o3-ramka__plashka">{blok.plashka}</p>
          <Abzacy paras={blok.paras} />
          {(blok.formuly ?? []).map((f) => (
            <Formula tex={f} key={f} />
          ))}
        </section>
      );
    case 'formuly':
      return (
        <section className="o3-karta o3-formuly">
          <h5 className="o3-karta__h">{blok.title}</h5>
          <dl className="o3-formuly__spisok">
            {blok.stroki.map((s) => (
              <div className="o3-formuly__stroka" key={s.tex}>
                <dt>
                  <Tex text={s.podpis} />
                </dt>
                <dd>
                  <Formula tex={s.tex} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case 'spisok':
      return (
        <ul className="o3-istochniki">
          {blok.items.map((item) => (
            <li key={item}>
              <Tex text={item} />
            </li>
          ))}
        </ul>
      );
    case 'formula':
      return <Formula tex={blok.tex} />;
    case 'primer':
      return <Primer primer={blok.primer} />;
    case 'vazhno':
      return (
        <RamkaVazhno title={blok.title}>
          {blok.paras === undefined ? null : <Abzacy paras={blok.paras} />}
          <ZadachaVRamke z={blok.zadacha} />
        </RamkaVazhno>
      );
    case 'layfhak':
      return (
        <RamkaLayfhak title={blok.title}>
          {blok.paras === undefined ? null : <Abzacy paras={blok.paras} />}
          <ZadachaVRamke z={blok.zadacha} />
        </RamkaLayfhak>
      );
    case 'lovushka':
      return (
        <RamkaLovushka
          title={blok.title}
          neverno={blok.neverno}
          verno={blok.verno}
          {...(blok.risunki === undefined
            ? {}
            : {
                risunokNeverno: <RisSteklo model={blok.risunki.neverno} />,
                risunokVerno: <RisSteklo model={blok.risunki.verno} />,
              })}
          zadacha={<ZadachaVRamke z={blok.zadacha} />}
        />
      );
    case 'risunki':
      return (
        <ul className="o3-galereya">
          {blok.items.map((item) => (
            <li key={item.podpis} className={item.ocenka === undefined ? 'o3-galereya__item' : `o3-galereya__item is-${item.ocenka}`}>
              {item.ocenka === undefined ? null : (
                <span className="o3-galereya__ocenka">{item.ocenka === 'udachno' ? 'Удачно' : 'Неудачно'}</span>
              )}
              <RisSteklo model={item.model} />
              <p className="o3-galereya__podpis">
                <Tex text={item.podpis} />
              </p>
            </li>
          ))}
        </ul>
      );
    case 'tipy':
      return <Tipy />;
    case 'shpargalki':
      return <>{shpargalki ?? null}</>;
  }
}

/**
 * Глава теории №3 из данных (lib/stereo/glavy): лид с декором, разделы
 * со счётчиком «k / n» и стрелками, в разделах — блоки методики.
 */
export function GlavaMetodiki({ glava, shpargalki }: { glava: GlavaDannye; shpargalki?: ReactNode }) {
  const n = glava.razdely.length;
  return (
    <div className="o3-glava">
      <div className="o3-glava__lead">
        <p className="o3-glava__lead-t">
          <Tex text={glava.lead} />
        </p>
        {glava.dekor === undefined ? null : (
          <div className="o3-glava__dekor" aria-hidden="true">
            <RisSteklo model={glava.dekor} />
          </div>
        )}
      </div>
      {glava.razdely.map((razdel, i) => {
        const prev = glava.razdely[i - 1];
        const next = glava.razdely[i + 1];
        return (
          <RazdelGlavy
            key={razdel.id}
            id={razdel.id}
            title={razdel.title}
            {...(razdel.lead === undefined ? {} : { lead: razdel.lead })}
            k={i + 1}
            n={n}
            {...(prev === undefined ? {} : { prev: { id: prev.id, title: prev.title } })}
            {...(next === undefined ? {} : { next: { id: next.id, title: next.title } })}
          >
            {razdel.bloki.map((blok, j) => (
              <Blok key={`${razdel.id}-${j}`} blok={blok} {...(shpargalki === undefined ? {} : { shpargalki })} />
            ))}
          </RazdelGlavy>
        );
      })}
    </div>
  );
}
