'use client';

import { useEffect, useState } from 'react';
import { listWorks, onArchiveChange, type ArchivedWork } from '@/lib/variant/online/archive';

/** Завершённые работы с этого устройства. null — ещё читаются. */
export function useArchive(): ArchivedWork[] | null {
  const [works, setWorks] = useState<ArchivedWork[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => {
      void listWorks().then((rows) => {
        if (alive) setWorks(rows);
      });
    };
    load();
    const off = onArchiveChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return works;
}
