'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { OpornayaZadacha, type OpornyyIshod } from '../../opornye';
import { tekstyKarty45, tekstyOpornyh45 } from '@/content/veroyatnost45';
import { PodskazkaVoprosy } from '../../trening/PodskazkaVoprosy';
import { assetUrl } from '@/lib/assetUrl';
import { formatHint, fractionRightHint } from '@/lib/otvet';
import type { TaskOutcome } from '@/lib/progressStore';
import { scrollTabTo } from '@/lib/tabScroll';
import type { PrepPoolZadacha } from '@/lib/veroyatnost/pool';
import { prepItog, prepReshena, prepStore } from '@/lib/veroyatnost/prepProgress';
import { otkrytPodskazku, otkrytRazbor } from '@/lib/veroyatnost/razbor';
import { klyuchZadachi } from '@/lib/veroyatnost/secret';
import type { Zadanie45 } from '@/lib/veroyatnost/trening/links';
import { readSealed45 } from '@/lib/veroyatnost/trening/otvet45';
import { risunok45, shagi45, voprosy45 } from '../trening/shagi45';
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
}: {
  zadanie: Zadanie45;
  zadachi: PrepPoolZadacha[];
  zapomni: ReactNode;
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
    () => (z === undefined || checked === null ? null : otkrytRazbor(z.steps, z.seal)),
    [z, checked],
  );
  const voprosy = useMemo(
    () =>
      z?.podskazka === undefined || !hintOpen
        ? []
        : voprosy45(otkrytPodskazku(z.podskazka, z.seal)),
    [z, hintOpen],
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
      return;
    }
    if (reading.kind === 'fractionRight') {
      setFormat(fractionRightHint(reading.decimal));
      return;
    }
    setFormat(null);
    setVybrana(index);
    const ok = reading.right;
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
  const risunok =
    kartinka === undefined && zadacha.risunok === undefined ? undefined : (
      <>
        {kartinka === undefined ? null : (
          /* Картинка к условию — как есть: целиком, прозрачный фон. */
          <img
            className="z45-kartinka"
            src={assetUrl(kartinka.path)}
            alt={kartinka.alt}
            decoding="async"
          />
        )}
        {zadacha.risunok === undefined ? null : (
          /* Чертёж нарисован на сборке готовой разметкой (лабиринт №5). */
          <div className="z45-chertezh" dangerouslySetInnerHTML={{ __html: zadacha.risunok }} />
        )}
      </>
    );

  return (
    <OpornayaZadacha
      index={index}
      ishody={ishody}
      onOpen={open}
      uslovieHtml={zadacha.uslovie}
      {...(risunok === undefined ? {} : { risunok })}
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
                /* Подсказка учитывается так же, как открытое решение. */
                razborOtkryt();
              },
              telo: (
                <PodskazkaVoprosy
                  voprosy={voprosy}
                  otkryto={shag}
                  mimo={mimo}
                  onVerno={() => {
                    setShag(shag + 1);
                    setMimo([]);
                  }}
                  onMimo={(j) => setMimo([...mimo, j])}
                  labels={T.voprosy}
                />
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
