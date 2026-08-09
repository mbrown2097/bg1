import { useEffect, useState } from 'react';

import { Experience } from '@/api/ll';
import { DateTime } from '@/datetime';
import kvdb from '@/kvdb';

// Kept as literals (not imported) to avoid a circular import between
// MultiPassList.tsx and AlertSettings.tsx — must match STARRED_KEY in
// MultiPassList.tsx and ALERT_MIN_KEY in AlertSettings.tsx.
const STARRED_KEY = 'bg1.genie.tipBoard.starred';
const ALERT_MIN_KEY = 'bg1.alertSettings.alertMin';
const CHECK_MS = 5_000;

export default function useDueSoonHighlight(experiences: Experience[]) {
  const [dueSoon, setDueSoon] = useState<Set<string>>(new Set());

  useEffect(() => {
    const check = () => {
      const alertMin = kvdb.get<number>(ALERT_MIN_KEY) ?? 0;
      if (!alertMin) {
        setDueSoon(new Set());
        return;
      }
      const starredIds = new Set(kvdb.get<string[]>(STARRED_KEY) ?? []);
      const now = +DateTime.now().time;
      const ids = new Set<string>();
      for (const exp of experiences) {
        if (!starredIds.has(exp.id)) continue;
        const nextAvailableTime = exp.flex?.nextAvailableTime;
        if (!nextAvailableTime) continue;
        const minutesUntil = (+nextAvailableTime - now) / 60;
        if (minutesUntil >= 0 && minutesUntil <= alertMin) ids.add(exp.id);
      }
      setDueSoon(ids);
    };
    check();
    const id = setInterval(check, CHECK_MS);
    return () => clearInterval(id);
  }, [experiences]);

  return dueSoon;
}
