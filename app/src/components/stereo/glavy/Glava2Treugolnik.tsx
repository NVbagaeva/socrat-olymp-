import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import { renderSolid } from '@/lib/solid/render';
import { polygonStart, pyramid, regularPolygon } from '@/lib/solid/figures';
import type { Model } from '@/lib/solid/model';
import type { Vec3 } from '@/lib/solid/vec';
import {
  ALGORITM,
  LAYFHAK_45,
  LAYFHAK_KVADRAT,
  LAYFHAK_TROYKI,
  LOVUSHKA_GLAZ,
  LOVUSHKA_ODNA,
  primerDiagonal,
  primerPiramida,
  primerStupenka,
  primerTangens,
  primerUgol45,
  risunkiLovushkiGlaz,
  risunkiLovushkiOdna,
  VAZHNO_LYUBAYA,
  VAZHNO_SDVIGI,
  type PrimerG2,
  type ZadachaRamki,
} from '@/lib/stereo/glava2';
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

/**
 * Разделы главы — подпункты «Содержания» (TeoriyaStereo) и счётчик
 * «k / n» со стрелками в шапке каждого раздела.
 */
export const RAZDELY_GLAVY_2: readonly { id: string; title: string }[] = [
  { id: 'g2-algoritm', title: 'Главный алгоритм' },
  { id: 'g2-perpendikulyar', title: 'Прямая, перпендикулярная плоскости' },
  { id: 'g2-pryamoy-ugol', title: 'Как обосновать прямой угол' },
  { id: 'g2-rasstoyanie', title: 'Расстояние между вершинами' },
  { id: 'g2-ugol', title: 'Угол и тангенс' },
];

/** «C2» → «C_2»: имя вершины для KaTeX. */
function tex(name: string): string {
  return name.replace(/^([A-Za-z])(\d+)$/, '$1_$2');
}

const PODSTROCHNYE: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4' };

/**
 * Имя рабочего треугольника — как в тексте главы: из описания чертежа
 * («Прямоугольный треугольник SOA: …»). Нет в описании — по вершинам,
 * прямой угол в середине имени.
 */
function imyaTreugolnika(t: PrimerG2['ploskiy']): string {
  const m = /треугольник ([A-Z][A-Z₀-₄]*)/.exec(t.alt);
  if (m?.[1] !== undefined) {
    return m[1].replace(
      /([A-Z])([₀-₄]+)/g,
      (_, b: string, d: string) => `${b}_${[...d].map((c) => PODSTROCHNYE[c] ?? c).join('')}`,
    );
  }
  const v = t.vershiny;
  return `${tex(v[1])}${tex(v[0])}${tex(v[2])}`;
}

/**
 * Двухпанельный пример: «1. Объёмный чертёж» (живой, «стекло», шаги
 * по кнопкам) → мостик-стрелка → «2. Плоский треугольник» того же
 * оранжевого цвета. Ниже — «Задача», «Решение» по шагам алгоритма
 * ①–⑤ и «Ответ».
 */
export function DvePaneli({ primer }: { primer: PrimerG2 }) {
  return (
    <div className="o3-primer">
      <h5 className="o3-primer__title">
        <Tex text={primer.title} zagolovok />
      </h5>
      <div className="o3-dve">
        <section className="o3-panel" aria-label="Объёмный чертёж">
          <header className="o3-panel__head">
            <IkKub className="o3-panel__ik" />
            <div>
              <p className="o3-panel__t">1. Объёмный чертёж</p>
              <p className="o3-panel__pod">
                Цветом выделен рабочий треугольник. Чертёж можно повернуть и пройти по шагам.
              </p>
            </div>
          </header>
          <Chertezh3d
            model={primer.model}
            uslovie={primer.uslovie}
            shagi={primer.shagiChertezha}
            tema="ekran"
            sKontsa
            className="o3-panel__ris"
          />
        </section>
        <div className="o3-most" aria-hidden="true">
          <IkStrelka className="o3-most__strelka" />
          <p className="o3-most__t">
            <Tex text={`Выносим треугольник $${imyaTreugolnika(primer.ploskiy)}$ отдельно`} />
          </p>
        </div>
        <section className="o3-panel" aria-label="Плоский треугольник">
          <header className="o3-panel__head">
            <IkTreugolnik className="o3-panel__ik o3-panel__ik--vydel" />
            <div>
              <p className="o3-panel__t">2. Плоский треугольник</p>
              <p className="o3-panel__pod">
                Тот же треугольник отдельно — в натуральную величину, с данными.
              </p>
            </div>
          </header>
          <figure
            className="o3-panel__ploskiy"
            dangerouslySetInnerHTML={{ __html: renderPloskiy(primer.ploskiy, 'ekran') }}
          />
        </section>
      </div>
      <KartaZadacha uslovie={primer.uslovie} />
      <KartaReshenie
        nomera={primer.shagi.map((s) => s.n)}
        shagi={primer.shagi.map((shag) => ({
          title: ALGORITM[shag.n - 1]?.title ?? '',
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

/** Задача внутри «Важно» и «Лайфхака»: условие, решение, ответ. */
function ZadachaVRamke({ z }: { z: ZadachaRamki }) {
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
 * Чертёж «стекло» ловушек и галерей: вращается руками, как все чертежи
 * раздела (Chertezh3d без шагов).
 */
export function RisSteklo({ model, className }: { model: Model; className?: string }) {
  return (
    <div className={className === undefined ? 'o3-ris' : `o3-ris ${className}`}>
      <Chertezh3d model={model} tema="ekran" />
    </div>
  );
}

/** Декор шапки главы: картинка без подписей, не чертёж задачи — не вращается. */
export function RisDekor({ model }: { model: Model }) {
  return (
    <div
      className="o3-ris"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: renderSolid(model, { tema: 'ekran' }) }}
    />
  );
}

/** Декор шапки главы: «стеклянная» пирамида с выделенным треугольником, без подписей. */
function dekorPiramida(): Model {
  const body = pyramid(regularPolygon(4, 10, 0, polygonStart(4)), [0, 0, 17], ['', '', '', ''], '');
  const A = body.vertices[0] as Vec3;
  const C = body.vertices[2] as Vec3;
  const S = body.vertices[4] as Vec3;
  const O: Vec3 = [0, 0, 0];
  return {
    alt: 'Правильная пирамида',
    bodies: [body],
    sections: [{ points: [S, O, A] }],
    lines: [
      { a: S, b: O },
      { a: A, b: C },
    ],
  };
}

/** Раздел главы по номеру: соседи для стрелок. */
function razdel(k: number) {
  const r = RAZDELY_GLAVY_2[k - 1];
  const prev = RAZDELY_GLAVY_2[k - 2];
  const next = RAZDELY_GLAVY_2[k];
  if (r === undefined) throw new Error(`Нет раздела ${k}`);
  return {
    id: r.id,
    title: r.title,
    k,
    n: RAZDELY_GLAVY_2.length,
    ...(prev === undefined ? {} : { prev }),
    ...(next === undefined ? {} : { next }),
  };
}

/** «Определение», «Признак»: синяя полоса слева, как у теории сайта. */
function KartaOpredelenie({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="o3-ramka o3-ramka--opredelenie">
      <p className="o3-ramka__plashka">{title}</p>
      {children}
    </section>
  );
}

/**
 * Глава 2 теории №3 «Главный приём: пространство → плоский
 * треугольник». Умения: читать и рисовать. Пять разделов со
 * счётчиком; у каждого «Важно», «Лайфхака» и «Ловушки» своя задача.
 */
export function Glava2Treugolnik() {
  const lovOdna = risunkiLovushkiOdna();
  const lovGlaz = risunkiLovushkiGlaz();
  return (
    <div className="o3-glava">
      <div className="o3-glava__lead">
        <p className="o3-glava__lead-t">
          Умения: <b>читать</b> чертёж и <b>рисовать</b> — выносить плоскую фигуру отдельно.
        </p>
        <div className="o3-glava__dekor" aria-hidden="true">
          <RisDekor model={dekorPiramida()} />
        </div>
      </div>

      <RazdelGlavy {...razdel(1)}>
        <RamkaIdeya>
          <Abzacy
            paras={[
              'Почти любая задача №3 на длину или угол решается одинаково: в пространстве находим плоский прямоугольный треугольник, где искомое — сторона или угол, и решаем его как в планиметрии. Главное — увидеть этот треугольник и честно объяснить, почему угол в нём прямой.',
            ]}
          />
        </RamkaIdeya>
        <KartaAlgoritm
          title="Главный алгоритм"
          shagi={ALGORITM.map((shag) => ({
            title: shag.title,
            telo: <p className="o3-stepper__text">{shag.text}</p>,
          }))}
        />
        <Abzacy
          paras={[
            'Посмотрите, как это работает на диагонали параллелепипеда. Слева — тело, на нём цветом выделен рабочий треугольник; чертёж можно повернуть и пройти по шагам. Справа — тот же треугольник отдельно.',
          ]}
        />
        <DvePaneli primer={primerDiagonal()} />
        <RamkaLayfhak title="Лайфхак: корень на промежуточном шаге не нужен">
          <ZadachaVRamke z={LAYFHAK_KVADRAT} />
        </RamkaLayfhak>
      </RazdelGlavy>

      <RazdelGlavy {...razdel(2)}>
        <KartaOpredelenie title="Определение">
          <Abzacy
            paras={[
              'Прямая перпендикулярна плоскости, если она перпендикулярна любой прямой, лежащей в этой плоскости.',
            ]}
          />
        </KartaOpredelenie>
        <KartaOpredelenie title="Признак">
          <Abzacy
            paras={[
              'Если прямая перпендикулярна двум пересекающимся прямым плоскости, то она перпендикулярна и самой плоскости.',
              'Признаком доказывают, что прямая перпендикулярна плоскости. Определением пользуются в обратную сторону: раз прямая перпендикулярна плоскости, то она перпендикулярна любой прямой в ней — так и получается прямой угол рабочего треугольника.',
            ]}
          />
        </KartaOpredelenie>
        <RamkaLovushka
          title={LOVUSHKA_ODNA.title}
          neverno={LOVUSHKA_ODNA.neverno}
          verno={LOVUSHKA_ODNA.verno}
          risunokNeverno={<RisSteklo model={lovOdna.neverno} />}
          risunokVerno={<RisSteklo model={lovOdna.verno} />}
        />
        <RamkaVazhno title="Важно: «любой» — значит и не проходящей через основание">
          <ZadachaVRamke z={VAZHNO_LYUBAYA} />
        </RamkaVazhno>
      </RazdelGlavy>

      <RazdelGlavy {...razdel(3)}>
        <Abzacy
          paras={[
            'В задачах №3 прямой угол почти всегда приходит из одного из трёх источников. Запись одна и та же: прямая перпендикулярна плоскости, а другая прямая в этой плоскости лежит.',
          ]}
        />
        <ul className="o3-istochniki">
          <li>
            <b>Ребро перпендикулярно грани.</b>{' '}
            <Tex text="В параллелепипеде и призме боковое ребро перпендикулярно основанию: $AA_1 \perp (ABC)$." />
          </li>
          <li>
            <b>Высота пирамиды перпендикулярна основанию.</b>{' '}
            <Tex text="У правильной пирамиды она падает в центр основания $O$: $SO \perp (ABC)$." />
          </li>
          <li>
            <b>Ось цилиндра и конуса перпендикулярна основанию.</b>{' '}
            <Tex text="Высота, радиус и образующая конуса — прямоугольный треугольник." />
          </li>
        </ul>
        <Formula tex="AA_2 \perp (A_2D_2C_2),\ A_2C_2 \subset (A_2D_2C_2)\ \Rightarrow\ AA_2 \perp A_2C_2" />
        <DvePaneli primer={primerPiramida()} />
      </RazdelGlavy>

      <RazdelGlavy {...razdel(4)}>
        <Abzacy
          paras={[
            'В многограннике, у которого все двугранные углы прямые, рёбра идут только в трёх направлениях. Чтобы найти расстояние между двумя вершинами, опускаем перпендикуляр на плоскость грани и получаем рабочий треугольник.',
          ]}
        />
        <DvePaneli primer={primerStupenka()} />
        <RamkaLovushka
          title={LOVUSHKA_GLAZ.title}
          neverno={LOVUSHKA_GLAZ.neverno}
          verno={LOVUSHKA_GLAZ.verno}
          risunokNeverno={<RisSteklo model={lovGlaz.neverno} />}
          risunokVerno={<RisSteklo model={lovGlaz.verno} />}
        />
        <RamkaVazhno title="Важно: квадрат расстояния — сумма квадратов трёх сдвигов">
          <ZadachaVRamke z={VAZHNO_SDVIGI} />
        </RamkaVazhno>
        <RamkaLayfhak title="Лайфхак: «тройки» в пространстве">
          <ZadachaVRamke z={LAYFHAK_TROYKI} />
        </RamkaLayfhak>
      </RazdelGlavy>

      <RazdelGlavy {...razdel(5)}>
        <Abzacy
          paras={[
            'Угол ищем в том же рабочем треугольнике: сначала прямой угол, потом нужный острый. В ответ идут градусы или тангенс — отношение противолежащего катета к прилежащему.',
          ]}
        />
        <DvePaneli primer={primerUgol45()} />
        <RamkaLayfhak title="Лайфхак: равные катеты — это 45°">
          <ZadachaVRamke z={LAYFHAK_45} />
        </RamkaLayfhak>
        <DvePaneli primer={primerTangens()} />
      </RazdelGlavy>
    </div>
  );
}
