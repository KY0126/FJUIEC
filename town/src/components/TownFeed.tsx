import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { ServerGame } from '../hooks/serverGame';
import { GameId } from '../../convex/aiTown/ids';
import { useEffect, useState } from 'react';
import { avatarUrl } from './CharacterSelect';
import SpriteFace from './SpriteFace';
import { useMutation } from 'convex/react';
import { toast } from 'react-toastify';
import {
  LOCATION_NAMES,
  REGION_NAMES,
  SCHEDULES,
  SLOT_LABELS,
  TOWN_EVENTS,
  isOffstage,
  regionOf,
  slotIndex,
  townClock,
  townDay,
} from '../../data/town';

export default function TownFeed({
  worldId,
  game,
  onSelect,
}: {
  worldId: Id<'worlds'>;
  game: ServerGame;
  onSelect: (id: GameId<'players'>) => void;
}) {
  const msgs = useQuery(api.messages.recentMessages, { worldId });
  const log = useQuery(api.town.recentTownLog, { worldId });
  const fire = useMutation(api.town.fireTownEvent);
  const travels = useQuery(api.town.activeTravels, { worldId });
  const info = useQuery(api.town.townInfo, { worldId });
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState<'feed' | 'events'>('feed');
  const [fired, setFired] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const slot = slotIndex(now);
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(30);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpenKeys({ ...openKeys, [k]: !openKeys[k] });
  // 對話依 conversationId 合成一張卡片；最近有更新的排最上面
  const convs = new Map<string, ConvItem>();
  for (const m of msgs ?? []) {
    const key = m.conversationId as string;
    let c = convs.get(key);
    if (!c) {
      c = { kind: 'conv', key, time: 0, people: [], lines: [] };
      convs.set(key, c);
    }
    c.time = Math.max(c.time, m.time);
    if (!c.people.includes(m.author)) c.people.push(m.author);
    c.lines.push({ author: m.author, text: m.text, time: m.time });
  }
  for (const c of convs.values()) c.lines.sort((a, b) => b.time - a.time);
  const others: LogItem[] = (log ?? []).map((l) => ({
    kind: l.kind,
    key: l.id as string,
    time: l.time,
    title:
      l.kind === 'event'
        ? `事件：${l.title}`
        : l.kind === 'call'
          ? `${l.author}｜${l.title}`
          : l.kind === 'ig'
            ? `IG 群組・${l.title}`
            : '火車',
    text: l.kind === 'ig' ? `${l.author}：${l.text}` : l.text,
  }));
  const items: (ConvItem | LogItem)[] = [...convs.values(), ...others]
    .filter((it) => filter === 'all' || it.kind === filter)
    .sort((a, b) => b.time - a.time);
  const phases = ['練習情境', 'LINE 推播'];
  const people = [...game.playerDescriptions.values()];
  const whereIs = (p: { playerId: string; name: string }) => {
    const t = travels?.find((x) => x.playerId === p.playerId);
    if (t && !t.boarded) return `⏳ 候車，${townClock(t.departAt)} 發車`;
    if (t) return `🚆 往${REGION_NAMES[t.to]}，${townClock(t.arriveAt)} 到站`;
    const pl = game.world.players.get(p.playerId as GameId<'players'>);
    if (pl && regionOf(pl.position) === 'train') return '🚆 火車上';
    const ag = [...game.world.agents.values()].find((x) => x.playerId === p.playerId);
    const plan = ag ? game.agentDescriptions.get(ag.id)?.plan : undefined;
    if (pl && !pl.human && isOffstage(p.name, now, plan)) return '不在場';
    const loc = LOCATION_NAMES[SCHEDULES[p.name]?.[slot] ?? ''] ?? '自由活動';
    return pl ? `${REGION_NAMES[regionOf(pl.position)]}｜${loc}` : loc;
  };
  const busy = new Set<string>();
  for (const c of game.world.conversations.values()) {
    for (const pid of c.participants.keys()) busy.add(pid);
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 -mx-1 flex items-center justify-between rounded bg-brown-900 px-3 py-1">
        <span className="text-xs text-brown-300">
          {info ? `第 ${townDay(now, info.created).day} 天・週${townDay(now, info.created).weekday}` : '小鎮時間'}
        </span>
        <span className="text-xl font-bold text-brown-200">{townClock(now)}</span>
        <span className="text-xs text-brown-300">{SLOT_LABELS[slot]}</span>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {people.map((p) => (
          <button
            key={p.playerId}
            onClick={() => onSelect(p.playerId)}
            title={`${p.name}｜${whereIs(p)}`}
            className="flex w-16 shrink-0 flex-col items-center rounded p-1 hover:bg-brown-700"
          >
            <span className="relative">
              <Face name={p.name} size={40} />
              {busy.has(p.playerId) && <span className="absolute -right-1 -top-1 text-xs">💬</span>}
            </span>
            <span className="mt-0.5 text-xs font-bold text-brown-200">{p.name.slice(-2)}</span>
            <span className="w-full truncate text-center text-[10px] leading-tight text-brown-300">{whereIs(p)}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setTab('feed')}
          className={`flex-1 rounded py-1 text-sm ${tab === 'feed' ? 'bg-brown-300 text-brown-900 font-bold' : 'bg-clay-700'}`}
        >
          全鎮動態
        </button>
        <button
          onClick={() => setTab('events')}
          className={`flex-1 rounded py-1 text-sm ${tab === 'events' ? 'bg-brown-300 text-brown-900 font-bold' : 'bg-clay-700'}`}
        >
          事件投放
        </button>
      </div>
      {tab === 'events' ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-brown-300">
            投放後，相關角色會記住這件事並走去事件地點，到場後開始聊。建議先旁觀「新人第一次接待」，再附身林家瑋自己重來一次。
          </p>
          {phases.map((ph) => (
            <div key={ph} className="flex flex-col gap-2">
              <h3 className="font-bold text-brown-200">{ph}</h3>
              {TOWN_EVENTS.filter((e) => e.phase === ph && e.kind !== 'call').map((e) => (
                <div key={e.id} className="rounded bg-brown-700 p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brown-300">#{e.order}</span>
                    <span className="font-bold text-brown-200">{e.title}</span>
                    {e.ig && <span className="rounded bg-clay-700 px-1 text-xs">IG</span>}
                  </div>
                  <div className="text-xs text-brown-300">
                    {LOCATION_NAMES[e.loc] ?? '不限地點'}・{e.involved.join('、')}
                  </div>
                  <div className="mt-1 text-sm">{e.desc}</div>
                  {e.trigger && <div className="mt-1 text-xs text-brown-300">建議時機：{e.trigger}</div>}
                  <button
                    onClick={async () => {
                      try {
                        await fire({ worldId, eventId: e.id });
                        setFired({ ...fired, [e.id]: true });
                        toast.success(`已投放：${e.title}`);
                        setTab('feed');
                      } catch (err: any) {
                        toast.error(err?.message ?? String(err));
                      }
                    }}
                    className="mt-2 w-full rounded bg-clay-700 py-1 text-sm font-bold hover:bg-clay-500"
                  >
                    {fired[e.id] ? '再投放一次' : '投放這個事件'}
                  </button>
                </div>
              ))}
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-brown-200">LINE 一般訊息（對照）</h3>
            <p className="text-xs text-brown-300">不會移動角色，只讓角色記得收到這則訊息；用來和上面的分眾推播比較。</p>
            {TOWN_EVENTS.filter((e) => e.kind === 'call').map((e) => (
              <div key={e.id} className="flex gap-2 rounded bg-brown-700 p-2">
                <FamilyFace portrait={e.portrait} />
                <div className="flex-grow">
                  <div className="font-bold text-brown-200">📱 {e.caller}｜{e.title}</div>
                  <div className="text-xs text-brown-300">{e.involved.join('、')}{e.ig ? '・IG' : ''}</div>
                  <div className="mt-1 text-sm">{e.desc}</div>
                  {e.trigger && <div className="mt-1 text-xs text-brown-300">建議時機：{e.trigger}</div>}
                  <button
                    onClick={async () => {
                      try {
                        await fire({ worldId, eventId: e.id });
                        setFired({ ...fired, [e.id]: true });
                        toast.success(`已投放：${e.title}`);
                        setTab('feed');
                      } catch (err: any) {
                        toast.error(err?.message ?? String(err));
                      }
                    }}
                    className="mt-2 w-full rounded bg-clay-700 py-1 text-sm font-bold hover:bg-clay-500"
                  >
                    {fired[e.id] ? '再打一次' : '打這通電話'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {FILTERS.map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-2 py-0.5 text-xs ${filter === k ? 'bg-brown-300 font-bold text-brown-900' : 'bg-brown-700 text-brown-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-brown-300">
              還沒有動靜。角色在筆電上用免費模型思考，第一句話可能要等一下；也可以到「事件投放」推動劇情。
            </p>
          ) : (
            <>
              {items.slice(0, limit).map((it) =>
                it.kind === 'conv' ? (
                  <ConvCard key={it.key} conv={it} open={!!openKeys[it.key]} onToggle={() => toggle(it.key)} />
                ) : (
                  <button
                    key={it.key}
                    onClick={() => toggle(it.key)}
                    className={`rounded px-2 py-1 text-left text-sm ${it.kind === 'event' ? 'border border-brown-300 bg-brown-900' : it.kind === 'call' ? 'border border-clay-500 bg-brown-900' : it.kind === 'ig' ? 'bg-clay-700' : 'bg-brown-900'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{ICON[it.kind]}</span>
                      <span className="flex-grow truncate font-bold text-brown-200">{it.title}</span>
                      <span className="shrink-0 text-[10px] text-brown-300">{hhmm(it.time)}</span>
                    </div>
                    <div className={`text-xs text-brown-100 ${openKeys[it.key] ? '' : 'line-clamp-1'}`}>{it.text}</div>
                  </button>
                ),
              )}
              {items.length > limit && (
                <button onClick={() => setLimit(limit + 30)} className="rounded bg-brown-700 py-1 text-xs text-brown-200">
                  載入更早的動態
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// 家人頭像：public/assets/family/<portrait>.png，還沒生成時顯示電話圖示
function FamilyFace({ portrait }: { portrait?: string }) {
  const [ok, setOk] = useState(true);
  if (!portrait || !ok)
    return <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-clay-700 text-2xl">📞</div>;
  return (
    <img
      src={`/ai-town/assets/family/${portrait}.png`}
      onError={() => setOk(false)}
      className="h-12 w-12 shrink-0 rounded-full object-cover"
    />
  );
}

type Filter = 'all' | 'conv' | 'event' | 'train' | 'ig' | 'call';
const FILTERS: [Filter, string][] = [
  ['all', '全部'],
  ['conv', '💬 對話'],
  ['event', '📣 事件'],
  ['call', '📱 LINE 訊息'],
];
const ICON: Record<string, string> = { event: '📣', train: '🚆', ig: '📱', call: '📱' };
type ConvItem = {
  kind: 'conv';
  key: string;
  time: number;
  people: string[];
  lines: { author: string; text: string; time: number }[];
};
type LogItem = { kind: 'event' | 'ig' | 'train' | 'call'; key: string; time: number; title: string; text: string };

const hhmm = (t: number) => new Date(t).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

function Face({ name, size }: { name: string; size: number }) {
  const url = avatarUrl(name);
  return url ? (
    <img src={url} style={{ width: size, height: size }} className="rounded-full bg-brown-700 object-cover" />
  ) : (
    <SpriteFace name={name} size={size} />
  );
}

// 一段對話一張卡片：收合時看最新兩句，展開看全部（最新在上）
function ConvCard({ conv, open, onToggle }: { conv: ConvItem; open: boolean; onToggle: () => void }) {
  const shown = open ? conv.lines : conv.lines.slice(0, 2);
  return (
    <div className="rounded bg-brown-700 p-2">
      <button onClick={onToggle} className="flex w-full items-center gap-2 text-left">
        <span className="flex -space-x-2">
          {conv.people.slice(0, 3).map((n) => (
            <Face key={n} name={n} size={24} />
          ))}
        </span>
        <span className="flex-grow truncate text-sm font-bold text-brown-200">{conv.people.join(' × ')}</span>
        <span className="shrink-0 text-[10px] text-brown-300">{hhmm(conv.time)}</span>
        <span className="shrink-0 text-xs text-brown-300">{open ? '收合' : `全部 ${conv.lines.length} 句`}</span>
      </button>
      <div className="mt-1 flex flex-col gap-1">
        {shown.map((l, i) => (
          <div key={i} className="text-sm leading-snug text-brown-100">
            <b className="text-brown-200">{l.author.slice(-2)}</b>：{l.text}
          </div>
        ))}
      </div>
    </div>
  );
}
