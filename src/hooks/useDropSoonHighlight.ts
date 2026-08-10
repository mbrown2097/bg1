import { useEffect, useState } from 'react';

import { Experience } from '@/api/ll';
import { dropBeep } from '@/beep';
import { DateTime, ParkTime, upcomingTimes } from '@/datetime';

const DROP_ALERT_MINUTES = 5;
const CHECK_MS = 5_000;

// Community-observed, Disney-unconfirmed park-wide drop times (the "Big
// Three": ~9:32am, ~12:00pm, ~1:02pm) reported by guests in 2026. These
// don't line up with bg1's own hardcoded per-ride dropTimes data, and
// neither source is authoritative — layering both rather than trusting
// either alone. Sorted ascending, required by upcomingTimes().
export const PARK_WIDE_DROP_TIMES = ['09:32', '12:00', '13:02'].map(
  ParkTime.from
);

export default function useDropSoonHighlight(experiences: Experience[]) {
  const [dropSoon, setDropSoon] = useState<Set<string>>(new Set());

  useEffect(() => {
    const check = () => {
      const now = +DateTime.now().time;
      const ids = new Set<string>();

      const nextParkWideDrop = upcomingTimes(PARK_WIDE_DROP_TIMES)[0];
      const parkWideSoon =
        !!nextParkWideDrop &&
        (+nextParkWideDrop - now) / 60 <= DROP_ALERT_MINUTES;

      for (const exp of experiences) {
        if (parkWideSoon) {
          ids.add(exp.id);
          continue;
        }
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
