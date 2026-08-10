import { use } from 'react';

import { Time } from '@/components/Time';
import ThemeContext from '@/contexts/ThemeContext';
import { DateTime, ParkTime } from '@/datetime';

export default function TimeBanner({
  bookTime,
  dropTime,
  dropTimeIsNonBg1,
}: {
  bookTime?: ParkTime;
  dropTime?: ParkTime;
  dropTimeIsNonBg1?: boolean;
}) {
  return bookTime || dropTime ? (
    <div className={`flex justify-center gap-x-10 ${use(ThemeContext).bg}`}>
      <LabeledTime label="Book" time={bookTime} />
      <LabeledTime label="Drop" time={dropTime} highlight={dropTimeIsNonBg1} />
    </div>
  ) : null;
}

function LabeledTime({
  label,
  time,
  highlight,
}: {
  label?: string;
  time?: ParkTime;
  highlight?: boolean;
}) {
  if (!time) return null;
  const now = DateTime.now().time.with({ second: 0 });
  return (
    <div>
      {label}:{' '}
      <span className={highlight ? 'text-orange-600' : ''}>
        {time > now ? (
          <Time time={time} />
        ) : (
          <time dateTime={`${time}`}>now</time>
        )}
      </span>
    </div>
  );
}
