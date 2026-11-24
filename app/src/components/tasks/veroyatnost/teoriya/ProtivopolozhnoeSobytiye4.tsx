import { Tex } from '../Tex';

export function ProtivopolozhnoeSobytiye4() {
  return (
    <section className="v5-sobytiya v4-protivopolozhnoe">
      <p className="v5-sobytiya__lead">
        Противоположное событие удобно, когда проще посчитать шанс, что событие не произойдёт, и вычесть его из единицы.
      </p>
      <article className="v5-sobytiya__card">
        <h3>Что такое противоположное событие</h3>
        <p>
          <Tex text="Событие $\overline A$ противоположно событию $A$, если $A$ не произошло. Ровно одно из двух обязательно случается: либо $A$, либо $\overline A$. Вместе они покрывают все возможные исходы и не имеют общих исходов." />
        </p>
        <div className="v5-sobytiya__formula"><Tex text="$P(A)+P(\overline A)=1,\qquad P(\overline A)=1-P(A)$" /></div>
      </article>
      <article className="v5-sobytiya__card">
        <h3>Пример: не выпала шестёрка</h3>
        <p><Tex text="Бросают правильную игральную кость. Событие $A$ — выпала шестёрка; противоположное событие $\overline A$ — выпало любое другое число." /></p>
        <figure className="v5-sobytiya__figure v4-protivopolozhnoe__figure">
          <svg viewBox="0 0 660 205" role="img" aria-label="Шесть равновозможных исходов броска кости: числа от 1 до 5 выделены как противоположное событие, шестёрка отмечена отдельно">
            {[1, 2, 3, 4, 5, 6].map((n, i) => {
              const x = 24 + i * 105;
              const opposite = n !== 6;
              return (
                <g key={n}>
                  <rect x={x} y="30" width="84" height="90" rx="18" fill={opposite ? '#edf4ff' : '#fff3e8'} stroke={opposite ? '#2b67d8' : '#e98a32'} strokeWidth="2" />
                  <text x={x + 42} y="87" textAnchor="middle" fill={opposite ? '#1f56bb' : '#a85f06'} fontSize="32" fontWeight="700">{n}</text>
                  <text x={x + 42} y="153" textAnchor="middle" fill={opposite ? '#1f56bb' : '#a85f06'} fontSize="14" fontWeight="600">{opposite ? 'остальные' : 'событие'}</text>
                </g>
              );
            })}
            <text x="330" y="191" textAnchor="middle" fill="#506783" fontSize="15">Пять подходящих исходов дополняют шестой до всех шести</text>
          </svg>
        </figure>
        <ol className="v5-sobytiya__steps">
          <li><Tex text="У события $A$ один благоприятный исход из шести, значит, $P(A)=\dfrac16$." /></li>
          <li><Tex text="Тогда $P(\overline A)=1-\dfrac16=\dfrac56$." /></li>
          <li><Tex text="Проверка: числа $1,2,3,4,5$ — пять из шести исходов." /></li>
        </ol>
      </article>
      <aside className="v5-sobytiya__warning">
        <strong>Подсказка.</strong>{' '}
        <Tex text="Слова «хотя бы один» часто проще считать через противоположное событие «ни одного»: $P(\text{хотя бы один})=1-P(\text{ни одного})$." />
      </aside>
    </section>
  );
}
