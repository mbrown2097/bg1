let ctx: AudioContext | null = null;

export function unlockBeep() {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

// iOS Safari only counts certain event types (click/touch/key, not focus)
// as the "user gesture" required to unlock Web Audio, so relying on an
// <input onFocus> handler alone can silently fail to resume the context.
// Listen for a real qualifying gesture anywhere in the app instead.
const GESTURE_EVENTS = ['pointerdown', 'touchend', 'keydown'] as const;

export function initBeepUnlock() {
  const handler = () => {
    unlockBeep();
    if (ctx?.state === 'running') {
      GESTURE_EVENTS.forEach(type =>
        document.removeEventListener(type, handler)
      );
    }
  };
  GESTURE_EVENTS.forEach(type =>
    document.addEventListener(type, handler, { passive: true })
  );
}

export default function beep(times = 3) {
  if (!ctx) return;
  // iOS auto-suspends an idle AudioContext to save power; a beep fired
  // later from a timer (not a user gesture) needs to re-resume it every
  // time, since it can suspend again between alerts. resume() itself
  // doesn't require a fresh gesture once the context has been unlocked
  // once via initBeepUnlock().
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  for (let i = 0; i < times; i++) {
    const start = now + i * 0.35;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(1, start + 0.02);
    gain.gain.setValueAtTime(1, start + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  }
}

// Distinct alternating two-tone "wobble" for drop alerts, so it's
// audibly different from the single-pitch beep() above.
export function dropBeep(times = 3) {
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  const freqs = [700, 450];
  let step = 0;
  for (let i = 0; i < times; i++) {
    for (const freq of freqs) {
      const start = now + step * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
      step++;
    }
  }
}
