import Link from 'next/link';
import {
  analysisParams,
  builtSubtopicParams,
  findAnalysis,
  findSubtopic,
  prepSubtopicParams,
  trainerSubtopicParams,
} from '@/content/sections';
import { OPORNYE_18 } from '@/content/zadanie18/opornye';
import { SOBRANNYE } from '@/content/zadanie18/spisok';
import { href } from '@/lib/paths';
import { findPrepSkill, prepSkillIds } from '@/lib/prep';
import { tekstBezTex } from '@/lib/tekstFormul';
import type { SsylkaBloka } from './OpisanieTrenazhera';
import './opisanie.css';

interface Gruppa {
  title: string;
  ssylki: SsylkaBloka[];
}

/**
 * «Всё в разделе»: обычные ссылки на вкладки и вложенные страницы в
 * конце страницы раздела. Вкладки подразделов №12 переключаются без
 * перехода, и опорные задачи, разборы, тетрадь и работа над ошибками
 * были в 4–5 кликах от главной; список кладёт их в три клика и делает
 * видимыми без JavaScript.
 */
function Spisok({ id, title, gruppy }: { id: string; title: string; gruppy: Gruppa[] }) {
  return (
    <nav className="opisanie" aria-labelledby={id}>
      <h2 id={id} className="t-h3 opisanie__title">
        {title}
      </h2>
      {gruppy
        .filter((g) => g.ssylki.length > 0)
        .map((g) => (
          <div key={g.title} className="opisanie__nav">
            <h3 className="t-h4">{g.title}</h3>
            <ul className="opisanie__links">
              {g.ssylki.map((s) => (
                <li key={s.href}>
                  <Link href={s.href}>{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </nav>
  );
}

const est = (list: { type: string }[], type: string) => list.some((p) => p.type === type);

/** Подраздел №12 (тип функции): вкладки, опорные задачи, разборы. */
export function VsyoPodrazdela12({ type }: { type: string }) {
  const sub = findSubtopic('12', type);
  if (sub === undefined) return null;
  const base = `/zadaniya/12/${type}`;
  const vkladki: SsylkaBloka[] = [];
  if (est(prepSubtopicParams(), type))
    vkladki.push({ href: href(base, 'opornye-zadachi'), label: 'Опорные задачи' });
  if (est(trainerSubtopicParams(), type))
    vkladki.push({ href: href(base, 'trenazher'), label: 'Тренажёр' });
  if (est(builtSubtopicParams(), type)) {
    vkladki.push(
      { href: href(base, 'dlya-repetitorov'), label: 'Для репетиторов' },
      { href: href(base, 'tetrad'), label: 'Интерактивная тетрадь' },
      { href: href(base, 'oshibki'), label: 'Работа над ошибками' },
    );
  }
  const opornye = est(prepSubtopicParams(), type)
    ? prepSkillIds(type).flatMap((id) => {
        const s = findPrepSkill(type, id);
        return s === undefined
          ? []
          : [{ href: href(base, 'opornye-zadachi', id), label: tekstBezTex(s.title) }];
      })
    : [];
  const razbory = analysisParams()
    .filter((p) => p.task === '12' && p.type === type)
    .flatMap((p) => {
      const f = findAnalysis('12', type, p.id);
      return f === undefined
        ? []
        : [{ href: href(base, 'razbor', p.id), label: tekstBezTex(f.title) }];
    });
  return (
    <Spisok
      id="vsyo-12"
      title={`Всё по теме «${sub.title}»`}
      gruppy={[
        { title: 'Вкладки темы', ssylki: vkladki },
        { title: 'Опорные задачи', ssylki: opornye },
        { title: 'Разобранные примеры', ssylki: razbory },
      ]}
    />
  );
}

/** Задание №18: ключевые схемы и опорные задачи. */
export function VsyoZadaniya18() {
  return (
    <Spisok
      id="vsyo-18"
      title="Всё в разделе"
      gruppy={[
        {
          title: 'Ключевые схемы',
          ssylki: SOBRANNYE.map((s) => ({
            href: href('/zadaniya/18/skhemy', s.id),
            label: tekstBezTex(s.nazvanie),
          })),
        },
        {
          title: 'Опорные задачи',
          ssylki: OPORNYE_18.map((z) => ({
            href: href('/zadaniya/18/opornye-zadachi', z.id),
            label: tekstBezTex(z.nazvanie),
          })),
        },
      ]}
    />
  );
}
