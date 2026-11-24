import { Tex } from '../Tex';

export function NezavisimyeSobytiya5() {
  return (
    <div className="v5-sobytiya">
      <p className="v5-sobytiya__lead">
        Независимость показывает, влияет ли один результат на вероятность другого. Для независимых событий работает правило умножения.
      </p>
      <section className="v5-sobytiya__card" aria-labelledby="v5-independent-definition">
        <h3 id="v5-independent-definition">Когда события независимы</h3>
        <p><Tex text="События $A$ и $B$ независимы, если наступление события $A$ не меняет вероятность события $B$ (и наоборот). Для таких событий вероятность того, что произойдут оба, равна произведению вероятностей:" /></p>
        <div className="v5-sobytiya__formula"><Tex text="$P(A\cap B)=P(A)\cdot P(B)$" /></div>
        <p className="v5-sobytiya__note">
          <Tex text="Слова «и то, и другое» часто подсказывают пересечение $A\cap B$. Но умножать вероятности можно, только если события независимы." />
        </p>
      </section>
      <section className="v5-sobytiya__card" aria-labelledby="v5-independent-example">
        <h3 id="v5-independent-example">Пример: монета и игральная кость</h3>
        <p><Tex text="Одновременно бросают монету и кость. Событие $A$ — выпал орёл; событие $B$ — на кости выпало чётное число. Бросок монеты не влияет на результат кости, значит, события независимы." /></p>
        <figure className="v5-sobytiya__figure">
          <svg viewBox="0 0 620 250" role="img" aria-label="Таблица исходов броска монеты и игральной кости: отмечены три сочетания, где выпал орёл и чётное число">
            <defs>
              <linearGradient id="v5-independent-highlight" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#e9f2ff" />
                <stop offset="1" stopColor="#fff5e9" />
              </linearGradient>
            </defs>
            <text x="28" y="44" fill="#243959" fontSize="17" fontWeight="700">Монета</text>
            <text x="27" y="106" fill="#506783" fontSize="17">Орёл</text>
            <text x="27" y="180" fill="#506783" fontSize="17">Решка</text>
            <text x="168" y="35" fill="#243959" fontSize="17" fontWeight="700">Результат кости</text>
            {[1, 2, 3, 4, 5, 6].map((n, i) => {
              const x = 150 + i * 72;
              const highlighted = n % 2 === 0;
              return (
                <g key={n}>
                  <text x={x + 22} y="66" textAnchor="middle" fill={highlighted ? '#a85f06' : '#506783'} fontSize="17" fontWeight={highlighted ? '700' : '500'}>{n}</text>
                  {[0, 1].map((row) => (
                    <g key={row}>
                      <rect x={x - 12} y={76 + row * 70} width="68" height="58" rx="12" fill={row === 0 && highlighted ? 'url(#v5-independent-highlight)' : '#fff'} stroke={row === 0 && highlighted ? '#e98a32' : '#d8e4f4'} strokeWidth={row === 0 && highlighted ? '2' : '1.5'} />
                      <circle cx={x + 22} cy={105 + row * 70} r={row === 0 && highlighted ? '7' : '4'} fill={row === 0 && highlighted ? '#e98a32' : '#9bb4d8'} />
                    </g>
                  ))}
                </g>
              );
            })}
            <text x="156" y="238" fill="#a85f06" fontSize="15" fontWeight="600">Три из двенадцати равновозможных сочетаний подходят</text>
          </svg>
          <figcaption><Tex text="Орёл и любое из чисел 2, 4, 6: $3$ подходящих исхода из $12$." /></figcaption>
        </figure>
        <ol className="v5-sobytiya__steps">
          <li><Tex text="$P(A)=\dfrac12$, а $P(B)=\dfrac36=\dfrac12$." /></li>
          <li><Tex text="События независимы, поэтому $P(A\cap B)=\dfrac12\cdot\dfrac12=\dfrac14$." /></li>
          <li><Tex text="Проверка по таблице исходов: $3$ из $12$, то есть $\dfrac{3}{12}=\dfrac14$." /></li>
        </ol>
      </section>
      <aside className="v5-sobytiya__warning">
        <strong>Не путайте.</strong> Если два события не могут произойти одновременно, это ещё не делает их независимыми. Напротив, событие одного из них исключает другое.
      </aside>
    </div>
  );
}

export function SovmestnyeSobytiya5() {
  return (
    <div className="v5-sobytiya">
      <p className="v5-sobytiya__lead">
        Совместность отвечает на вопрос: могут ли события произойти в одном и том же испытании? Если у них есть общие исходы, при сложении вероятностей эту общую часть надо вычесть.
      </p>
      <section className="v5-sobytiya__card" aria-labelledby="v5-joint-definition">
        <h3 id="v5-joint-definition">Совместные события и их объединение</h3>
        <p><Tex text="События $A$ и $B$ называются совместными, если они могут наступить одновременно. Их объединение $A\cup B$ означает: произошло хотя бы одно из событий." /></p>
        <div className="v5-sobytiya__formula"><Tex text="$P(A\cup B)=P(A)+P(B)-P(A\cap B)$" /></div>
        <p className="v5-sobytiya__note">
          <Tex text="Общие исходы входят и в $A$, и в $B$, поэтому при сложении их посчитали дважды. Вычитаем пересечение $A\cap B$ один раз." />
        </p>
      </section>
      <section className="v5-sobytiya__card" aria-labelledby="v5-joint-example">
        <h3 id="v5-joint-example">Пример: бросок игральной кости</h3>
        <p><Tex text="Бросают обычную кость. Событие $A$ — выпало чётное число; событие $B$ — выпало число больше трёх. Оба условия могут выполниться сразу — например, если выпало 4 или 6, поэтому события совместные." /></p>
        <figure className="v5-sobytiya__figure">
          <svg viewBox="0 0 620 330" role="img" aria-label="Диаграмма Венна: в событии A только число 2, в пересечении 4 и 6, в событии B только 5, вне кругов 1 и 3">
            <rect x="10" y="10" width="600" height="300" rx="22" fill="#fff" stroke="#d8e4f4" strokeWidth="2" />
            <circle cx="245" cy="158" r="100" fill="#2b67d8" fillOpacity=".09" stroke="#2b67d8" strokeWidth="3" />
            <circle cx="375" cy="158" r="100" fill="#e98a32" fillOpacity=".10" stroke="#e98a32" strokeWidth="3" />
            <text x="193" y="45" textAnchor="middle" fill="#1e57bd" fontSize="23" fontFamily="Georgia" fontStyle="italic">A</text>
            <text x="429" y="45" textAnchor="middle" fill="#ba6522" fontSize="23" fontFamily="Georgia" fontStyle="italic">B</text>
            <text x="186" y="154" textAnchor="middle" fill="#18243a" fontSize="25" fontWeight="650">2</text>
            <text x="310" y="137" textAnchor="middle" fill="#18243a" fontSize="25" fontWeight="650">4</text>
            <text x="310" y="183" textAnchor="middle" fill="#18243a" fontSize="25" fontWeight="650">6</text>
            <text x="432" y="154" textAnchor="middle" fill="#18243a" fontSize="25" fontWeight="650">5</text>
            <text x="58" y="275" fill="#18243a" fontSize="23" fontWeight="650">1</text>
            <text x="545" y="275" fill="#18243a" fontSize="23" fontWeight="650">3</text>
            <text x="310" y="294" textAnchor="middle" fill="#506783" fontSize="15">Два общих исхода: 4 и 6</text>
          </svg>
          <figcaption><Tex text="$A=\{2;4;6\}$, $B=\{4;5;6\}$, $A\cap B=\{4;6\}$, $A\cup B=\{2;4;5;6\}$." /></figcaption>
        </figure>
        <ol className="v5-sobytiya__steps">
          <li><Tex text="$P(A)=\dfrac36$, $P(B)=\dfrac36$, $P(A\cap B)=\dfrac26$." /></li>
          <li><Tex text="Подставляем в правило: $P(A\cup B)=\dfrac36+\dfrac36-\dfrac26=\dfrac46=\dfrac23$." /></li>
        </ol>
      </section>
      <section className="v5-sobytiya__card v5-sobytiya__card--small" aria-labelledby="v5-disjoint">
        <h3 id="v5-disjoint">Если события несовместны</h3>
        <p><Tex text="У несовместных событий общих исходов нет: $P(A\cap B)=0$. Тогда формула упрощается: вероятность события «$A$ или $B$» равна сумме вероятностей." /></p>
        <div className="v5-sobytiya__formula"><Tex text="$P(A\cup B)=P(A)+P(B)$" /></div>
        <p>Например, при одном броске число не может быть одновременно чётным и нечётным.</p>
      </section>
    </div>
  );
}
