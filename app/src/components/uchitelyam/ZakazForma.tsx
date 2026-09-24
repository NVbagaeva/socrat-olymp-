'use client';

import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Button,
  Checkbox,
  ErrorState,
  FieldLabel,
  FieldMessage,
  Input,
  Radio,
  Select,
  SuccessState,
} from '@/components/ui';
import {
  CELI,
  LIMITY,
  OBRABOTCHIK,
  POCHTA_ZAKAZOV,
  sroki,
  stavki,
  uchitelyam,
  urovni,
} from '@/content/uchitelyam';
import { cel } from '@/lib/metrika';
import { otkrytoSnimok, poiskSnimok, useKlientskoe } from '@/lib/usluga/klient';
import {
  poschitat,
  prichinyBezSrochnosti,
  type Srochnost,
  type Uroven,
} from '@/lib/usluga/raschet';
import { itogStroka, rub } from './Kalkulyator';
import { useZakaz } from './ZakazProvider';

const { forma: t, oshibkiPoley: oe, uspeh, oshibka, kalkulyator: k } = uchitelyam;

type Oshibki = Partial<
  Record<'imya' | 'pochta' | 'istochnik' | 'ssylka' | 'fayly' | 'soglasiya' | 'kommentariy', string>
>;

type Sostoyanie =
  | { vid: 'forma' }
  | { vid: 'otpravka' }
  | { vid: 'uspeh'; id: string; pochta: string }
  | { vid: 'oshibka'; kod: string };

const POCHTA_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UTM = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

function rasshirenie(imya: string): string {
  const i = imya.lastIndexOf('.');
  return i === -1 ? '' : imya.slice(i + 1).toLowerCase();
}

/** Проверка в браузере — для удобства. Сервер проверяет всё заново (§9.4). */
function proverit(data: FormData, fayly: File[]): Oshibki {
  const o: Oshibki = {};
  const imya = String(data.get('imya') ?? '').trim();
  const pochta = String(data.get('pochta') ?? '').trim();
  const ssylka = String(data.get('ssylka') ?? '').trim();
  const kommentariy = String(data.get('kommentariy') ?? '');

  if (!imya || imya.length > LIMITY.imya) o.imya = oe.imya;
  if (!POCHTA_RE.test(pochta) || pochta.length > LIMITY.pochta) o.pochta = oe.pochta;
  if (ssylka && (!/^https:\/\//i.test(ssylka) || ssylka.length > LIMITY.ssylka))
    o.ssylka = oe.ssylka;
  if (kommentariy.length > LIMITY.kommentariy) o.kommentariy = oe.kommentariy;
  if (fayly.length === 0 && !ssylka) o.istochnik = oe.istochnik;

  if (fayly.length > LIMITY.faylov) {
    o.fayly = oe.faylovMnogo;
  } else {
    const plohoy = fayly.find((f) => !LIMITY.rasshireniya.includes(rasshirenie(f.name)));
    const pustoy = fayly.find((f) => f.size === 0);
    const ves = fayly.reduce((sum, f) => sum + f.size, 0);
    if (plohoy) o.fayly = oe.faylTip(plohoy.name);
    else if (pustoy) o.fayly = oe.faylPustoy(pustoy.name);
    else if (ves > LIMITY.baytVsego) o.fayly = oe.faylyVes;
  }

  if (data.get('soglasie_oferta') !== 'on' || data.get('soglasie_dannye') !== 'on') {
    o.soglasiya = oe.soglasiya;
  }
  return o;
}

/** Экран 12. Форма заказа. Без скриптов работает обычной отправкой формы. */
export function ZakazForma() {
  const { zakaz, izmenit, poschital, zagruzka } = useZakaz();
  const id = useId();
  const forma = useRef<HTMLFormElement>(null);
  const [fayly, setFayly] = useState<File[]>([]);
  const [oshibki, setOshibki] = useState<Oshibki>({});
  const [sost, setSost] = useState<Sostoyanie>({ vid: 'forma' });
  const otkryta = useKlientskoe(otkrytoSnimok, 0);
  const poisk = useKlientskoe(poiskSnimok, '');
  const r = poschitat(zakaz, stavki, sroki);
  const [itogo, srok] = itogStroka(r);
  const mesto = zagruzka?.srochnoeSvobodno ?? true;

  /* Отметка времени — ловушка для ботов (§9.4, шаг 3); метки
     источника — из адреса страницы, чтобы в письме было видно,
     откуда пришла заявка. */
  const utm = useMemo(() => {
    const q = new URLSearchParams(poisk);
    const found: Record<string, string> = {};
    UTM.forEach((key) => {
      const v = q.get(key);
      if (v && /^[A-Za-z0-9_-]{1,100}$/.test(v)) found[key] = v;
    });
    return found;
  }, [poisk]);

  const raschetText = [
    ...r.stroki.map((s) => `${s.chto} = ${rub(s.summa)}`),
    r.srochnost > 0 ? `${k.srochnostStroka} = ${rub(r.srochnost)}` : '',
    `${k.itogo}: ${itogo} · ${srok}`,
  ]
    .filter(Boolean)
    .join('\n');

  async function otpravit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const el = forma.current;
    if (!el) return;
    const data = new FormData(el);
    data.set('t', otkryta ? String(Math.max(0, Date.now() - otkryta)) : '');
    data.delete('fayly[]');
    fayly.forEach((f) => data.append('fayly[]', f, f.name));

    const o = proverit(data, fayly);
    setOshibki(o);
    if (Object.keys(o).length > 0) {
      const pervoe = el.querySelector<HTMLElement>('[aria-invalid="true"], .svc-form__err');
      pervoe?.focus();
      return;
    }

    cel(CELI.otpravka);
    setSost({ vid: 'otpravka' });
    try {
      const res = await fetch(OBRABOTCHIK, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      const json = (await res.json().catch(() => null)) as
        { ok: true; id: string } | { ok: false; code: string } | null;
      if (json && json.ok) {
        cel(CELI.uspeh);
        setSost({ vid: 'uspeh', id: json.id, pochta: String(data.get('pochta')) });
      } else {
        const kod = json && !json.ok ? json.code : 'send';
        cel(CELI.oshibka, { kod });
        setSost({ vid: 'oshibka', kod });
      }
    } catch {
      cel(CELI.oshibka, { kod: 'network' });
      setSost({ vid: 'oshibka', kod: 'network' });
    }
  }

  if (sost.vid === 'uspeh') {
    return (
      <div className="svc-form__done" tabIndex={-1} ref={(n) => n?.focus()}>
        <SuccessState
          title={uspeh.title}
          description={
            <>
              {uspeh.nomer(sost.id)} {uspeh.text(sost.pochta)}
              <br />
              <br />
              {uspeh.spam}
            </>
          }
        />
      </div>
    );
  }

  const srokVarianty: { id: Srochnost; label: string }[] = [
    { id: 'bazovyy', label: k.srokBazovyy },
    { id: '48', label: k.srok48 },
    { id: '24', label: k.srok24 },
  ];
  const kod = sost.vid === 'oshibka' ? (sost.kod.startsWith('field') ? 'field' : sost.kod) : '';

  return (
    <form
      ref={forma}
      className="svc-form"
      action={OBRABOTCHIK}
      method="post"
      encType="multipart/form-data"
      noValidate
      onSubmit={otpravit}
    >
      <p className="svc-form__raschet">{poschital ? t.raschet(itogo, srok) : t.raschetPusto}</p>

      <div className="svc-form__grid">
        <div className="field">
          <FieldLabel htmlFor={`${id}-imya`}>{t.imya}</FieldLabel>
          <Input
            id={`${id}-imya`}
            name="imya"
            autoComplete="name"
            maxLength={LIMITY.imya}
            required
            state={oshibki.imya ? 'error' : 'default'}
            aria-describedby={oshibki.imya ? `${id}-imya-e` : undefined}
          />
          {oshibki.imya ? (
            <FieldMessage tone="error" id={`${id}-imya-e`}>
              {oshibki.imya}
            </FieldMessage>
          ) : null}
        </div>

        <div className="field">
          <FieldLabel htmlFor={`${id}-pochta`}>{t.pochta}</FieldLabel>
          <Input
            id={`${id}-pochta`}
            name="pochta"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={LIMITY.pochta}
            required
            state={oshibki.pochta ? 'error' : 'default'}
            aria-describedby={`${id}-pochta-m`}
          />
          <FieldMessage tone={oshibki.pochta ? 'error' : 'neutral'} id={`${id}-pochta-m`}>
            {oshibki.pochta ?? t.pochtaPodskazka}
          </FieldMessage>
        </div>

        <div className="field">
          <FieldLabel htmlFor={`${id}-uroven`}>{t.paket}</FieldLabel>
          <Select
            id={`${id}-uroven`}
            name="uroven"
            value={zakaz.uroven}
            onChange={(e) => izmenit({ uroven: e.target.value as Uroven })}
          >
            {urovni.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nazvanie}
              </option>
            ))}
          </Select>
        </div>

        <div className="svc-form__pair">
          <div className="field">
            <FieldLabel htmlFor={`${id}-zadach`}>{t.zadach}</FieldLabel>
            <Input
              id={`${id}-zadach`}
              name="zadach"
              type="number"
              inputMode="numeric"
              min={1}
              max={300}
              value={zakaz.zadach}
              onChange={(e) => izmenit({ zadach: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <FieldLabel htmlFor={`${id}-var`}>{k.variantov}</FieldLabel>
            <Input
              id={`${id}-var`}
              name="variantov"
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              value={zakaz.variantov}
              disabled={zakaz.uroven === 'nabor'}
              onChange={(e) => izmenit({ variantov: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <fieldset className="svc-srok svc-srok--row">
        <legend className="field__label">{t.srok}</legend>
        {srokVarianty.map((s) => {
          const net = s.id !== 'bazovyy' && prichinyBezSrochnosti(zakaz, s.id, mesto).length > 0;
          return (
            <Radio
              key={s.id}
              name="srok"
              value={s.id}
              checked={zakaz.srochnost === s.id}
              disabled={net}
              onChange={() => izmenit({ srochnost: s.id })}
            >
              {s.label}
            </Radio>
          );
        })}
      </fieldset>

      <div className="field">
        <FieldLabel htmlFor={`${id}-fayly`}>{t.fayly}</FieldLabel>
        <input
          id={`${id}-fayly`}
          className="svc-file"
          type="file"
          name="fayly[]"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.docx"
          aria-describedby={`${id}-fayly-m`}
          aria-invalid={oshibki.fayly || oshibki.istochnik ? true : undefined}
          onChange={(e) => setFayly(Array.from(e.target.files ?? []))}
        />
        <FieldMessage
          tone={oshibki.fayly || oshibki.istochnik ? 'error' : 'neutral'}
          id={`${id}-fayly-m`}
        >
          {oshibki.fayly ?? oshibki.istochnik ?? t.faylyPodskazka}
        </FieldMessage>
        {fayly.length > 0 ? (
          <ul className="svc-file__list">
            {fayly.map((f) => (
              <li key={f.name + f.size}>
                {f.name} ·{' '}
                {(f.size / 1024 / 1024).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}
                &nbsp;МБ
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="field">
        <FieldLabel htmlFor={`${id}-ssylka`}>{t.ssylka}</FieldLabel>
        <Input
          id={`${id}-ssylka`}
          name="ssylka"
          type="url"
          inputMode="url"
          placeholder="https://"
          maxLength={LIMITY.ssylka}
          state={oshibki.ssylka ? 'error' : 'default'}
          aria-describedby={`${id}-ssylka-m`}
        />
        <FieldMessage tone={oshibki.ssylka ? 'error' : 'neutral'} id={`${id}-ssylka-m`}>
          {oshibki.ssylka ?? t.ssylkaPodskazka}
        </FieldMessage>
      </div>

      <div className="field">
        <FieldLabel htmlFor={`${id}-kom`}>{t.kommentariy}</FieldLabel>
        <textarea
          id={`${id}-kom`}
          className="input svc-textarea"
          name="kommentariy"
          rows={4}
          maxLength={LIMITY.kommentariy}
          aria-describedby={`${id}-kom-m`}
        />
        <FieldMessage tone={oshibki.kommentariy ? 'error' : 'neutral'} id={`${id}-kom-m`}>
          {oshibki.kommentariy ?? t.kommentariyPodskazka}
        </FieldMessage>
      </div>

      <div className="svc-form__soglasiya">
        <Checkbox name="soglasie_oferta" required>
          {t.oferta[0]}
          <a href="/uchitelyam/oferta/" target="_blank" rel="noopener">
            {t.oferta[1]}
          </a>
        </Checkbox>
        <Checkbox name="soglasie_dannye" required>
          {t.dannye[0]}
          <a href="/uchitelyam/soglasie/" target="_blank" rel="noopener">
            {t.dannye[1]}
          </a>
        </Checkbox>
        {oshibki.soglasiya ? (
          <p className="svc-form__err" role="alert" tabIndex={-1}>
            {oshibki.soglasiya}
          </p>
        ) : null}
        <p className="svc-form__bank">{t.bank}</p>
        <Checkbox name="bank_otkaz">{t.bankOtkaz}</Checkbox>
      </div>

      {/* Скрытые поля. «sayt» — ловушка: человек её не видит и не
          заполняет; бот заполняет, и заявка тихо отбрасывается. */}
      <div className="svc-lovushka" aria-hidden="true">
        <label>
          Сайт
          <input type="text" name="sayt" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      {/* Сколько миллисекунд форма была открыта — ставится при отправке.
          Без скриптов поле пустое, и сервер отмечает это в письме. */}
      <input type="hidden" name="t" value="" />
      <input type="hidden" name="rukopis" value={zakaz.rukopis ? '1' : '0'} />
      <input type="hidden" name="chertezhey" value={zakaz.slozhnyhChertezhey} />
      <input type="hidden" name="raschet" value={poschital ? raschetText : ''} />
      {UTM.map((key) =>
        utm[key] ? <input key={key} type="hidden" name={key} value={utm[key]} /> : null,
      )}
      {zakaz.uroven === 'nabor' ? <input type="hidden" name="variantov" value="1" /> : null}

      {sost.vid === 'oshibka' ? (
        <div className="svc-form__fail" role="alert">
          <ErrorState
            title={oshibka.title}
            description={
              <>
                {oshibka.prichiny[kod] ? (
                  <>
                    <b>{oshibka.prichiny[kod]}</b>{' '}
                  </>
                ) : null}
                {oshibka.text} {oshibka.pochta}{' '}
                <a href={`mailto:${POCHTA_ZAKAZOV}`}>{POCHTA_ZAKAZOV}</a> {oshibka.pochtaKonec}
              </>
            }
          />
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        loading={sost.vid === 'otpravka'}
        className="svc-form__submit"
      >
        {sost.vid === 'otpravka' ? t.otpravlyaetsya : t.otpravit}
      </Button>
      <p className="svc-form__pod">{t.podKnopkoy}</p>
    </form>
  );
}
