'use client';

import { useMemo } from 'react';
import { Generator } from '@/components/generator/Generator';
import { ikonkiTem } from '@/components/generator/IkonkiTem';
import { FLAG_KARTINOK } from '@/lib/kartinkiZadach';
import type { GenConfig, GenEngine } from '@/lib/generator/obshchiy/types';
import { config11, engine11, paramsIzSostoyaniya } from '@/lib/zadanie11/generator11';
import {
  FLAG_KARTINKI_11,
  PARAM_KARTINKI,
  kartinkiNaListe,
  kartinkiPozicij,
  kartinkiVklyucheny,
  sKartinkami,
  sheetSKartinkami,
} from '@/lib/zadanie11/kartinkiLista';
import { sobratList } from '@/lib/zadanie11/sheet11';
import type { RazdelInfo, UslovieBanka } from '@/lib/zadanie11/trenazher/sessiya';

/**
 * «Картинки к задачам» поверх движка №11: переключатель в «Дополнительно»
 * (общий механизм flagi), адреса листов с ki=1, предпросмотр с
 * картинками. Сам движок (generator11.ts, sheet11.ts) не меняется —
 * lib/zadanie11/kartinkiLista.ts.
 */
function sKartinkamiConfig(config: GenConfig): GenConfig {
  const extras = config.extras ?? { kinds: [] };
  return {
    ...config,
    extras: {
      ...extras,
      flagi: [...(extras.flagi ?? []), { id: FLAG_KARTINKI_11, ...FLAG_KARTINOK }],
    },
  };
}

function sKartinkamiEngine(engine: GenEngine, config: GenConfig, bank: UslovieBanka[]): GenEngine {
  return {
    ...engine,
    build: async (state) => {
      const sheet = await engine.build(state);
      if (!kartinkiVklyucheny(state.extras)) return sheet;
      const p = paramsIzSostoyaniya(state, config);
      if (!kartinkiNaListe(p)) return sheet;
      return sheetSKartinkami(sheet, kartinkiPozicij(sobratList(p, bank), bank));
    },
    hrefs: (state) => {
      const h = engine.hrefs(state);
      const on = kartinkiVklyucheny(state.extras);
      return {
        ...h,
        student: sKartinkami(h.student, on),
        teacher: sKartinkami(h.teacher, on),
        all: sKartinkami(h.all, on),
        link: sKartinkami(h.link, on),
      };
    },
    parse: (query) => {
      const state = engine.parse(query);
      if (state === null || query.get(PARAM_KARTINKI) !== '1') return state;
      const flagi = [...(state.extras.flagi ?? []), FLAG_KARTINKI_11];
      return { ...state, extras: { ...state.extras, flagi } };
    },
  };
}

/**
 * Вкладка «Генератор» задания №11: общий генератор (components/generator/)
 * с конфигом и движком №11 (lib/zadanie11/generator11.ts). Разделы и
 * условия банка без ответов собираются на сборке, лист — в браузере.
 */
export function Generator11({
  razdely,
  bank,
  base,
}: {
  razdely: RazdelInfo[];
  bank: UslovieBanka[];
  base: string;
}) {
  const config = useMemo(() => sKartinkamiConfig(config11(razdely, base)), [razdely, base]);
  const engine = useMemo(
    () => sKartinkamiEngine(engine11(config, razdely, bank, base), config, bank),
    [config, razdely, bank, base],
  );
  /* Значки тем — рисунки в стеклянном круге, как у тел №3. */
  const icons = useMemo(() => ikonkiTem('11', config.topics), [config]);
  return <Generator config={config} engine={engine} icons={icons} />;
}
