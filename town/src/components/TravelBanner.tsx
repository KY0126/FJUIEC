// 地圖左下角的列車狀態（候車中／行駛中）
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { REGION_NAMES, townClock } from '../../data/town';

export default function TravelBanner({ worldId }: { worldId: Id<'worlds'> }) {
  const travels = useQuery(api.town.activeTravels, { worldId });
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  if (!travels || travels.length === 0) return null;
  return (
    <div className="absolute bottom-2 left-2 flex flex-col gap-1 pointer-events-none">
      {travels.map((t) => {
        const from = t.to === 'hualien' ? 'daxue' : 'hualien';
        const p = Math.max(0, Math.min(1, (now - t.departAt) / (t.arriveAt - t.departAt)));
        return (
          <div key={t.playerId} className="w-64 rounded bg-brown-900/85 px-3 py-2 text-xs text-brown-100">
            <div className="font-bold">
              {t.boarded ? '🚆' : '⏳'} {t.name}　{REGION_NAMES[from]} → {REGION_NAMES[t.to]}
            </div>
            {t.boarded ? (
              <>
                <div className="mt-1 h-2 w-full overflow-hidden rounded bg-brown-700">
                  <div className="h-full bg-clay-500" style={{ width: `${p * 100}%` }} />
                </div>
                <div className="mt-1 text-brown-300">行駛中，預計 {townClock(t.arriveAt)} 到站</div>
              </>
            ) : (
              <div className="mt-1 text-brown-300">月台候車中，{townClock(t.departAt)} 發車</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
