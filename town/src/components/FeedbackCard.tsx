// 永信旅人小鎮：聊完的服務回饋卡（信任變化、問到的面向、解鎖的旅人角色、練習紀錄），3 分鐘後自動隱藏
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { FACETS, PASS_FACETS } from '../../data/ystravel';

export default function FeedbackCard({ worldId, name }: { worldId: Id<'worlds'>; name: string }) {
  const fb = useQuery(api.town.myFeedback, { worldId, humanName: name });
  const practice = useQuery(api.town.myPractice, { worldId, humanName: name });
  const [hidden, setHidden] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  if (!fb || hidden === fb.id || now - fb.time > 180_000) return null;
  const sign = fb.delta > 0 ? `+${fb.delta}` : `${fb.delta}`;
  const hearts = fb.delta > 0 ? '♥'.repeat(fb.delta) : fb.delta < 0 ? '💔' : '♡';
  const who = fb.aiName.slice(-2);
  const facets = fb.facets;
  const iAsked = fb.asker === name; // 顧問練習：我是提問的人；客人體驗：AI 顧問問我
  const missing = facets ? FACETS.map((f) => f.label).filter((l) => !facets.includes(l)) : [];
  return (
    <div className="mb-3 rounded border-2 border-clay-500 bg-brown-100 p-2 text-sm text-brown-900">
      <div className="flex items-center gap-2">
        <span className="font-bold">
          {hearts} {who}對你的信任 {sign}
        </span>
        <span className="flex-grow" />
        <button className="text-xs text-brown-700" onClick={() => setHidden(fb.id)}>
          關閉
        </button>
      </div>
      {fb.reason && <div className="text-xs">「{fb.reason}」</div>}
      {facets && (
        <>
          <div className="mt-2 text-xs font-bold">
            {iAsked ? '你問到的面向' : `${fb.asker?.slice(-2) ?? '顧問'}問到你的面向`} {facets.length}／{FACETS.length}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {FACETS.map((f) => (
              <span
                key={f.id}
                className={`rounded-full px-2 text-xs font-bold ${
                  facets.includes(f.label) ? 'bg-[#D9EAD3] text-[#24502A]' : 'bg-[#F4D9D0] text-[#7A2E1F]'
                }`}
              >
                {f.label} {facets.includes(f.label) ? '✓' : '✗'}
              </span>
            ))}
          </div>
          {iAsked && (
            <div className="mt-2 text-xs">
              {fb.role ? (
                <>
                  解鎖{who}的旅人角色：<b>{fb.role}</b>
                </>
              ) : (
                <>問到 {PASS_FACETS} 個以上面向，就能解鎖{who}是哪一型旅人。</>
              )}
            </div>
          )}
          {iAsked && missing.length > 0 && (
            <div className="mt-2 border-l-4 border-[#E8A54F] bg-[#FBF1E2] px-2 py-1 text-xs">
              <b>下一步：</b>補問{missing.join('、')}，或請{who}做 1 分鐘的旅行風格測驗。
            </div>
          )}
        </>
      )}
      {fb.remembered && <div className="mt-1 text-xs text-brown-700">{who}記住了：{fb.remembered}</div>}
      {iAsked && practice && (
        <div className="mt-2 text-xs text-brown-700">
          練習紀錄：{practice.times} 次，平均問到 {practice.avgFacets}／{FACETS.length} 個面向，解鎖 {practice.unlocked} 位客人
        </div>
      )}
    </div>
  );
}
