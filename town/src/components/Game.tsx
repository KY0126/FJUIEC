import { useRef, useState } from 'react';
import PixiGame from './PixiGame.tsx';

import { useElementSize } from 'usehooks-ts';
import { Stage } from '@pixi/react';
import { ConvexProvider, useConvex, useQuery } from 'convex/react';
import PlayerDetails from './PlayerDetails.tsx';
import TownFeed from './TownFeed.tsx';
import CharacterSelect from './CharacterSelect.tsx';
import SpriteFace from './SpriteFace.tsx';
import { COVER_ROLES } from '../../data/ystravel';
import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat.ts';
import { useHistoricalTime } from '../hooks/useHistoricalTime.ts';
import { DebugTimeManager } from './DebugTimeManager.tsx';
import { GameId } from '../../convex/aiTown/ids.ts';
import { useServerGame } from '../hooks/serverGame.ts';
import { toast } from 'react-toastify';
import { regionOf } from '../../data/town';
import { LightMode, setLightMode } from './TownFx.tsx';
import TravelBanner from './TravelBanner.tsx';
import FeedbackCard from './FeedbackCard.tsx';

export const SHOW_DEBUG_UI = !!import.meta.env.VITE_SHOW_DEBUG_UI;

export default function Game() {
  const convex = useConvex();
  const [selectedElement, setSelectedElement] = useState<{
    kind: 'player';
    id: GameId<'players'>;
  }>();
  const [gameWrapperRef, { width, height }] = useElementSize();

  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const engineId = worldStatus?.engineId;

  const game = useServerGame(worldId);

  // Send a periodic heartbeat to our world to keep it alive.
  useWorldHeartbeat();

  const worldState = useQuery(api.world.worldState, worldId ? { worldId } : 'skip');
  const { historicalTime, timeManager } = useHistoricalTime(worldState?.engine);

  const scrollViewRef = useRef<HTMLDivElement>(null);
  const [coverOpen, setCoverOpen] = useState(true);
  const humanToken = useQuery(api.world.userStatus, worldId ? { worldId } : 'skip');
  const release = useMutation(api.world.releaseCharacter);
  const [panelOpen, setPanelOpen] = useState(() => {
    try {
      return localStorage.getItem('daxue-panel') !== 'closed';
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('daxue-panel', panelOpen ? 'open' : 'closed');
    } catch {}
  }, [panelOpen]);
  const [light, setLight] = useState<LightMode>(() => {
    try {
      const v = localStorage.getItem('daxue-light');
      if (v === 'day' || v === 'night' || v === 'auto') return v;
    } catch {}
    return 'auto';
  });
  useEffect(() => {
    setLightMode(light);
    try {
      localStorage.setItem('daxue-light', light);
    } catch {}
  }, [light]);
  // 永信旅人小鎮：一開始就把鏡頭移到永信門市（地圖右半）
  const camInit = useRef(false);
  useEffect(() => {
    if (!game || camInit.current) return;
    camInit.current = true;
    setTimeout(() => window.dispatchEvent(new CustomEvent('town-camera', { detail: 'hualien' })), 800);
  }, [game]);
  useEffect(() => {
    const open = () => setCoverOpen(true);
    window.addEventListener('open-character-select', open);
    return () => window.removeEventListener('open-character-select', open);
  }, []);

  if (!worldId || !engineId || !game) {
    return null;
  }
  const me = [...game.world.players.values()].find((p) => p.human && p.human === humanToken);
  const meName = me ? game.playerDescriptions.get(me.id)?.name : undefined;
  const meRegion = me ? regionOf(me.position) : undefined;
  const camera = (region: string) => window.dispatchEvent(new CustomEvent('town-camera', { detail: region }));
  return (
    <>
      {coverOpen && (
        <CharacterSelect worldId={worldId} game={game} onClose={() => setCoverOpen(false)} />
      )}
      {SHOW_DEBUG_UI && <DebugTimeManager timeManager={timeManager} width={200} height={100} />}
      <div className="mx-auto w-full max-w grid grid-rows-[240px_1fr] lg:grid-rows-[1fr] lg:grid-cols-[1fr_auto] lg:grow max-w-[1400px] min-h-[480px] game-frame">
        {/* Game area */}
        <div className="relative overflow-hidden bg-brown-900" ref={gameWrapperRef}>
          <div className="absolute inset-0">
            <div className="container">
              <Stage width={width} height={height} options={{ backgroundColor: 0x7ab5ff }}>
                {/* Re-propagate context because contexts are not shared between renderers.
https://github.com/michalochman/react-pixi-fiber/issues/145#issuecomment-531549215 */}
                <ConvexProvider client={convex}>
                  <PixiGame
                    game={game}
                    worldId={worldId}
                    engineId={engineId}
                    width={width}
                    height={height}
                    historicalTime={historicalTime}
                    setSelectedElement={setSelectedElement}
                  />
                </ConvexProvider>
              </Stage>
            </div>
          </div>
          <TravelBanner worldId={worldId} />
          <div className="absolute left-2 top-2 flex gap-1">
            <button
              onClick={() => camera('hualien')}
              className="rounded bg-brown-900/80 px-3 py-1 text-sm font-bold text-brown-100 hover:bg-clay-700"
            >
              🏬 永信門市
            </button>
            <button
              onClick={() => setLight(light === 'auto' ? 'day' : light === 'day' ? 'night' : 'auto')}
              title="切換畫面日夜（不影響角色作息）"
              className="rounded bg-brown-900/80 px-3 py-1 text-sm font-bold text-brown-100 hover:bg-clay-700"
            >
              {light === 'auto' ? '🕒 自動日夜' : light === 'day' ? '☀️ 白天' : '🌙 夜晚'}
            </button>
          </div>
        </div>
        {/* Right column area（加寬、可收合） */}
        {!panelOpen ? (
          <button
            onClick={() => setPanelOpen(true)}
            className="hidden lg:flex w-8 items-center justify-center border-l-8 border-brown-900 bg-brown-800 text-brown-200 hover:bg-brown-700"
            title="展開右側欄"
          >
            ◀
          </button>
        ) : null}
        <div
          className={`${panelOpen ? 'flex' : 'flex lg:hidden'} flex-col overflow-y-auto shrink-0 px-3 py-3 lg:w-[460px] border-t-8 sm:border-t-0 sm:border-l-8 border-brown-900  bg-brown-800 text-brown-100`}
          ref={scrollViewRef}
        >
          <button
            onClick={() => setPanelOpen(false)}
            className="mb-2 hidden self-end rounded px-2 text-xs text-brown-300 hover:bg-brown-700 lg:block"
            title="收合右側欄，地圖變大"
          >
            收合 ▶
          </button>
          {me && meName && (
            <div className="mb-3 flex items-center gap-2 rounded bg-brown-700 p-2">
              <SpriteFace name={meName} size={44} />
              <div className="min-w-0 flex-grow">
                <div className="text-sm font-bold text-brown-200">你正在扮演：{meName}</div>
                <div className="truncate text-xs text-brown-200">{COVER_ROLES[meName] ?? ''}</div>
                <div className="truncate text-xs text-brown-300">
                  {meRegion === 'train'
                    ? '🚆 火車上，到站前不能走動'
                    : '點地圖移動；點其他角色可以開始聊天'}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button className="rounded bg-clay-700 px-2 py-1 text-xs" onClick={() => setCoverOpen(true)}>
                  換角色
                </button>
                <button className="rounded bg-clay-700 px-2 py-1 text-xs" onClick={() => void release({ worldId })}>
                  離開角色
                </button>
              </div>
            </div>
          )}
          {me && meName && <FeedbackCard worldId={worldId} name={meName} />}
          {selectedElement ? (
            <PlayerDetails
              worldId={worldId}
              engineId={engineId}
              game={game}
              playerId={selectedElement?.id}
              setSelectedElement={setSelectedElement}
              scrollViewRef={scrollViewRef}
            />
          ) : (
            <TownFeed
              worldId={worldId}
              game={game}
              onSelect={(id) => setSelectedElement({ kind: 'player', id })}
            />
          )}
        </div>
      </div>
    </>
  );
}
