import { useEffect, useRef, useState } from 'react';

import { Experience } from '@/api/ll';

const HIGHLIGHT_MS = 15 * 60 * 1000;

export default function useBackUpHighlight(experiences: Experience[]) {
  const prevDownRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prevDown = prevDownRef.current;
    const nowDown = new Set<string>();
    const justBackUp: string[] = [];

    for (const exp of experiences) {
      const { standby } = exp;
      if (!standby) continue;
      if (!standby.available) {
        nowDown.add(exp.id);
      } else if (prevDown.has(exp.id) && standby.waitTime !== undefined) {
        justBackUp.push(exp.id);
      }
    }
    prevDownRef.current = nowDown;

    if (justBackUp.length === 0) return;

    setHighlighted(prev => {
      const next = new Set(prev);
      for (const id of justBackUp) next.add(id);
      return next;
    });

    for (const id of justBackUp) {
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        setHighlighted(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        timersRef.current.delete(id);
      }, HIGHLIGHT_MS);
      timersRef.current.set(id, timer);
    }
  }, [experiences]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, []);

  return highlighted;
}
