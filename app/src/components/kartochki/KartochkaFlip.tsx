'use client';

import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Badge, Button, Input } from '@/components/ui';
import { KARTOCHKI_UI as T } from '@/content/kartochkiUi';
import { parseAnswer } from '@/lib/answer';
import type { KartochkaGotovaya } from '@/lib/kartochki/podgotovka';
import { NEVERNO, VERNO, otpechatok } from '@/lib/kartochki/otvet';
import { SAMOOCENKA } from '@/lib/kartochki/tipy';

export interface KartochkaFlipProps {
  k: KartochkaGotovaya;
  /** Название подтемы (HTML с формулами). */
  tema: string;
  /** Какой из вариантов чертежа показать (повороты). */
  variant: number;
  /** Оценка: «Знаю» / «Не знаю» или итог автопроверки. */
  onOtvet: (znayu: boolean) => void;
  /**
   * Домашнее задание: ответ проверяет база (lib/dz/api → homework_check),
   * оборот приходит вместе с итогом. format — неверная запись, попытка
   * не тратится. Без этого — проверка по отпечатку в браузере.
   */
  proverka?: (
    vvod: string,
  ) => Promise<
    { prav: boolean; oborot: { back: string; pochemu?: string } } | { format: string } | null
  >;
  /** Домашнее задание: карточка уже пройдена — итог и оборот сразу. */
  gotovo?: { prav: boolean; vvod: string; oborot: { back: string; pochemu?: string } };
  /** Подписи кнопок самооценки вместо «Знаю / Не знаю» (ДЗ: «Знаю / Повторить»). */
  podpisi?: { znayu: string; neZnayu: string };
}

/** Свайп дальше этого — оценка, ближе — карточка возвращается. */
const SVAYP = 90;

/** Нажатие клавиши в поле ввода — не горячая клавиша карточки. */
function vPole(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return t !== null && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

/**
 * Карточка с переворотом. Типы «формула», «свойство» и «чертёж»
 * ученик оценивает сам; «верно / неверно» и «вычисление» проверяются
 * автоматически, оборот с обоснованием видно в обоих случаях.
 *
 * Перевернуть — нажать на карточку, кнопка или пробел; оценить —
 * кнопки, ← / → или свайп. Компонент живёт одну карточку: следующая
 * монтируется заново (key), состояние не переносится.
 */
export function KartochkaFlip({
  k,
  tema,
  variant,
  onOtvet,
  proverka,
  gotovo,
  podpisi,
}: KartochkaFlipProps) {
  const sama = SAMOOCENKA.includes(k.type);
  const [perevernuta, setPerevernuta] = useState(gotovo !== undefined);
  /* Итог автопроверки: верно ли и что ввёл ученик. */
  const [avto, setAvto] = useState<{ prav: boolean; vvod: string } | null>(
    gotovo === undefined ? null : { prav: gotovo.prav, vvod: gotovo.vvod },
  );
  /* ДЗ: оборот пришёл из базы вместе с итогом. */
  const [oborotDz, setOborotDz] = useState<{ back: string; pochemu?: string } | null>(
    gotovo?.oborot ?? null,
  );
  const [zhdem, setZhdem] = useState(false);
  const [formatDz, setFormatDz] = useState<string | null>(null);
  const [vvod, setVvod] = useState('');
  const [oshibkaVvoda, setOshibkaVvoda] = useState(false);
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; id: number } | null>(null);
  const oborot = useRef<HTMLDivElement>(null);
  const pole = useRef<HTMLInputElement>(null);

  /* Оборот: открытый текст, а у автопроверки — расшифрованный после ответа. */
  const tekstOborota = useMemo<{ back: string; pochemu?: string }>(
    () =>
      oborotDz !== null
        ? oborotDz
        : k.zakryto === undefined
          ? { back: k.back, ...(k.pochemu === undefined ? {} : { pochemu: k.pochemu }) }
          : (JSON.parse(otpechatok.openText(k.zakryto, k.id)) as {
              back: string;
              pochemu?: string;
            }),
    [k, oborotDz],
  );
  const oborotVidno =
    proverka !== undefined && !sama ? oborotDz !== null : k.zakryto === undefined || avto !== null;

  /** ДЗ: ответ — в базу; итог и оборот — из её ответа. */
  async function proveritVBaze(vvod: string, pokaz: string) {
    if (proverka === undefined || zhdem) return;
    setZhdem(true);
    setFormatDz(null);
    const itog = await proverka(vvod).catch(() => null);
    setZhdem(false);
    if (itog === null) return;
    if ('format' in itog) {
      setFormatDz(itog.format);
      return;
    }
    setOborotDz(itog.oborot);
    setAvto({ prav: itog.prav, vvod: pokaz });
    setPerevernuta(true);
  }

  const mozhnoOtsenit = sama && perevernuta;
  const otvecheno = avto !== null;

  function perevernut() {
    if (!sama) return;
    setPerevernuta((v) => !v);
  }

  function otvetitVerno(skazal: boolean) {
    if (otvecheno) return;
    if (proverka !== undefined) {
      void proveritVBaze(skazal ? VERNO : NEVERNO, skazal ? T.verno : T.neverno);
      return;
    }
    if (k.otpechatok === undefined) return;
    const prav = otpechatok.choiceMatches(skazal ? VERNO : NEVERNO, k.otpechatok);
    setAvto({ prav, vvod: skazal ? T.verno : T.neverno });
    setPerevernuta(true);
  }

  function proverit(e?: FormEvent) {
    e?.preventDefault();
    if (otvecheno) return;
    if (vvod.trim() === '' || (proverka === undefined && parseAnswer(vvod) === null)) {
      setOshibkaVvoda(true);
      pole.current?.focus();
      return;
    }
    if (proverka !== undefined) {
      void proveritVBaze(vvod, vvod.trim());
      return;
    }
    if (k.otpechatok === undefined) return;
    setAvto({ prav: otpechatok.answerMatches(vvod, k.otpechatok), vvod: vvod.trim() });
    setPerevernuta(true);
  }

  /* Фокус переезжает на видимую сторону: скринридер читает ответ. */
  useEffect(() => {
    if (perevernuta) oborot.current?.focus({ preventScroll: true });
  }, [perevernuta]);

  /* Поле вычисления — сразу в фокусе на компьютере; на телефоне
     клавиатура сама не выскакивает (фокус только по нажатию). */
  useEffect(() => {
    if (k.type === 'vychislenie' && window.matchMedia('(pointer: fine)').matches) {
      pole.current?.focus({ preventScroll: true });
    }
  }, [k.type]);

  /* Горячие клавиши: пробел — перевернуть, ← / → — оценить. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || vPole(e)) return;
      const t = e.target as HTMLElement | null;
      /* На кнопках и ссылках Enter и пробел — их собственное нажатие. */
      const naKnopke = t !== null && (t.tagName === 'BUTTON' || t.tagName === 'A');
      if (e.key === ' ' && !naKnopke) {
        if (!sama) return;
        e.preventDefault();
        perevernut();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const vpravo = e.key === 'ArrowRight';
        if (sama) {
          e.preventDefault();
          if (perevernuta) onOtvet(vpravo);
          else setPerevernuta(true);
        } else if (otvecheno) {
          e.preventDefault();
          onOtvet(avto.prav);
        } else if (k.type === 'verno') {
          e.preventDefault();
          otvetitVerno(vpravo);
        }
      } else if (e.key === 'Enter' && otvecheno && !naKnopke) {
        e.preventDefault();
        onOtvet(avto.prav);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* Свайп: только когда карточка перевёрнута и оценивается самим учеником. */
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!mozhnoOtsenit || (e.pointerType === 'mouse' && e.button !== 0)) return;
    start.current = { x: e.clientX, id: e.pointerId };
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const s = start.current;
    if (s === null || s.id !== e.pointerId) return;
    const d = e.clientX - s.x;
    if (Math.abs(d) > 8 && !e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDx(d);
  }
  function onPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    const s = start.current;
    if (s === null || s.id !== e.pointerId) return;
    start.current = null;
    const d = e.clientX - s.x;
    setDx(0);
    if (e.type === 'pointerup' && Math.abs(d) >= SVAYP) onOtvet(d > 0);
  }

  const figura = k.figury.length === 0 ? null : (k.figury[variant % k.figury.length] ?? null);
  const figHtml =
    figura === null ? null : (
      <div className="kart-card__fig" dangerouslySetInnerHTML={{ __html: figura }} />
    );
  /* Свой чертёж оборота (схема с буквами) — тот же вариант, что на лицевой. */
  const figuraOborota =
    k.figuryOborota === undefined || k.figuryOborota.length === 0
      ? null
      : (k.figuryOborota[variant % k.figuryOborota.length] ?? null);
  const figOborotaHtml =
    figuraOborota === null ? (
      figHtml
    ) : (
      <div className="kart-card__fig" dangerouslySetInnerHTML={{ __html: figuraOborota }} />
    );

  const shapka = (
    <div className="kart-card__meta">
      <span className="kart-card__tema" dangerouslySetInnerHTML={{ __html: tema }} />
      <span className="kart-card__tip">{T.tip[k.type]}</span>
      {k.level === 'важно для ЕГЭ' ? <Badge tone="warning">{T.vazhno}</Badge> : null}
    </div>
  );

  const vopros = <p className="kart-card__vopros" dangerouslySetInnerHTML={{ __html: k.front }} />;

  const naklon = dx === 0 ? undefined : { transform: `translateX(${dx}px) rotate(${dx / 24}deg)` };
  const kuda = dx >= SVAYP ? 'znayu' : dx <= -SVAYP ? 'ne' : null;

  return (
    <div className="kart-play">
      <div
        className={clsx(
          'kart-flip',
          perevernuta && 'is-flipped',
          dx !== 0 && 'is-dragging',
          kuda === 'znayu' && 'is-znayu',
          kuda === 'ne' && 'is-ne',
        )}
        style={naklon}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div className="kart-flip__inner">
          {/* Лицевая сторона. */}
          <div
            className="kart-card kart-card--front"
            inert={perevernuta}
            aria-hidden={perevernuta || undefined}
          >
            {shapka}
            {sama ? (
              <button
                type="button"
                className="kart-card__tap"
                onClick={perevernut}
                aria-label={T.pokazatOtvetAria}
              >
                {vopros}
                {k.figuraNaLitse ? figHtml : null}
                <span className="kart-card__hint">{T.nazhmite}</span>
              </button>
            ) : (
              <div className="kart-card__body">
                {vopros}
                {k.figuraNaLitse ? figHtml : null}
                {k.type === 'verno' ? (
                  <div className="kart-card__vybor">
                    <Button variant="secondary" onClick={() => otvetitVerno(false)}>
                      {T.neverno}
                    </Button>
                    <Button variant="secondary" onClick={() => otvetitVerno(true)}>
                      {T.verno}
                    </Button>
                  </div>
                ) : (
                  <form className="kart-card__forma" onSubmit={proverit} noValidate>
                    <label className="kart-card__pole">
                      <span className="t-label">{T.pole}</span>
                      <Input
                        ref={pole}
                        value={vvod}
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder={T.polePlaceholder}
                        state={oshibkaVvoda ? 'error' : 'default'}
                        onChange={(e) => {
                          setVvod(e.target.value);
                          setOshibkaVvoda(false);
                        }}
                      />
                    </label>
                    <Button type="submit" disabled={zhdem}>
                      {T.proverit}
                    </Button>
                    {formatDz === null ? null : (
                      <p className="field__msg" role="status">
                        {formatDz}
                      </p>
                    )}
                    {oshibkaVvoda ? (
                      <p className="field__msg field__msg--error" role="alert">
                        {T.pustoyOtvet}
                      </p>
                    ) : null}
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Оборот. */}
          <div
            ref={oborot}
            className="kart-card kart-card--back"
            inert={!perevernuta}
            aria-hidden={!perevernuta || undefined}
            tabIndex={-1}
            aria-label={T.naOborote}
          >
            {shapka}
            {avto === null ? null : (
              <p
                className={clsx('kart-card__itog', avto.prav ? 'is-prav' : 'is-neprav')}
                role="status"
              >
                <strong>{avto.prav ? T.rezultat.da : T.rezultat.net}</strong>
                <span>{T.rezultat.vashOtvet(avto.vvod)}</span>
              </p>
            )}
            {/* С автопроверкой текст оборота появляется только после ответа:
                в разметке его не было до этого. */}
            {oborotVidno ? (
              <>
                <div
                  className="kart-card__otvet"
                  dangerouslySetInnerHTML={{ __html: tekstOborota.back }}
                />
                {tekstOborota.pochemu === undefined ? null : (
                  <p className="kart-card__pochemu">
                    <span className="kart-card__pochemu-label">{T.pochemu}: </span>
                    <span dangerouslySetInnerHTML={{ __html: tekstOborota.pochemu }} />
                  </p>
                )}
              </>
            ) : null}
            {/* У «чертежа» тот же рисунок и на обороте: ответ читается по нему. */}
            {figOborotaHtml}
            <div className="kart-card__niz">
              {k.teoriya === undefined ? (
                <span className="kart-card__dobavleno">{T.dobavleno}</span>
              ) : (
                <a className="kart-card__teoriya" href={k.teoriya}>
                  {k.teoriyaNomer === undefined
                    ? T.povtoritTeoriyu
                    : T.povtoritTeoriyuNomera(k.teoriyaNomer)}{' '}
                  →
                </a>
              )}
              {sama ? (
                <button type="button" className="kart-card__nazad" onClick={perevernut}>
                  {T.perevernut}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="kart-actions">
        {sama ? (
          perevernuta ? (
            <>
              <Button
                variant="secondary"
                className="kart-actions__ne"
                onClick={() => onOtvet(false)}
              >
                <span aria-hidden="true">←</span> {podpisi?.neZnayu ?? T.neZnayu}
              </Button>
              <Button className="kart-actions__da" onClick={() => onOtvet(true)}>
                {podpisi?.znayu ?? T.znayu} <span aria-hidden="true">→</span>
              </Button>
            </>
          ) : (
            <Button variant="secondary" fullWidth onClick={perevernut}>
              {T.pokazatOtvet}
            </Button>
          )
        ) : otvecheno ? (
          <Button fullWidth onClick={() => onOtvet(avto.prav)}>
            {T.dalshe} <span aria-hidden="true">→</span>
          </Button>
        ) : null}
      </div>
      {mozhnoOtsenit ? <p className="kart-play__svayp">{T.svaypPodskazka}</p> : null}
    </div>
  );
}
