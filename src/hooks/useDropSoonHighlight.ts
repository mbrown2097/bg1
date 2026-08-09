import { useEffect, useState } from 'react';

import { Experience } from '@/api/ll';
import { dropBeep } from '@/beep';
import { DateTime, upcomingTimes } from '@/datetime';

const DROP_ALERT_MINUTES = 5;
const CHECK_MS = 5_000;

export default function useDropSoonHighlight(experiences: Experience[]) {
  const [dropSoon, setDropSoon] = useState<Set<string>>(new Set());

  useEffect(() => {
    const check = () => {
      const now = +DateTime.now().time;
      const ids = new Set<string>();
      for (const exp of experiences) {
        const nextDrop = upcomingTimes(exp.dropTimes ?? [])[0];
        if (!nextDrop) continue;
        const minutesUntil = (+nextDrop - now) / 60;
        if (minutesUntil <= DROP_ALERT_MINUTES) ids.add(exp.id);
      }
      setDropSoon(ids);
      if (ids.size > 0) dropBeep();
    };
    check();
    const id = setInterval(check, CHECK_MS);
    return () => clearInterval(id);
  }, [experiences]);

  return dropSoon;
}
