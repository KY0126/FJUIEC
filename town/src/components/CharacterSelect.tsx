import { useCallback, useEffect, useMemo, useState } from "react";
import { useConvex, useMutation, useQuery } from 'convex/react';
import { toast } from 'react-toastify';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { ServerGame } from '../hooks/serverGame';
import { waitForInput } from '../hooks/sendInput';
import { GameId } from '../../convex/aiTown/ids';
import OutfitImage from './OutfitImage';
import SpriteFace from './SpriteFace';
import { COVER_ROLES, ORDER_YS, TOWN_TITLE } from '../../data/ystravel';
import {
  ORDER,
  Outfit,
  PRESETS,
  describeOutfit,
  loadOutfit,
  presetOutfit,
  saveOutfit,
} from './outfit';

export const AVATARS: Record<string, string> = {};
const ROLES: Record<string, string> = {};
export const avatarUrl = (name: string) =>
  AVATARS[name] ? `/ai-town/assets/avatars/${AVATARS[name]}.png` : undefined;
export const publicIntro = (description: string) => description.split('【以下只有自己知道】')[0];

type Person = { playerId: GameId<'players'>; name: string; description: string };

export default function CharacterSelect({
  worldId,
  game,
  onClose,
}: {
  worldId: Id<'worlds'>;
  game: ServerGame;
  onClose: () => void;
}) {
  const convex = useConvex();
  const possess = useMutation(api.world.possessCharacter);
  const humanToken = useQuery(api.world.userStatus, { worldId });

  const people: Person[] = useMemo(() => {
    const agentPlayers = new Set([...game.world.agents.values()].map((a) => a.playerId));
    const list = [...game.playerDescriptions.values()].filter((p) => agentPlayers.has(p.playerId));
    const order = [...ORDER_YS, ...ORDER];
    const rank = (n: string) => (order.indexOf(n) === -1 ? 99 : order.indexOf(n));
    return list
      .sort((a, b) => rank(a.name) - rank(b.name))
      .map((p) => ({ playerId: p.playerId, name: p.name, description: p.description }));
  }, [game]);

  const [idx, setIdx] = useState(0);
  const [dressing, setDressing] = useState<Person | null>(null);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const count = people.length;
  const move = useCallback((d: number) => setIdx((i) => (count ? (i + d + count) % count : 0)), [count]);

  const holderOf = (p: Person) => game.world.players.get(p.playerId)?.human;
  const takenByOther = (p: Person) => {
    const h = holderOf(p);
    return !!h && h !== humanToken;
  };

  const openDressing = useCallback(
    (p: Person) => {
      if (takenByOther(p)) {
        toast.error('這個角色正在被別人扮演');
        return;
      }
      setOutfit(loadOutfit(p.name));
      setDressing(p);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, humanToken],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dressing) {
        if (e.key === 'Escape') setDressing(null);
        return;
      }
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'Enter' && people[idx]) void enterAs(people[idx]);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dressing, move, idx, people, openDressing, onClose]);

  const [busy, setBusy] = useState(false);
  // 永信旅人小鎮：不進試衣間，直接附身
  const enterAs = async (p: Person) => {
    if (busy) return;
    if (takenByOther(p)) {
      toast.error('這個角色正在被別人扮演');
      return;
    }
    setBusy(true);
    try {
      const inputId = await possess({ worldId, playerId: p.playerId });
      await waitForInput(convex, inputId);
      toast.success(`你現在是${p.name}`);
      onClose();
    } catch (e: any) {
      toast.error(e?.data ?? e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };
  const confirm = async () => {
    if (!dressing || !outfit || busy) return;
    saveOutfit(dressing.name, outfit);
    setBusy(true);
    const timeout = <T,>(p: Promise<T>, ms: number) =>
      Promise.race([
        p,
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error('連不到小鎮後端：請確認「啟動永信小鎮」的黑色視窗還開著，沒有出現紅色錯誤')),
            ms,
          ),
        ),
      ]);
    try {
      const inputId = await timeout(possess({ worldId, playerId: dressing.playerId }), 15000);
      await timeout(waitForInput(convex, inputId), 30000);
      toast.success(`你現在是${dressing.name}（${describeOutfit(outfit, dressing.name)}）`);
      window.dispatchEvent(new Event('outfit-changed'));
      setDressing(null);
      onClose();
    } catch (e: any) {
      toast.error(e?.data ?? e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  // 每張卡片相對中央的位置（環狀，取最短距離）
  const offsetOf = (i: number) => {
    let d = i - idx;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(24,20,37,0.94)] px-4 py-6 text-brown-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center">
        <div className="text-sm font-bold tracking-[0.3em] text-brown-300">永信旅遊 × 輔大創新創業社</div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-widest text-brown-200">{TOWN_TITLE}</h1>
        {!dressing && (
          <>
            <p className="mt-2 text-center text-lg">
              客人說「都可以」的時候，你會怎麼問？扮演新進顧問林家瑋練習引導，或扮演林雅婷體驗新流程。用 ◀ ▶ 切換，按 Enter 選定。
            </p>
            {count === 0 ? (
              <p className="mt-16 text-brown-300">角色載入中…</p>
            ) : (
              <div className="relative mt-6 h-[470px] w-full" style={{ perspective: '1200px' }}>
                {people.map((p, i) => {
                  const d = offsetOf(i);
                  const ad = Math.abs(d);
                  const center = d === 0;
                  const url = avatarUrl(p.name);
                  return (
                    <div
                      key={p.playerId}
                      onClick={() => (center ? undefined : setIdx(i))}
                      className={`absolute left-1/2 top-0 w-72 cursor-pointer rounded-xl border-4 bg-brown-800 p-5 text-center transition-all duration-500 ${
                        center ? 'border-brown-300 shadow-2xl' : 'border-brown-700'
                      }`}
                      style={{
                        transform: `translateX(calc(-50% + ${d * 210}px)) translateZ(${-ad * 140}px) rotateY(${
                          d * -24
                        }deg) scale(${Math.max(0.55, 1 - ad * 0.17)})`,
                        zIndex: 20 - ad,
                        opacity: ad > 3 ? 0 : 1 - ad * 0.22,
                        filter: center ? 'none' : `brightness(${1 - ad * 0.15})`,
                        pointerEvents: ad > 3 ? 'none' : 'auto',
                      }}
                    >
                      {url ? (
                        <img src={url} alt={p.name} className="mx-auto h-40 w-40 rounded-full" />
                      ) : (
                        <div className="mx-auto w-40">
                          <SpriteFace name={p.name} size={160} />
                        </div>
                      )}
                      <div className="mt-3 text-3xl font-bold text-brown-200">{p.name}</div>
                      <div className="text-sm text-brown-300">{COVER_ROLES[p.name] ?? ROLES[p.name] ?? ''}</div>
                      {center && (
                        <>
                          <div className="mt-3 max-h-28 overflow-hidden text-left text-sm leading-relaxed">
                            {publicIntro(p.description)}
                          </div>
                          <button
                            disabled={takenByOther(p)}
                            onClick={(e) => {
                              e.stopPropagation();
                              void enterAs(p);
                            }}
                            className="mt-4 w-full rounded bg-clay-700 py-2 text-lg font-bold hover:bg-clay-500 disabled:opacity-40"
                          >
                            {takenByOther(p)
                              ? '已有人扮演'
                              : holderOf(p) === humanToken && holderOf(p)
                              ? '目前扮演中'
                              : busy
                              ? '走進小鎮中…'
                              : '成為這個角色'}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
                <button
                  aria-label="上一位"
                  onClick={() => move(-1)}
                  className="absolute left-0 top-40 z-30 rounded-full bg-clay-700 px-4 py-3 text-2xl hover:bg-clay-500"
                >
                  ◀
                </button>
                <button
                  aria-label="下一位"
                  onClick={() => move(1)}
                  className="absolute right-0 top-40 z-30 rounded-full bg-clay-700 px-4 py-3 text-2xl hover:bg-clay-500"
                >
                  ▶
                </button>
              </div>
            )}
            <div className="mt-2 flex gap-2">
              {people.map((p, i) => (
                <button
                  key={p.playerId}
                  aria-label={p.name}
                  onClick={() => setIdx(i)}
                  className={`h-3 w-3 rounded-full ${i === idx ? 'bg-brown-200' : 'bg-brown-700'}`}
                />
              ))}
            </div>
            <button onClick={onClose} className="mt-6 rounded bg-clay-700 px-6 py-2 hover:bg-clay-500">
              先旁觀就好
            </button>
          </>
        )}

        {dressing && outfit && (
          <div className="mt-6 grid w-full gap-6 lg:grid-cols-[320px_1fr]">
            <div className="flex flex-col items-center rounded-xl border-4 border-brown-700 bg-brown-800 p-5">
              <div className="text-sm text-brown-300">試衣間</div>
              <div className="text-3xl font-bold text-brown-200">{dressing.name}</div>
              <div className="mt-4">
                <OutfitImage name={dressing.name} preset={outfit.preset} size={224} />
              </div>
              <div className="mt-3 text-center text-sm">{describeOutfit(outfit, dressing.name)}</div>
            </div>
            <div className="flex flex-col gap-5 rounded-xl border-4 border-brown-700 bg-brown-800 p-5">
              <div>
                <div className="mb-1 text-lg font-bold text-brown-200">衣櫃</div>
                <p className="mb-3 text-sm text-brown-300">每一套都包含上衣、外套與配飾，點一下就換上。</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {PRESETS.map((p) => {
                    const o = presetOutfit(dressing.name, p.id);
                    const active = (outfit.preset ?? 'signature') === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setOutfit(o)}
                        className={`flex flex-col items-center gap-2 rounded-lg border-4 p-3 ${
                          active ? 'border-brown-300 bg-brown-700' : 'border-brown-700 hover:border-brown-500'
                        }`}
                      >
                        <OutfitImage name={dressing.name} preset={p.id} size={84} />
                        <div className="font-bold text-brown-200">{p.label}</div>
                        <div className="text-center text-xs text-brown-300">{describeOutfit(o, dressing.name)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-3">
                <button
                  onClick={() => void confirm()}
                  disabled={busy}
                  className="flex-grow rounded bg-clay-700 px-6 py-3 text-lg font-bold hover:bg-clay-500 disabled:opacity-60"
                >
                  {busy ? '走進小鎮中…' : '確定，走進小鎮'}
                </button>
                <button onClick={() => setDressing(null)} className="rounded bg-brown-700 px-6 py-3 hover:bg-brown-500">
                  返回選角
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
