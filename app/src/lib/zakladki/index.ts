'use client';

/** Закладки «Отложить на потом» в localStorage (модель — ./model.ts). Одни на все разделы. */

import { createSyncedStore } from '@/lib/syncedStore';
import { EMPTY_BOOKMARKS, parseBookmarks } from './model';

export * from './model';

export const BOOKMARKS_KEY = 'budetege:zakladki:v1';

export const bookmarks = createSyncedStore(BOOKMARKS_KEY, parseBookmarks, EMPTY_BOOKMARKS);
