import { use, useEffect, useState } from 'react';

import beep, { unlockBeep } from '@/beep';
import ExperiencesContext from '@/contexts/ExperiencesContext';
import PlansContext from '@/contexts/PlansContext';
import { DateTime } from '@/datetime';
import kvdb from '@/kvdb';

import { STARRED_KEY } from './MultiPassList';

const REFRESH_SEC_KEY = 'bg1.alertSettings.refreshSec';
const ALERT_MIN_KEY = 'bg1.alertSettings.alertMin';
const ALERT_CHECK_MS = 5_000;

export default function AlertSettings() {
  const { experiences, refreshExperiences } = use(ExperiencesContext);
  const { refreshPlans } = use(PlansContext);
  const [refreshSec, setRefreshSec] = useState(
    () => kvdb.get<number>(REFRESH_SEC_KEY) ?? 0
  );
  const [alertMin, setAlertMin] = useState(
    () => kvdb.get<number>(ALERT_MIN_KEY) ?? 0
  );
  useEffect(() => {
    kvdb.set(REFRESH_SEC_KEY, refreshSec);
  }, [refreshSec]);

  useEffect(() => {
    kvdb.set(ALERT_MIN_KEY, alertMin);
  }, [alertMin]);

  useEffect(() => {
    if (!refreshSec) return;
    const id = setInterval(() => {
      refreshExperiences(0);
      refreshPlans(0);
    }, refreshSec * 1000);
    return () => clearInterval(id);
  }, [refreshSec, refreshExperiences, refreshPlans]);

  useEffect(() => {
    if (!alertMin) return;
    const check = () => {
      const starredIds = new Set(kvdb.get<string[]>(STARRED_KEY) ?? []);
      if (starredIds.size === 0) return;
      const now = +DateTime.now().time;
      const dueSoon = experiences.some(exp => {
        if (!starredIds.has(exp.id)) return false;
        const nextAvailableTime = exp.flex?.nextAvailableTime;
        if (!nextAvailableTime) return false;
        const minutesUntil = (+nextAvailableTime - now) / 60;
        return minutesUntil >= 0 && minutesUntil <= alertMin;
      });
      if (dueSoon) beep();
    };
    check();
    const id = setInterval(check, ALERT_CHECK_MS);
    return () => clearInterval(id);
  }, [alertMin, experiences]);

  return (
    <div className="flex justify-center gap-x-6 py-1 text-sm">
      <label className="flex items-center gap-x-1.5">
        Refresh
        <input
          type="number"
          inputMode="numeric"
          min={0}
          className="w-14 rounded-sm px-1 py-0.5 text-black"
          value={refreshSec || ''}
          placeholder="off"
          onFocus={unlockBeep}
          onChange={e => setRefreshSec(Math.max(0, +e.target.value || 0))}
        />
        sec
      </label>
      <label className="flex items-center gap-x-1.5">
        Alert
        <input
          type="number"
          inputMode="numeric"
          min={0}
          className="w-14 rounded-sm px-1 py-0.5 text-black"
          value={alertMin || ''}
          placeholder="off"
          onFocus={unlockBeep}
          onChange={e => setAlertMin(Math.max(0, +e.target.value || 0))}
        />
        min
      </label>
    </div>
  );
}
