import { clsx } from 'clsx';
import type { KeyboardEvent } from 'react';
import { KARTA_TEKST, oblastDlyaDiktora, vDveStroki } from '@/content/karta/teksty';
import type { Ostrov } from '@/lib/karta/geometriya';
import type { SostoyanieOblasti } from '@/lib/karta/model';
import { ZnachokZadaniya } from './znachki';

/** Кольцо прогресса с процентом: длина окружности радиуса 13. */
const KRUG = 2 * Math.PI * 13;

/**
 * Остров на карте: контур (область нажатия и маска состояния), подпись,
 * значок и отметки состояния. Подпись рисуется в «экранных» пикселях:
 * её масштаб задаёт CSS (--podpis / --k), поэтому она читается и на
 * виде «Весь мир», и вблизи.
 */
export function KartaOstrov({
  ostrov,
  razdel,
  nomer,
  oblast,
  nazvanie,
  vybran,
  sleduyushchaya,
  novaya,
  onVybor,
}: {
  /** Место на рисунке: контур, центр подписи. */
  ostrov: Ostrov;
  /** Номер хранения раздела: по нему выбирают область и рисуют значок. */
  razdel: number;
  /** Номер ЕГЭ на подписи острова. */
  nomer: number;
  oblast: SostoyanieOblasti;
  nazvanie: string;
  vybran: boolean;
  sleduyushchaya: boolean;
  /** Освоена с прошлого визита: «свет заливает остров». */
  novaya: boolean;
  onVybor: (no: number, sKlaviatury: boolean) => void;
}) {
  const no = razdel;
  const mesto = ostrov.no;
  const s = oblast.sostoyanie;
  const stroki = vDveStroki(nazvanie);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onVybor(no, true);
    }
  };
  return (
    <g
      className={clsx(
        'karta-ostrov',
        `karta-ostrov--${s}`,
        vybran && 'is-vybran',
        sleduyushchaya && 'is-sleduyushchaya',
        novaya && 'is-novaya',
      )}
    >
      {/* Заливка состояния: туман, голубое стекло или тёплый свет. */}
      <path className="karta-ostrov__zalivka" d={ostrov.d} clipPath={`url(#karta-kontur-${mesto})`} />
      {novaya ? (
        <circle
          className="karta-ostrov__svet"
          cx={ostrov.cx}
          cy={ostrov.cy}
          r={Math.max(ostrov.ramka.w, ostrov.ramka.h)}
          clipPath={`url(#karta-kontur-${mesto})`}
        />
      ) : null}
      {/* Контур: по нему нажимают и на нём стоит фокус клавиатуры. */}
      <path
        className="karta-ostrov__kontur"
        d={ostrov.d}
        data-cel={`oblast:${no}`}
        tabIndex={0}
        role="button"
        aria-pressed={vybran}
        aria-label={oblastDlyaDiktora({
          no,
          nazvanie,
          sostoyanie: s,
          procent: oblast.procent,
          povtoritGruppy: oblast.povtoritGruppy,
          sleduyushchaya,
        })}
        onKeyDown={onKey}
      />
      <g
        className="karta-ostrov__podpis"
        transform={`translate(${ostrov.cx} ${ostrov.cy})`}
        aria-hidden="true"
      >
        <g className="karta-podpis">
          <text className="karta-podpis__nomer" x={-6} y={-2} textAnchor="end">
            {nomer}
          </text>
          {s === 'v-processe' ? (
            <g className="karta-podpis__kolco" transform="translate(17 -13)">
              <circle className="karta-podpis__kolco-fon" r={13} />
              <circle
                className="karta-podpis__kolco-hod"
                r={13}
                strokeDasharray={`${(KRUG * oblast.procent) / 100} ${KRUG}`}
                transform="rotate(-90)"
              />
              <text className="karta-podpis__procent" y={3.6} textAnchor="middle">
                {oblast.procent} %
              </text>
            </g>
          ) : (
            <g className="karta-podpis__znachok" transform="translate(14 -13) scale(0.92)">
              <ZnachokZadaniya no={no} />
            </g>
          )}
          {s === 'osvoeno' ? (
            <g className="karta-podpis__flag" transform="translate(30 -30)">
              <path d="M0 14 V-9" />
              <path className="karta-podpis__flag-polotno" d="M0 -9 H13 L9.5 -4.5 L13 0 H0 Z" />
            </g>
          ) : null}
          {oblast.povtorit ? (
            <g className="karta-podpis__povtorit" transform="translate(-36 -27)">
              <circle r={8.5} />
              <path d="M-3.6 0.6 A3.8 3.8 0 1 1 -1.2 3.7 M-3.9 -3 V0.9 H0" />
            </g>
          ) : null}
          <text className="karta-podpis__nazvanie" textAnchor="middle">
            {s === 'skoro' ? (
              <tspan x={0} y={15}>
                {KARTA_TEKST.skoro}
              </tspan>
            ) : (
              stroki.map((stroka, i) => (
                <tspan key={stroka} x={0} y={15 + i * 14}>
                  {stroka}
                </tspan>
              ))
            )}
          </text>
        </g>
      </g>
      {sleduyushchaya ? (
        <g
          className="karta-mayak"
          transform={`translate(${ostrov.cx} ${ostrov.cy})`}
          data-cel={`oblast:${no}`}
          aria-hidden="true"
        >
          <g className="karta-podpis">
            <g transform="translate(-34 -44)">
              <circle className="karta-mayak__volna" r={11} cy={12} />
              <path
                className="karta-mayak__kaplya"
                d="M0 14 C-9 3 -11 -1 -11 -6 A11 11 0 0 1 11 -6 C11 -1 9 3 0 14 Z"
              />
              <circle className="karta-mayak__golova" cy={-9} r={3.1} />
              <path className="karta-mayak__plechi" d="M-5.4 -0.6 A5.6 5.6 0 0 1 5.4 -0.6 Z" />
            </g>
          </g>
        </g>
      ) : null}
    </g>
  );
}

/**
 * Свободный остров: заданий в структуре экзамена меньше, чем островов на
 * рисунке. Только туман и надпись «Будет на ЕГЭ» — нажимать не на что.
 */
export function KartaSvobodnyyOstrov({ ostrov }: { ostrov: Ostrov }) {
  return (
    <g className="karta-svobodnyy" aria-hidden="true">
      <path className="karta-ostrov__zalivka" d={ostrov.d} clipPath={`url(#karta-kontur-${ostrov.no})`} />
      <g className="karta-ostrov__podpis" transform={`translate(${ostrov.cx} ${ostrov.cy})`}>
        <g className="karta-podpis">
          <text className="karta-podpis__nazvanie" textAnchor="middle">
            <tspan x={0} y={4}>
              {KARTA_TEKST.budetNaEge}
            </tspan>
          </text>
        </g>
      </g>
    </g>
  );
}
