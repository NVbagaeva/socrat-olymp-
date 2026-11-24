'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { OpornayaZadacha, type OpornyyIshod } from '../../opornye';
import { tekstyKarty45, tekstyOpornyh45 } from '@/content/veroyatnost45';
import { zhurnal45 } from '@/lib/veroyatnost/trening/zhurnal45';
import { useZapisZadachi } from '@/lib/zhurnal/zapis';
import { PodskazkaVoprosy } from '../../trening/PodskazkaVoprosy';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import type { TaskOutcome } from '@/lib/progressStore';
import { scrollTabTo } from '@/lib/tabScroll';
import type { PrepPoolZadacha } from '@/lib/veroyatnost/pool';
import { prepItog, prepReshena, prepStore } from '@/lib/veroyatnost/prepProgress';
import { otkrytPodskazku, otkrytRazbor } from '@/lib/veroyatnost/razbor';
import { klyuchZadachi } from '@/lib/veroyatnost/secret';
import type { Zadanie45 } from '@/lib/veroyatnost/trening/links';
import { readSealed45 } from '@/lib/veroyatnost/trening/otvet45';
import { DerevoPodskazki, risunok45, shagi45, voprosy45 } from '../trening/shagi45';
import '../../trening/trening.css';
import '../trening/trening45.css';

/**
 * Экран блока опорных задач №4 и №5 на общем экране блока
 * (components/tasks/opornye): плашка «Запомни» с картинкой блока,
 * задача с картинкой к условию — как есть, поле ответа бланка ЕГЭ,
 * подсказка-вопросы, решение по шагам с рисунком метода, точки-номера.
 *
 * Прогресс — прежнее хранилище подготовки (lib/veroyatnost/prepProgress):
 * исход каждой задачи (верно, неверно, разобрано) переживает перезагрузку.
 * Подсказка и открытое решение учитываются как раньше — как разбор.
 */
export function Opornye45Blok({
  zadanie,
  zadachi,
  zapomni,
  blok,
}: {
  zadanie: Zadanie45;
  zadachi: PrepPoolZadacha[];
  zapomni: ReactNode;
  /** Блок опорных задач (адрес страницы): для журнала решения задач. */
  blok?: string;
}) {
  /* Подписи с функциями — здесь, в браузере: с сервера их не передать. */
  const T = tekstyOpornyh45('');
  const labels = T.zadacha;
  const store = prepStore(zadanie);
  const progress = store.useProgress();
  const [vybrana, setVybrana] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<'right' | 'wrong' | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [shag, setShag] = useState(1);
  const [mimo, setMimo] = useState<number[]>([]);
  const [format, setFormat] = useState<string | null>(null);

  /* Открывается первая нерешённая задача: ученик продолжает, а не
     перерешивает сделанное. Решены все — первая. */
  const pervaya = zadachi.findIndex((z) => !prepReshena(progress, z.id));
  const index = vybrana ?? (pervaya === -1 ? 0 : pervaya);
  const z = zadachi[index];

  const razbor = useMemo(
    /* Разбор нужен и подсказке: из него дерево, которое растёт по шагам. */
    () =>
      z === undefined || (checked === null && !hintOpen) ? null : otkrytRazbor(z.steps, z.seal),
    [z, checked, hintOpen],
  );
  const voprosy = useMemo(
    () =>
      z?.podskazka === undefined || !hintOpen
        ? []
        : voprosy45(otkrytPodskazku(z.podskazka, z.seal)),
    [z, hintOpen],
  );
  /* Журнал решения задач (lib/zhurnal): ученику, который вошёл, при флаге. */
  const zapis = useZapisZadachi(
    z === undefined
      ? null
      : zhurnal45(zadanie, { ...z, kind: blok ?? z.id }, 'opornye', blok ?? 'opornye', z.id),
  );
  if (z === undefined) {
    return null;
  }
  const zadacha: PrepPoolZadacha = z;

  const ishody: OpornyyIshod[] = zadachi.map((x) => {
    const it = prepItog(progress, x.id);
    return it === 'right' ? 'right' : it === null ? null : 'wrong';
  });

  function zapisat(right: boolean, clean: boolean, itog: TaskOutcome) {
    store.recordAttempt({ kind: zadacha.id, taskId: zadacha.id, right, clean, seconds: 0, itog });
  }

  function open(next: number) {
    if (next < 0 || next >= zadachi.length) return;
    /* Ушёл на другую задачу после ошибки — задача закрыта ошибкой. */
    if (checked === 'wrong') zapis?.zakryt(false);
    setVybrana(next);
    setValue('');
    setChecked(null);
    setHintOpen(false);
    setSolutionOpen(false);
    setShag(1);
    setMimo([]);
    setFormat(null);
    scrollTabTo('.op-zad');
  }

  function check() {
    if (value.trim() === '') return;
    const reading = readSealed45(value, zadacha.seal, klyuchZadachi(zadacha.id));
    if (reading.kind === 'format') {
      setFormat(formatHint(reading.problem, reading.meant));
      zapis?.popytka(value, false, 'format');
      return;
    }
    if (reading.kind === 'fractionRight') {
      setFormat(fractionRightHint(reading.decimal));
      zapis?.popytka(value, false, 'fraction');
      return;
    }
    setFormat(null);
    setVybrana(index);
    const ok = reading.right;
    zapis?.popytka(value, ok);
    if (ok) zapis?.zakryt(true);
    setChecked(ok ? 'right' : 'wrong');
    /* Начисто — если до верного ответа задачу не открывали и не ошибались. */
    zapisat(ok, ok && prepItog(progress, zadacha.id) === null && !hintOpen, ok ? 'right' : 'wrong');
  }

  function razborOtkryt() {
    setVybrana(index);
    /* Решённую задачу разбор не понижает: ученик перечитывает своё. */
    if (!prepReshena(progress, zadacha.id)) {
      zapisat(false, false, 'revealed');
    }
  }

  const kartinka = zadacha.illustration ?? zadacha.model?.illustration;
  /* Чертёж нарисован на сборке готовой разметкой (лабиринт №5): под
     условием, как был. Картинка сюжета — справа от условия. */
  const risunok =
    zadacha.risunok === undefined ? undefined : (
      <div className="z45-chertezh" dangerouslySetInnerHTML={{ __html: zadacha.risunok }} />
    );

  return (
    <OpornayaZadacha
      index={index}
      ishody={ishody}
      onOpen={open}
      uslovieHtml={zadacha.uslovie}
      {...(risunok === undefined ? {} : { risunok })}
      {...(kartinka === undefined
        ? {}
        : {
            kartinka: {
              src: kartinka.path,
              ...(kartinka.path280 === undefined ? {} : { src280: kartinka.path280 }),
              alt: kartinka.alt,
            },
          })}
      value={value}
      onValue={(next) => {
        setValue(next);
        setFormat(null);
        if (checked === 'wrong') setChecked(null);
      }}
      checked={checked}
      onCheck={check}
      formatHint={format}
      podskazka={
        zadacha.podskazka === undefined
          ? null
          : {
              html: '',
              open: hintOpen,
              onOpen: () => {
                setHintOpen(true);
                zapis?.shagPodskazki(1);
                /* Подсказка учитывается так же, как открытое решение. */
                razborOtkryt();
              },
              telo: (
                <>
                  <PodskazkaVoprosy
                    voprosy={voprosy}
                    otkryto={shag}
                    mimo={mimo}
                    onVerno={() => {
                      setShag(shag + 1);
                      setMimo([]);
                      zapis?.shagPodskazki(shag + 1);
                    }}
                    onMimo={(j) => {
                      setMimo([...mimo, j]);
                      zapis?.oshibkaPodskazki(shag);
                    }}
                    labels={T.voprosy}
                  />
                  <DerevoPodskazki
                    razbor={razbor}
                    otvecheno={shag - 1}
                    voprosov={voprosy.length}
                    labels={T.derevo}
                  />
                </>
              ),
            }
      }
      /* Решение — после ответа: до проверки доступна только подсказка. */
      reshenie={
        checked === null || razbor === null
          ? null
          : {
              shagi: shagi45(razbor),
              posle: (
                <>
                  {razbor.metod === '' ? null : (
                    <p className="z45-metod">
                      <b>{tekstyKarty45.metod}:</b> {razbor.metod}
                    </p>
                  )}
                  {risunok45(razbor, checked === 'right', T.risunok)}
                </>
              ),
              open: solutionOpen,
              onToggle: () => {
                if (!solutionOpen) zapis?.reshenie();
                if (!solutionOpen && checked !== 'right') razborOtkryt();
                setSolutionOpen(!solutionOpen);
              },
            }
      }
      zapomni={zapomni}
      labels={labels}
    />
  );
}
