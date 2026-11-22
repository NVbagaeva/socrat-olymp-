import { ProbabilityTree, type TreeBranch } from '@/components/probability';
import { RamkaLayfhak, RamkaOpredelenie, RamkaVyvod } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { USLOVNAYA } from '@/content/veroyatnost-teoriya5';
import { typeset } from '@/lib/tex';
import { YAKOR_5 } from '@/lib/veroyatnost/teoriya-yakorya';
import { Abzacy5, Formula5, Razbor5, Risunok5, SpisokVyvoda } from './Teoriya5Bloki';
import { Vykladka } from './Vykladka';

/**
 * Раздел теории №5 «Условная вероятность»: смысл («сужаем мир»),
 * формула, дерево вероятностей, формула полной вероятности, обратная
 * задача и приём «берём удобное общее количество» с таблицей 2 × 2.
 *
 * Деревья рисует ProbabilityTree из тренажёра — тот же рисунок, что
 * ученик видит в разборах метода 4.
 */

/** Дерево задачи о стёклах: фабрика → брак или норма. */
const STEKLA: readonly TreeBranch[] = [
  { id: 'f1', parent: null, label: 'фабрика 1', p: 0.45 },
  { id: 'f2', parent: null, label: 'фабрика 2', p: 0.55 },
  { id: 'f1-b', parent: 'f1', label: 'брак', p: 0.03 },
  { id: 'f1-n', parent: 'f1', label: 'норма', p: 0.97 },
  { id: 'f2-b', parent: 'f2', label: 'брак', p: 0.01 },
  { id: 'f2-n', parent: 'f2', label: 'норма', p: 0.99 },
];

/** Дерево задачи о тесте: болен или здоров → результат теста. */
const TEST: readonly TreeBranch[] = [
  { id: 'b', parent: null, label: 'болен', p: 0.05 },
  { id: 'z', parent: null, label: 'здоров', p: 0.95 },
  { id: 'b-p', parent: 'b', label: '+', p: 0.95 },
  { id: 'b-m', parent: 'b', label: '−', p: 0.05 },
  { id: 'z-p', parent: 'z', label: '+', p: 0.05 },
  { id: 'z-m', parent: 'z', label: '−', p: 0.95 },
];

/** Формула внутри строки: ячейка таблицы, строка пропорции. */
function Mat({ tex }: { tex: string }) {
  return <span dangerouslySetInnerHTML={{ __html: typeset(`$${tex}$`, true) }} />;
}

/** Пропорция «100 % — 520 (чел.), 15 % — x (чел.)» в стиле сайта. */
function Proportsiya() {
  const { stroki, reshenie, podpis } = USLOVNAYA.layfhak.proportsiya;
  return (
    <div className="t5-proportsiya">
      <div className="t5-proportsiya__zapis">
        {stroki.map(([l, r]) => (
          <div className="t5-proportsiya__stroka" key={l}>
            <Mat tex={l} />
            <span aria-hidden="true">—</span>
            <Mat tex={r} />
          </div>
        ))}
      </div>
      <Vykladka stroki={reshenie} krupnyeDrobi />
      <p className="t5-proportsiya__podpis">{podpis}</p>
    </div>
  );
}

/** Таблица 2 × 2 с итогами: нужные ячейки подсвечены. */
function Tablitsa() {
  const { title, lead, stolbtsy, stroki, podpis, formula } = USLOVNAYA.layfhak.tablitsa;
  return (
    <figure className="t5-tablitsa">
      <figcaption className="t5-tablitsa__title">{title}</figcaption>
      <p className="t5-tablitsa__lead">{lead}</p>
      <table className="t5-tablitsa__t">
        <colgroup>
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <td />
            {stolbtsy.map((s) => (
              <th scope="col" key={s}>
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stroki.map((stroka, r) => (
            <tr key={stroka.imya} className={r === 0 ? 't5-tablitsa__mir' : undefined}>
              <th scope="row">{stroka.imya}</th>
              {stroka.chisla.map((n, c) => (
                <td
                  key={c}
                  className={
                    r === 0 && c === 0
                      ? 't5-tablitsa__nuzhnye'
                      : r === 0 && c === 2
                        ? 't5-tablitsa__vse'
                        : undefined
                  }
                >
                  {n}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="t5-tablitsa__legenda">
        <span className="t5-tablitsa__znak t5-tablitsa__znak--nuzhnye" aria-hidden="true" /> нужные
        (мужчины-пенсионеры){' '}
        <span className="t5-tablitsa__znak t5-tablitsa__znak--vse" aria-hidden="true" /> все
        подходящие (мужчины)
      </p>
      <p className="t5-tablitsa__podpis">
        <Tex text={podpis} />
      </p>
      <Vykladka stroki={[formula]} krupnyeDrobi />
    </figure>
  );
}

export function UslovnayaVeroyatnost() {
  const { lead, smysl, formula, derevo, polnaya, obratnaya, layfhak, vyvod } = USLOVNAYA;
  const shagProportsii = layfhak.zadacha.shagi.findIndex(
    (s) => s.title === layfhak.proportsiya.shag,
  );
  return (
    <div className="t5-razdel">
      <p className="vteor-blok__lead">{lead}</p>

      <RamkaOpredelenie title={smysl.title} id={YAKOR_5.uslov('smysl')}>
        <p className="ramka__p">
          <Tex text={smysl.text} />
        </p>
        <p className="ramka__p">
          <Tex text={smysl.mir} />
        </p>
      </RamkaOpredelenie>
      <section className="t5-zhizn">
        <p className="t5-zhizn__title">{smysl.bytovoy.title}</p>
        <p className="t5-p">
          <Tex text={smysl.bytovoy.text} />
        </p>
      </section>

      <section className="t5-pravilo" id={YAKOR_5.uslov('formula')}>
        <h4 className="t5-pravilo__title">Формула условной вероятности</h4>
        <Formula5 formula={formula.formula} podpis={formula.podpis} />
        <Abzacy5 stroki={formula.slovami} className="t5-p" />
        <Razbor5 z={formula.zadacha} ton="belyy" yakor="t5-uslov-zadacha-kubik" />
      </section>

      <section className="t5-pravilo t5-derevo" id={YAKOR_5.uslov('derevo')}>
        <h4 className="t5-pravilo__title">{derevo.title}</h4>
        <ol className="t5-derevo__kak">
          {derevo.kak.map((p) => (
            <li key={p}>
              <Tex text={p} />
            </li>
          ))}
        </ol>
        <Risunok5>
          <ProbabilityTree branches={STEKLA} className="t5-tree" alt={polnaya.alt} />
        </Risunok5>
        <div className="t5-para">
          {derevo.pravila.map((p) => (
            <div className="t5-kartochka" key={p.title}>
              <p className="t5-kartochka__title">{p.title}</p>
              <p className="t5-p">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="t5-pravilo" id={YAKOR_5.uslov('stekla')}>
        <h4 className="t5-pravilo__title">{polnaya.title}</h4>
        <Formula5 formula={polnaya.formula} podpis={polnaya.podpis} />
        <Razbor5 z={polnaya.zadacha} ton="goluboy" yakor="t5-uslov-zadacha-stekla">
          <Risunok5>
            <ProbabilityTree
              branches={STEKLA}
              highlightedPaths={['f1-b', 'f2-b']}
              showProducts
              showSum
              className="t5-tree"
              alt={polnaya.alt}
            />
          </Risunok5>
        </Razbor5>
      </section>

      <section className="t5-pravilo" id={YAKOR_5.uslov('test')}>
        <h4 className="t5-pravilo__title">{obratnaya.title}</h4>
        <Razbor5 z={obratnaya.zadacha} ton="belyy" yakor="t5-uslov-zadacha-test">
          <Risunok5>
            <ProbabilityTree
              branches={TEST}
              highlightedPaths={['b-p', 'z-p']}
              showProducts
              className="t5-tree"
              alt={obratnaya.alt}
            />
          </Risunok5>
        </Razbor5>
      </section>

      <section className="t5-pravilo" id={YAKOR_5.uslov('layfhak')}>
        <RamkaLayfhak title={layfhak.title}>
          <Abzacy5 stroki={layfhak.text} className="ramka__p" />
        </RamkaLayfhak>
        <Razbor5
          z={layfhak.zadacha}
          ton="goluboy"
          yakor="t5-uslov-zadacha-pensionery"
          vstavki={{ [shagProportsii]: <Proportsiya /> }}
          posle={
            <>
              <Tablitsa />
              <aside className="t5-proverka">
                <p className="t5-proverka__title">
                  <span className="t5-proverka__znak" aria-hidden="true">
                    ✓
                  </span>
                  {layfhak.proverka.title}
                </p>
                <ul className="t5-proverka__spisok">
                  {layfhak.proverka.stroki.map((s) => (
                    <li key={s}>
                      <Tex text={s} />
                    </li>
                  ))}
                </ul>
              </aside>
            </>
          }
        />
      </section>

      <RamkaVyvod title={vyvod.title} id={YAKOR_5.uslov('vyvod')}>
        <SpisokVyvoda punkty={vyvod.punkty} />
      </RamkaVyvod>
    </div>
  );
}
