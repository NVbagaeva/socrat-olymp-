import katex from 'katex';
import { Abzacy, RamkaLayfhak, RamkaLovushka, RamkaOpredelenie, RamkaPrimer, RamkaVazhno } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
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
  VAZHNO_LYUBAYA,
  VAZHNO_SDVIGI,
  type PrimerG2,
  type ZadachaRamki,
} from '@/lib/stereo/glava2';
import { renderPloskiy } from '@/lib/stereo/ploskiy';
import { Chertezh3d } from '../Chertezh3d';

const NOMERA = ['①', '②', '③', '④', '⑤'] as const;

function Formula({ tex }: { tex: string }) {
  return (
    <span
      className="ramka__formula"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: false, displayMode: true }),
      }}
    />
  );
}

/**
 * Двухпанельный пример: слева тело с выделенным рабочим треугольником
 * (живой чертёж — поворачивается, шаги по кнопкам), справа тот же
 * треугольник плоско, с данными. Под ними — решение по шагам главного
 * алгоритма ①–⑤.
 */
export function DvePaneli({ primer }: { primer: PrimerG2 }) {
  return (
    <RamkaPrimer
      title={primer.title}
      uslovie={primer.uslovie}
      shagi={primer.shagi.map((shag) => ({
        label: `${NOMERA[shag.n - 1]} ${ALGORITM[shag.n - 1]?.title ?? ''}`,
        paras: shag.paras,
        ...(shag.formuly === undefined ? {} : { formuly: shag.formuly }),
      }))}
      otvet={primer.otvet}
    >
      <div className="stereo-dve">
        <div className="stereo-dve__telo">
          <p className="stereo-dve__podpis">В пространстве</p>
          <Chertezh3d model={primer.model} uslovie={primer.uslovie} shagi={primer.shagiChertezha} />
        </div>
        <figure className="stereo-dve__ploskiy">
          <p className="stereo-dve__podpis">Рабочий треугольник отдельно</p>
          <div
            className="stereo-dve__svg"
            dangerouslySetInnerHTML={{ __html: renderPloskiy(primer.ploskiy) }}
          />
        </figure>
      </div>
    </RamkaPrimer>
  );
}

/** Задача к рамке «Важно», «Лайфхак»: условие, решение, ответ. */
function ZadachaRamki({ z }: { z: ZadachaRamki }) {
  return (
    <div className="stereo-zr">
      <p className="ramka__p stereo-zr__uslovie">
        <b>Задача.</b> <Tex text={z.uslovie} />
      </p>
      <Abzacy paras={z.reshenie} />
      {(z.formuly ?? []).map((f) => (
        <Formula tex={f} key={f} />
      ))}
      <p className="ramka__p stereo-zr__otvet">
        <Tex text={z.otvet} />
      </p>
    </div>
  );
}

/**
 * Глава 2 теории №3 «Главный приём: пространство → плоский
 * треугольник». Умения: читать и рисовать. Разделы — подзаголовками,
 * у каждого «Важно», «Лайфхака» и «Ловушки» есть своя задача.
 */
export function Glava2Treugolnik() {
  return (
    <div className="stereo-glava">
      <p className="stereo-umenie">
        Умения: <b>читать</b> чертёж и <b>рисовать</b> — выносить плоскую фигуру отдельно.
      </p>
      <Abzacy
        paras={[
          'Почти любая задача №3 на длину или угол решается одинаково: в пространстве находим плоский прямоугольный треугольник, где искомое — сторона или угол, и решаем его как в планиметрии. Главное — увидеть этот треугольник и честно объяснить, почему угол в нём прямой.',
        ]}
      />

      <RamkaOpredelenie title="Главный алгоритм">
        <ol className="ramka__algoritm">
          {ALGORITM.map((shag) => (
            <li key={shag.title}>
              <b>{shag.title}.</b> {shag.text}
            </li>
          ))}
        </ol>
      </RamkaOpredelenie>
      <Abzacy
        paras={[
          'Посмотрите, как это работает на диагонали параллелепипеда. Слева — тело, на нём цветом выделен рабочий треугольник; чертёж можно повернуть и пройти по шагам. Справа — тот же треугольник отдельно.',
        ]}
      />
      <DvePaneli primer={primerDiagonal()} />
      <RamkaLayfhak title="Лайфхак: корень на промежуточном шаге не нужен">
        <ZadachaRamki z={LAYFHAK_KVADRAT} />
      </RamkaLayfhak>

      <h3 className="stereo-glava__h">Прямая, перпендикулярная плоскости</h3>
      <RamkaOpredelenie title="Определение">
        <Abzacy
          paras={[
            'Прямая перпендикулярна плоскости, если она перпендикулярна любой прямой, лежащей в этой плоскости.',
          ]}
        />
      </RamkaOpredelenie>
      <RamkaOpredelenie title="Признак">
        <Abzacy
          paras={[
            'Если прямая перпендикулярна двум пересекающимся прямым плоскости, то она перпендикулярна и самой плоскости.',
            'Признаком доказывают, что прямая перпендикулярна плоскости. Определением пользуются в обратную сторону: раз прямая перпендикулярна плоскости, то она перпендикулярна любой прямой в ней — так и получается прямой угол рабочего треугольника.',
          ]}
        />
      </RamkaOpredelenie>
      <RamkaVazhno title="Важно: «любой» — значит и не проходящей через основание">
        <ZadachaRamki z={VAZHNO_LYUBAYA} />
      </RamkaVazhno>
      <RamkaLovushka title={LOVUSHKA_ODNA.title} neverno={LOVUSHKA_ODNA.neverno} verno={LOVUSHKA_ODNA.verno} />

      <h3 className="stereo-glava__h">Как обосновать прямой угол</h3>
      <Abzacy
        paras={[
          'В задачах №3 прямой угол почти всегда приходит из одного из трёх источников. Запись одна и та же: прямая перпендикулярна плоскости, а другая прямая в этой плоскости лежит.',
        ]}
      />
      <ul className="stereo-istochniki">
        <li>
          <b>Ребро перпендикулярно грани.</b> <Tex text="В параллелепипеде и призме боковое ребро перпендикулярно основанию: $AA_1 \perp (ABC)$." />
        </li>
        <li>
          <b>Высота пирамиды перпендикулярна основанию.</b> <Tex text="У правильной пирамиды она падает в центр основания $O$: $SO \perp (ABC)$." />
        </li>
        <li>
          <b>Ось цилиндра и конуса перпендикулярна основанию.</b> <Tex text="Высота, радиус и образующая конуса — прямоугольный треугольник." />
        </li>
      </ul>
      <Formula tex="AA_2 \perp (A_2D_2C_2),\ A_2C_2 \subset (A_2D_2C_2)\ \Rightarrow\ AA_2 \perp A_2C_2" />
      <DvePaneli primer={primerPiramida()} />

      <h3 className="stereo-glava__h">Расстояние между вершинами</h3>
      <Abzacy
        paras={[
          'В многограннике, у которого все двугранные углы прямые, рёбра идут только в трёх направлениях. Чтобы найти расстояние между двумя вершинами, опускаем перпендикуляр на плоскость грани и получаем рабочий треугольник.',
        ]}
      />
      <DvePaneli primer={primerStupenka()} />
      <RamkaVazhno title="Важно: квадрат расстояния — сумма квадратов трёх сдвигов">
        <ZadachaRamki z={VAZHNO_SDVIGI} />
      </RamkaVazhno>
      <RamkaLayfhak title="Лайфхак: «тройки» в пространстве">
        <ZadachaRamki z={LAYFHAK_TROYKI} />
      </RamkaLayfhak>
      <RamkaLovushka title={LOVUSHKA_GLAZ.title} neverno={LOVUSHKA_GLAZ.neverno} verno={LOVUSHKA_GLAZ.verno} />

      <h3 className="stereo-glava__h">Угол и тангенс</h3>
      <Abzacy
        paras={[
          'Угол ищем в том же рабочем треугольнике: сначала прямой угол, потом нужный острый. В ответ идут градусы или тангенс — отношение противолежащего катета к прилежащему.',
        ]}
      />
      <DvePaneli primer={primerUgol45()} />
      <RamkaLayfhak title="Лайфхак: равные катеты — это 45°">
        <ZadachaRamki z={LAYFHAK_45} />
      </RamkaLayfhak>
      <DvePaneli primer={primerTangens()} />
    </div>
  );
}
