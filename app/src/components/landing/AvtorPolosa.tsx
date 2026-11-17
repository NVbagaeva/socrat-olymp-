import { AvtorPlashka } from '@/components/avtor/AvtorPlashka';

/**
 * Плашка автора отдельной узкой полосой между блоками главной. Без
 * заголовка и без нового текста: фото, имя и одна строка — ссылкой на
 * «Об авторе». Ниже первого экрана, поэтому фото грузится лениво.
 */
export function AvtorPolosa() {
  return (
    <section className="avtor-polosa" aria-label="Автор сайта">
      <div className="wrap">
        <AvtorPlashka className="avtor-pl--krupno" />
      </div>
    </section>
  );
}
