import 'katex/dist/katex.min.css';
import './karkas.css';
import { TaskImage } from '@/components/tasks/TaskImage';
import { Tex } from '@/components/ui/Tex';
import { Rezhim, Slozhnost, Vkladki } from './Interaktiv';
import { Kristall } from '@/components/landing/kristall/Kristall';
import {
  GEROY,
  NAPRAVLENIYA,
  OSHIBKI,
  RAZDEL,
  RAZDELY,
  SHAPKA,
  SHRIFTY,
  TABBAR,
  TIPY,
  TRENAZHER,
  UPRAVLENIE,
  type Napravlenie,
} from './kontent';

/**
 * Демо-страница направления. Разметка и тексты у обоих направлений одни
 * и те же; оформление — в своих токенах и стилях каждой страницы
 * (steklo/, chertyozh/). Различаются только декоративные слои, которые
 * в другом направлении не нужны: свечения позади стекла у «Стеклянной
 * сцены», подписи к кристаллу и рукописная ремарка у «Чертежа».
 *
 * Живые страницы сайта эти стили не видят: всё оформление лежит под
 * корневым классом .dm-steklo или .dm-chertyozh.
 */

function Strelka() {
  return (
    <svg className="dm-strelka" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h13M12 6l6 6-6 6" />
    </svg>
  );
}

function Logo() {
  return (
    <svg className="dm-logo__znak" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" />
      <path d="M7 24h18M7 24L25 9" />
    </svg>
  );
}

const IKONKI_TABBARA = [
  'M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z',
  'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  'M5 19V11M10 19V5M15 19v-6M20 19V9',
  'M6 12h.01M12 12h.01M18 12h.01',
];

export interface DemoStranicaProps {
  vid: Napravlenie;
  /**
   * Классы переменных шрифтов направления (next/font, shrifty.ts страницы).
   * У «Стеклянной сцены» пусто: её шрифт — общий Inter сайта.
   */
  shrifty: string;
}

export function DemoStranica({ vid, shrifty }: DemoStranicaProps) {
  const drugoe: Napravlenie = vid === 'steklo' ? 'chertyozh' : 'steklo';
  const steklo = vid === 'steklo';
  return (
    <div className={`dm-root dm-${vid} ${shrifty}`}>
      {/* Полоса демо: какое направление открыто и переход ко второму. */}
      <div className="dm-demo">
        <span>
          Демо направления · <b>{NAPRAVLENIYA[vid].nazvanie}</b>
          <span className="dm-demo__istochnik"> · {NAPRAVLENIYA[vid].podpis}</span>
        </span>
        {/* Обычная ссылка, не next/link: та заранее подгрузила бы вторую
            страницу вместе с её шрифтами, и замеры смешались бы. */}
        <a href={NAPRAVLENIYA[drugoe].href}>Сравнить: {NAPRAVLENIYA[drugoe].nazvanie} →</a>
      </div>

      <header className="dm-shapka">
        <div className="dm-shapka__vnutri">
          <a className="dm-logo" href="#top">
            <Logo />
            <span>Будет на ЕГЭ</span>
          </a>
          <nav className="dm-menu" aria-label="Разделы демо">
            {SHAPKA.menu.map((p) => (
              <a key={p.href} href={p.href}>
                {p.label}
              </a>
            ))}
          </nav>
          <a className="dm-btn dm-btn--secondary dm-btn--sm" href="#top">
            {SHAPKA.knopka}
          </a>
        </div>
      </header>

      <main id="top">
        {/* ── Герой ─────────────────────────────────────────────── */}
        <section className="dm-geroy">
          {steklo ? (
            <div className="dm-svecheniya" aria-hidden="true">
              <span className="dm-svechenie dm-svechenie--siniy" />
              <span className="dm-svechenie dm-svechenie--oranzh" />
              <span className="dm-svechenie dm-svechenie--terra" />
            </div>
          ) : (
            <div className="dm-setka" aria-hidden="true" />
          )}
          <div className="dm-geroy__vnutri">
            <div className="dm-geroy__tekst">
              <p className="dm-nadzagolovok">{GEROY.nadzagolovok}</p>
              <h1 className="dm-display">{GEROY.zagolovok}</h1>
              <p className="dm-lid">{GEROY.lid}</p>
            </div>
            <Kristall className="dm-geroy__kristall" podpisi={steklo ? [] : GEROY.podpisi} />
            <div className="dm-dveri">
              {GEROY.dveri.map((d) => (
                <a key={d.id} className={`dm-dver dm-dver--${d.id}`} href="#razdely">
                  <span className="dm-dver__zagolovok">{d.zagolovok}</span>
                  <span className="dm-dver__tekst">{d.tekst}</span>
                  <span className="dm-dver__deystvie">
                    {d.deystvie}
                    <Strelka />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Разделы ───────────────────────────────────────────── */}
        <section className="dm-sekciya" id="razdely">
          <div className="dm-sekciya__golova">
            <h2 className="dm-h2">{RAZDELY.zagolovok}</h2>
            <p className="dm-sekciya__lid">{RAZDELY.lid}</p>
          </div>
          <ul className="dm-razdely">
            {RAZDELY.kartochki.map((k) => (
              <li key={k.no}>
                <a className="dm-razdel" href="#razdel">
                  <span className="dm-razdel__nomer">
                    <span className="dm-razdel__znak">№</span>
                    <span className="dm-cifry">{k.no}</span>
                  </span>
                  <span className="dm-razdel__nazvanie">{k.nazvanie}</span>
                  <span className="dm-razdel__sostav">{k.sostav}</span>
                  <span className="dm-razdel__ill">
                    <TaskImage no={k.no} format={k.format} />
                  </span>
                  <span className="dm-razdel__go">
                    <Strelka />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Шапка раздела и вкладки ───────────────────────────── */}
        <section className="dm-sekciya" id="razdel">
          <nav className="dm-kroshki" aria-label="Хлебные крошки">
            {RAZDEL.kroshki.map((k, i) => (
              <span key={k}>
                {i > 0 ? <span className="dm-kroshki__razd">/</span> : null}
                {k}
              </span>
            ))}
          </nav>
          <div className="dm-razdel-golova">
            <span className="dm-razdel-golova__nomer dm-cifry">{RAZDEL.nomer}</span>
            <h2 className="dm-h1">{RAZDEL.zagolovok}</h2>
            <span className="dm-beydzh">{RAZDEL.beydzh}</span>
          </div>
          <p className="dm-sekciya__lid">{RAZDEL.lid}</p>
          <Vkladki />
        </section>

        {/* ── Элементы управления ───────────────────────────────── */}
        <section className="dm-sekciya" id="upravlenie">
          <h2 className="dm-h2">{UPRAVLENIE.zagolovok}</h2>
          <div className="dm-panel dm-upravlenie">
            <div className="dm-knopki">
              <button type="button" className="dm-btn dm-btn--primary">
                {UPRAVLENIE.knopki.primary}
                <Strelka />
              </button>
              <button type="button" className="dm-btn dm-btn--secondary">
                {UPRAVLENIE.knopki.secondary}
              </button>
              <button type="button" className="dm-btn dm-btn--ghost">
                {UPRAVLENIE.knopki.ghost}
              </button>
              <span className="dm-beydzh dm-beydzh--novoe">{UPRAVLENIE.beydzh}</span>
            </div>
            <Rezhim />
            <Slozhnost />
          </div>
        </section>

        {/* ── Типы заданий и ошибки ─────────────────────────────── */}
        <section className="dm-sekciya dm-dva" id="tipy">
          <div>
            <h2 className="dm-h2">{TIPY.zagolovok}</h2>
            <div className="dm-panel dm-tipy">
              <p className="dm-tipy__gruppa">
                <span className="dm-cifry">II</span> {TIPY.gruppa}
              </p>
              <ul>
                {TIPY.stroki.map((s) => (
                  <li key={s.no}>
                    <button type="button" className="dm-tip">
                      <span className="dm-tip__no dm-cifry">{s.no}</span>
                      <span className="dm-tip__text">{s.text}</span>
                      <span className="dm-tip__primer">
                        {TIPY.primer}
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h2 className="dm-h2">{OSHIBKI.zagolovok}</h2>
            <div className="dm-oshibki">
              {OSHIBKI.punkty.map((p) => (
                <div key={p.zagolovok} className="dm-oshibka">
                  <p className="dm-oshibka__zagolovok">
                    <Tex text={p.zagolovok} />
                  </p>
                  <p className="dm-oshibka__text">
                    <Tex text={p.text} />
                  </p>
                </div>
              ))}
              {steklo ? null : <p className="dm-remarka">{OSHIBKI.remarka}</p>}
            </div>
          </div>
        </section>

        {/* ── Тренажёр ──────────────────────────────────────────── */}
        <section className="dm-sekciya" id="trenazher">
          <h2 className="dm-h2">{TRENAZHER.zagolovok}</h2>
          <div className="dm-panel dm-start">
            <ul className="dm-start__svodka">
              {TRENAZHER.svodka.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <button type="button" className="dm-btn dm-btn--primary dm-btn--lg dm-start__knopka">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
              {TRENAZHER.knopka}
            </button>
          </div>
        </section>

        {/* ── Шкала шрифтов ─────────────────────────────────────── */}
        <section className="dm-sekciya" id="shrifty">
          <h2 className="dm-h2">{SHRIFTY.zagolovok}</h2>
          <div className="dm-panel dm-shkala">
            {SHRIFTY.stupeni.map((s) => (
              <div key={s.id} className="dm-shkala__stroka">
                <span className="dm-shkala__imya">{s.imya}</span>
                <span className={`dm-obrazec dm-obrazec--${s.id}`}>{s.obrazec}</span>
              </div>
            ))}
            <div className="dm-shkala__stroka">
              <span className="dm-shkala__imya">Цифры</span>
              <span className="dm-obrazec dm-obrazec--cifry dm-cifry">{SHRIFTY.cifry}</span>
            </div>
            <div className="dm-shkala__stroka">
              <span className="dm-shkala__imya">Абзац</span>
              <p className="dm-obrazec dm-obrazec--body dm-abzac">
                <Tex text={SHRIFTY.abzac} />
              </p>
            </div>
          </div>
        </section>
      </main>

      <nav className="dm-tabbar" aria-label="Нижнее меню (демо)">
        {TABBAR.map((label, i) => (
          <a key={label} href="#top" className={i === 1 ? 'is-active' : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d={IKONKI_TABBARA[i]} />
            </svg>
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
