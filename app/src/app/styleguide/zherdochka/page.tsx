import type { Metadata } from 'next';
import { Zherdochka, type VidZherdochki } from '@/components/landing/Zherdochka';
import './zherdochka-demo.css';

/* Служебная витрина: два варианта жёрдочки для попугайчика с главной.
   На главной стоит «Стекло» (HeroSection → Zherdochka, vid по умолчанию).
   Страница в меню не входит и не индексируется. */

export const metadata: Metadata = {
  title: 'Жёрдочка попугайчика — два варианта',
  robots: { index: false, follow: false },
};

const VARIANTY: { vid: VidZherdochki; nazvanie: string; opisanie: string }[] = [
  {
    vid: 'steklo',
    nazvanie: 'Вариант А · «Стекло»',
    opisanie:
      'Голубая стеклянная перекладина с бликом, синие шарики на концах и два тонких золотых колечка. Сейчас на главной.',
  },
  {
    vid: 'vetka',
    nazvanie: 'Вариант Б · «Веточка»',
    opisanie:
      'Светлая деревянная веточка с бликом и тремя полупрозрачными листиками в цвет попугайчика.',
  },
];

export default function Page() {
  return (
    <main className="zh-demo">
      <h1 className="zh-demo__h">Жёрдочка попугайчика</h1>
      <p className="zh-demo__p">
        Два варианта на выбор. Попугайчик живой: дышит, наклоняет голову, переступает, встряхивается
        и чистит пёрышки со случайными паузами; наведите мышь или коснитесь — клюнет.
      </p>
      <div className="zh-demo__ryad">
        {VARIANTY.map((v) => (
          <section key={v.vid} className="zh-demo__kartochka">
            <div className="zh-demo__scena">
              <span className="zh-demo__stroka">
                <Zherdochka vid={v.vid} podgon={false} />
              </span>
            </div>
            <h2 className="zh-demo__nazvanie">{v.nazvanie}</h2>
            <p className="zh-demo__opisanie">{v.opisanie}</p>
          </section>
        ))}
      </div>
      <h2 className="zh-demo__h2">В заголовке, в размер главной</h2>
      <div className="zh-demo__ryad">
        {VARIANTY.map((v) => (
          <p key={v.vid} className="zh-demo__zagolovok">
            от теории до{' '}
            <span className="zh-demo__nerazryv">
              тренажёра
              <Zherdochka vid={v.vid} podgon={false} />
            </span>
          </p>
        ))}
      </div>
    </main>
  );
}
