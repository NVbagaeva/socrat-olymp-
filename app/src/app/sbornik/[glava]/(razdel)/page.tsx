import type { Metadata } from 'next';
import Link from 'next/link';
import { SchyotTipa } from '@/components/sbornik/Progress';
import { TIPY, UROVNI, sbornikTitle } from '@/content/sbornik';
import { href, SBORNIK, SBORNIK_TAIL, tipSlug } from '@/lib/paths';
import { formulaHtml, zadachiTipa } from '@/lib/sbornik/bank';
import { nomerGlavy, staticGlavy } from '@/lib/sbornik/marshrut';
import { typeset } from '@/lib/tex';

export const dynamicParams = false;

export function generateStaticParams(): { glava: string }[] {
  return staticGlavy();
}

export async function generateMetadata({ params }: { params: Promise<{ glava: string }> }): Promise<Metadata> {
  const { glava } = await params;
  return { title: sbornikTitle('Задачи по типам', `Глава ${nomerGlavy(glava)}`) };
}

/** Вкладка «Задачи по типам»: карточки типов главы с прогрессом. */
export default async function ZadachiPoTipam({ params }: { params: Promise<{ glava: string }> }) {
  const { glava: slug } = await params;
  const n = nomerGlavy(slug);
  const tipy = TIPY[n] ?? [];
  return (
    <div className="sb-tipy-stranica">
      <div className="sb-vvodnaya">
        <p>
          Задачи главы разбиты по типам — по приёму решения. Внутри типа — три уровня:{' '}
          {UROVNI.map((u, i) => (
            <span key={u.id}>
              <b>{u.zvezdy}</b> {u.poyasnenie}
              {i < UROVNI.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
        <p>
          Не получилось — откройте подсказку: это вопрос к следующему шагу. Ошиблись — нажмите «Где
          я ошибся?» и сверьте своё решение с нашим по шагам.{' '}
          <Link href={href(SBORNIK, slug, SBORNIK_TAIL.trenazher, '?rezhim=oshibki')}>
            Работа над ошибками
          </Link>{' '}
          — в тренажёре.
        </p>
      </div>
      <ol className="sb-tipy">
        {tipy.map((t) => {
          const zadachi = zadachiTipa(t.id);
          const poUrovnyam = UROVNI.map((u) => zadachi.filter((z) => z.uroven === u.id).length);
          return (
            <li key={t.id}>
              <Link className="sb-tip stk-glass" href={href(SBORNIK, slug, tipSlug(t.id))}>
                <span className="sb-tip__znak" dangerouslySetInnerHTML={{ __html: formulaHtml(t.znak) }} />
                <span className="sb-tip__telo">
                  <span className="sb-tip__nomer">{t.id}</span>
                  <span className="sb-tip__nazvanie">{t.nazvanie}</span>
                  <span className="sb-tip__opisanie" dangerouslySetInnerHTML={{ __html: typeset(t.opisanie) }} />
                  <span className="sb-tip__urovni">
                    {UROVNI.map((u, i) =>
                      poUrovnyam[i] === 0 ? null : (
                        <span key={u.id} className="sb-tip__uroven">
                          {u.zvezdy} {poUrovnyam[i]}
                        </span>
                      ),
                    )}
                  </span>
                  <SchyotTipa tip={t.id} iz={zadachi.length} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
