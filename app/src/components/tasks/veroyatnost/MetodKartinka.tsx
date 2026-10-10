import clsx from 'clsx';
import type { Zadanie } from '@/content/veroyatnost';
import { assetUrl } from '@/lib/assetUrl';
import { MetodIkonka } from './MetodIkonka';

/**
 * Объёмные иллюстрации методов — для крупных карточек тренажёра и
 * списка методов в генераторе №5.
 *
 * №4: у шести методов взяты 3D-иллюстрации, которые уже есть у
 * задания (превью опорных задач и сюжеты генератора), — ваза с шарами,
 * две кости, монета, стол со стульями, отрезок, партия насосов; у
 * «Противоположных событий» — своя (шар из двух половинок). №5: у
 * каждого из десяти методов своя стеклянная иллюстрация.
 *
 * Файлы 192×192 WebP (вдвое больше места на карточке — для экранов
 * высокой плотности) в public/images/veroyatnost-N/metody/, имя — id
 * метода; исходники PNG — в assets/img/veroyatnost-N/. Метода нет в
 * списке — у него остаётся линейный значок (MetodIkonka). Адреса
 * сразу с версией (assetUrl): таблица уходит в клиентский код, и
 * обновлённый файл не застрянет в кеше браузера.
 */
const KARTINKI: Record<Zadanie, Partial<Record<string, string>>> = {
  4: {
    klassicheskaya: assetUrl('/images/veroyatnost-4/metody/klassicheskaya.webp'),
    kubiki: assetUrl('/images/veroyatnost-4/metody/kubiki.webp'),
    monety: assetUrl('/images/veroyatnost-4/metody/monety.webp'),
    'kruglyy-stol': assetUrl('/images/veroyatnost-4/metody/kruglyy-stol.webp'),
    protivopolozhnye: assetUrl('/images/veroyatnost-4/metody/protivopolozhnye.webp'),
    geometricheskoe: assetUrl('/images/veroyatnost-4/metody/geometricheskoe.webp'),
    statisticheskoe: assetUrl('/images/veroyatnost-4/metody/statisticheskoe.webp'),
  },
  5: {
    nesovmestnye: assetUrl('/images/veroyatnost-5/metody/nesovmestnye.webp'),
    protivopolozhnoe: assetUrl('/images/veroyatnost-5/metody/protivopolozhnoe.webp'),
    koordinatnaya: assetUrl('/images/veroyatnost-5/metody/koordinatnaya.webp'),
    sovmestnye: assetUrl('/images/veroyatnost-5/metody/sovmestnye.webp'),
    uslovnaya: assetUrl('/images/veroyatnost-5/metody/uslovnaya.webp'),
    nezavisimye: assetUrl('/images/veroyatnost-5/metody/nezavisimye.webp'),
    'hotya-by': assetUrl('/images/veroyatnost-5/metody/hotya-by.webp'),
    'dva-predmeta': assetUrl('/images/veroyatnost-5/metody/dva-predmeta.webp'),
    polnaya: assetUrl('/images/veroyatnost-5/metody/polnaya.webp'),
    'do-uspeha': assetUrl('/images/veroyatnost-5/metody/do-uspeha.webp'),
  },
};

/** Сторона картинки на карточке в CSS-пикселях; файл вдвое больше. */
const RAZMER = 96;

export interface MetodKartinkaProps {
  zadanie: Zadanie;
  metod: string;
  /** Название метода — подпись картинки. */
  nazvanie: string;
  className?: string;
}

/** Иллюстрация метода, а если её нет — значок метода. */
export function MetodKartinka({ zadanie, metod, nazvanie, className }: MetodKartinkaProps) {
  const src = KARTINKI[zadanie][metod];
  if (src === undefined) {
    return <MetodIkonka zadanie={zadanie} metod={metod} className={className} />;
  }
  return (
    <img
      className={clsx('metod-kartinka', className)}
      src={src}
      alt={nazvanie}
      width={RAZMER}
      height={RAZMER}
      loading="lazy"
      decoding="async"
    />
  );
}
