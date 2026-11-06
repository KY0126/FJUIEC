// 事件投放、家人來電、IG 群組對話、火車、事件紀錄
import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { insertInput } from './aiTown/insertInput';
import { chatCompletion, fetchEmbedding } from './util/llm';
import {
  IG_GROUP,
  LOCATION_NAMES,
  NOTE_MINUTES,
  REGION_NAMES,
  STATION_OF,
  TOWN_EVENTS,
  TRAIN_MINUTES,
  declineLine,
  detectPlan as findPlan,
  goodbyeLine,
  SCHEDULES,
  slotIndex,
  locRegion,
  nearSpots,
  nextDeparture,
  regionOf,
  townClock,
} from '../data/town';
import { MutationCtx } from './_generated/server';
import { Id } from './_generated/dataModel';

const HOLD_SAME_REGION = 300_000; // 同區事件：在事件地點待 5 小時（小鎮）
const HOLD_CROSS_REGION = 720_000; // 跨區事件：含候車與車程，待 12 小時（小鎮）

async function nameToPlayerId(ctx: MutationCtx, worldId: Id<'worlds'>) {
  const rows = await ctx.db
    .query('playerDescriptions')
    .withIndex('worldId', (q) => q.eq('worldId', worldId))
    .collect();
  return new Map(rows.map((r) => [r.name, r.playerId as string]));
}

async function setHold(
  ctx: MutationCtx,
  worldId: Id<'worlds'>,
  playerId: string,
  loc: string,
  until: number,
  eventId: string,
) {
  const old = await ctx.db
    .query('townHold')
    .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('playerId', playerId))
    .collect();
  for (const o of old) await ctx.db.delete(o._id);
  await ctx.db.insert('townHold', { worldId, playerId, loc, until, eventId });
}

export const fireTownEvent = mutation({
  args: { worldId: v.id('worlds'), eventId: v.string() },
  handler: async (ctx, args) => {
    const ev = TOWN_EVENTS.find((e) => e.id === args.eventId);
    if (!ev) throw new Error(`找不到事件 ${args.eventId}`);
    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error('找不到小鎮');
    const ids = await nameToPlayerId(ctx, args.worldId);
    const now = Date.now();
    let anyCross = false;

    if (ev.kind === 'call') {
      await ctx.db.insert('townLog', {
        worldId: args.worldId,
        kind: 'call',
        title: ev.title,
        author: ev.caller,
        text: ev.desc,
      });
    } else {
      // 事件期間，相關角色以事件地點為目的地；人在另一區的會自己走去車站搭車
      const evRegion = locRegion(ev.loc);
      for (const name of ev.involved) {
        const pid = ids.get(name);
        const p = world.players.find((x) => x.id === pid);
        if (!pid || !p || p.human) continue;
        const cross = regionOf(p.position) !== evRegion;
        if (cross) anyCross = true;
        await setHold(ctx, args.worldId, pid, ev.loc, now + (cross ? HOLD_CROSS_REGION : HOLD_SAME_REGION), ev.id);
      }
      await ctx.db.insert('townLog', {
        worldId: args.worldId,
        kind: 'event',
        title: ev.title,
        text: `${LOCATION_NAMES[ev.loc] ?? ''}｜${ev.desc}`,
      });
    }
    const inputId = await insertInput(ctx, args.worldId, 'triggerTownEvent', { eventId: ev.id });
    // 「最近發生的事」在事件結束（hold 到期）後 3 小時才淡忘
    const holdMs = ev.kind === 'call' ? 0 : anyCross ? HOLD_CROSS_REGION : HOLD_SAME_REGION;
    await ctx.scheduler.runAfter(holdMs + NOTE_MINUTES * 1000, internal.town.expireNote, {
      worldId: args.worldId,
      eventId: ev.id,
    });
    if (ev.ig) {
      await ctx.scheduler.runAfter(20000, internal.town.igGroupChat, { worldId: args.worldId, eventId: ev.id });
    }
    return inputId;
  },
});

export const expireNote = internalMutation({
  args: { worldId: v.id('worlds'), eventId: v.string() },
  handler: async (ctx, args) => {
    await insertInput(ctx, args.worldId, 'expireTownNote', { eventId: args.eventId });
  },
});

// 角色目前被事件留住的地點（沒有就照作息）
export const getHold = internalQuery({
  args: { worldId: v.id('worlds'), playerId: v.string() },
  handler: async (ctx, args) => {
    const h = await ctx.db
      .query('townHold')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .first();
    if (!h || h.until < Date.now()) return null;
    return { loc: h.loc, eventId: h.eventId ?? null, met: !!h.met };
  },
});

// 角色走到事件地點時呼叫：有其他相關角色也在現場，就讓他們開聊（每個事件只觸發一次）
export const eventArrived = internalMutation({
  args: { worldId: v.id('worlds'), playerId: v.string() },
  handler: async (ctx, args) => {
    const hold = await ctx.db
      .query('townHold')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .first();
    if (!hold?.eventId || hold.met || hold.until < Date.now()) return;
    const ev = TOWN_EVENTS.find((e) => e.id === hold.eventId);
    const world = await ctx.db.get(args.worldId);
    if (!ev || !world) return;
    const ids = await nameToPlayerId(ctx, args.worldId);
    const partnerHere = ev.involved
      .map((n) => ids.get(n))
      .filter((pid) => pid && pid !== args.playerId)
      .some((pid) => {
        const p = world.players.find((x) => x.id === pid);
        return !!p && nearSpots(ev.loc, p.position, 2);
      });
    if (!partnerHere) return;
    const holds = await ctx.db.query('townHold').withIndex('worldId', (q) => q.eq('worldId', args.worldId)).collect();
    for (const h of holds) if (h.eventId === ev.id) await ctx.db.patch(h._id, { met: true });
    await insertInput(ctx, args.worldId, 'eventMeet', { eventId: ev.id, playerId: args.playerId });
  },
});

// 約定：聊完掃描最後幾句，偵測「去哪裡找誰」，兩人在接下來一段時間優先去那裡
const PLAN_HOLD_SAME = 120_000; // 同區：小鎮 2 小時
const PLAN_HOLD_CROSS = 600_000; // 跨區：含候車與車程
export const detectPlan = internalMutation({
  args: { worldId: v.id('worlds'), conversationId: v.string() },
  handler: async (ctx, args) => {
    const planId = `plan:${args.conversationId}`;
    const msgs = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) => q.eq('worldId', args.worldId).eq('conversationId', args.conversationId as any))
      .collect();
    const authors = [...new Set(msgs.map((m) => m.author as string))];
    if (authors.length < 2) return;
    const world = await ctx.db.get(args.worldId);
    if (!world) return;
    const players = authors.map((id) => world.players.find((p) => p.id === id)).filter((p) => !!p);
    if (players.length < 2) return;
    const region = regionOf(players[0]!.position);
    if (region === 'train') return;
    const loc = findPlan(
      msgs.slice(-4).map((m) => m.text),
      region,
    );
    if (!loc) return;
    const now = Date.now();
    const holds = [];
    for (const p of players) {
      const h = await ctx.db
        .query('townHold')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', p!.id))
        .first();
      if (h?.eventId === planId) return; // 另一位參與者已經處理過
      // 事件優先：身上有進行中的事件就不改
      if (h && h.until > now && h.eventId && !h.eventId.startsWith('plan:')) return;
      holds.push(p!);
    }
    for (const p of holds) {
      if (p.human) continue;
      const cross = regionOf(p.position) !== locRegion(loc);
      await setHold(ctx, args.worldId, p.id, loc, now + (cross ? PLAN_HOLD_CROSS : PLAN_HOLD_SAME), planId);
    }
    const ids = await nameToPlayerId(ctx, args.worldId);
    const names = [...ids.entries()].filter(([, id]) => authors.includes(id)).map(([n]) => n);
    await ctx.db.insert('townLog', {
      worldId: args.worldId,
      kind: 'event',
      title: '約定',
      text: `📍 ${names.join('和')}約在${LOCATION_NAMES[loc]}`,
    });
  },
});

export const igGroupChat = internalAction({
  args: { worldId: v.id('worlds'), eventId: v.string() },
  handler: async (ctx, args) => {
    const ev = TOWN_EVENTS.find((e) => e.id === args.eventId);
    if (!ev) return;
    const prompt = [
      `你要寫一段群組聊天，成員是：${IG_GROUP.join('、')}。`,
      `今天發生的事：${ev.desc}`,
      `由事件主角（${ev.involved.find((n) => IG_GROUP.includes(n)) ?? IG_GROUP[0]}）先開頭。`,
      '請用繁體中文、台灣口語，寫 5 到 7 則訊息。',
      `每則一行，格式固定為「名字：內容」，名字只能是${IG_GROUP.join('、')}。不要寫其他說明。`,
    ].join('\n');
    let content = '';
    try {
      const res = await chatCompletion({ messages: [{ role: 'user', content: prompt }], max_tokens: 400 });
      content = res.content;
    } catch (e: any) {
      console.log('IG 群組產生失敗', e?.message);
      return;
    }
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .map((l) => l.match(/^([^:：]{2,4})\s*[:：]\s*(.+)$/))
      .filter((m) => !!m && IG_GROUP.includes(m[1]))
      .filter((m): m is RegExpMatchArray => !!m)
      .slice(0, 8);
    for (const m of lines) {
      await ctx.runMutation(internal.town.addIgLine, {
        worldId: args.worldId,
        title: ev.title,
        author: m[1],
        text: m[2],
      });
    }
    // 把這段群組聊天存成三人的記憶，之後聊天會想起來
    if (lines.length) {
      const description = `在 IG 群組（${ev.title}）和死黨聊到：${lines
        .map((m) => `${m[1]}說「${m[2]}」`)
        .join('；')}`.slice(0, 600);
      try {
        const { embedding } = await fetchEmbedding(description);
        await ctx.runMutation(internal.town.rememberIg, { worldId: args.worldId, description, embedding });
      } catch (e: any) {
        console.log('IG 記憶寫入失敗', e?.message);
      }
    }
  },
});

export const rememberIg = internalMutation({
  args: { worldId: v.id('worlds'), description: v.string(), embedding: v.array(v.float64()) },
  handler: async (ctx, args) => {
    const ids = await nameToPlayerId(ctx, args.worldId);
    for (const name of IG_GROUP) {
      const playerId = ids.get(name);
      if (!playerId) continue;
      const embeddingId = await ctx.db.insert('memoryEmbeddings', { playerId, embedding: args.embedding });
      await ctx.db.insert('memories', {
        playerId,
        description: args.description,
        embeddingId,
        importance: 6,
        lastAccess: Date.now(),
        data: { type: 'reflection', relatedMemoryIds: [] },
      });
    }
  },
});

export const addIgLine = internalMutation({
  args: { worldId: v.id('worlds'), title: v.string(), author: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    if (!IG_GROUP.includes(args.author)) return;
    await ctx.db.insert('townLog', { ...args, kind: 'ig' });
  },
});

export const recentTownLog = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('townLog')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(120);
    return rows.map((r) => ({
      id: r._id,
      kind: r.kind,
      title: r.title,
      author: r.author,
      text: r.text,
      time: r._creationTime,
    }));
  },
});

// 小鎮建立時間（算第幾天用）
export const townInfo = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const w = await ctx.db.get(args.worldId);
    return { created: w?._creationTime ?? Date.now() };
  },
});

// ===== 花蓮支線：搭火車（每 30 分鐘一班，首班 06:00、末班 23:00）=====
async function doBoard(ctx: MutationCtx, worldId: Id<'worlds'>, playerId: string, to: string) {
  const travelling = await ctx.db
    .query('townTravel')
    .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('playerId', playerId))
    .first();
  if (travelling) return null;
  const desc = await ctx.db
    .query('playerDescriptions')
    .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('playerId', playerId))
    .first();
  const name = desc?.name ?? '某人';
  const now = Date.now();
  const departAt = Math.max(nextDeparture(now), now + 1000);
  const arriveAt = departAt + TRAIN_MINUTES * 1000;
  const travelId = await ctx.db.insert('townTravel', {
    worldId,
    playerId,
    name,
    to,
    departAt,
    arriveAt,
    boarded: false,
  });
  const from = to === 'daxue' ? 'hualien' : 'daxue';
  await ctx.db.insert('townLog', {
    worldId,
    kind: 'train',
    title: '火車',
    text: `${name} 在${LOCATION_NAMES[STATION_OF[from]]}候車，往${REGION_NAMES[to]}的列車 ${townClock(departAt)} 發車。`,
  });
  await ctx.scheduler.runAt(departAt, internal.town.departTrain, { travelId, tries: 0 });
  return travelId;
}

export const boardTrain = internalMutation({
  args: { worldId: v.id('worlds'), playerId: v.string(), to: v.string() },
  handler: async (ctx, args) => doBoard(ctx, args.worldId, args.playerId, args.to),
});

// 發車：人在月台就上車；不在就等下一班（最多等 4 班，之後取消）
export const departTrain = internalMutation({
  args: { travelId: v.id('townTravel'), tries: v.number() },
  handler: async (ctx, args) => {
    const t = await ctx.db.get(args.travelId);
    if (!t || t.boarded) return;
    const world = await ctx.db.get(t.worldId);
    const p = world?.players.find((x) => x.id === t.playerId);
    const here = p ? regionOf(p.position) : 'train';
    if (!p || here === 'train' || here === t.to) {
      await ctx.db.delete(t._id);
      return;
    }
    if (!nearSpots(STATION_OF[here], p.position, 3)) {
      if (args.tries >= 4) {
        await ctx.db.delete(t._id);
        return;
      }
      const departAt = nextDeparture(Date.now() + 1000);
      await ctx.db.patch(t._id, { departAt, arriveAt: departAt + TRAIN_MINUTES * 1000 });
      await ctx.scheduler.runAt(departAt, internal.town.departTrain, { travelId: t._id, tries: args.tries + 1 });
      return;
    }
    const seat = (await ctx.db.query('townTravel').withIndex('worldId', (q) => q.eq('worldId', t.worldId)).collect())
      .filter((x) => x.boarded).length;
    const now = Date.now();
    const arriveAt = now + TRAIN_MINUTES * 1000;
    await insertInput(ctx, t.worldId, 'boardTrain', { playerId: t.playerId, seat });
    await ctx.db.patch(t._id, { boarded: true, departAt: now, arriveAt });
    await ctx.db.insert('townLog', {
      worldId: t.worldId,
      kind: 'train',
      title: '火車',
      text: `${t.name} 搭上往${REGION_NAMES[t.to]}的火車，預計 ${townClock(arriveAt)} 到站。`,
    });
    await ctx.scheduler.runAt(arriveAt, internal.town.arriveTrain, { travelId: t._id });
  },
});

// 玩家附身時按「搭車」
export const boardMyTrain = mutation({
  args: { worldId: v.id('worlds'), playerId: v.string() },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    const p = world?.players.find((x) => x.id === args.playerId);
    if (!p) throw new Error('找不到角色');
    const here = regionOf(p.position);
    if (here === 'train') throw new Error('已經在火車上了');
    if (!nearSpots(STATION_OF[here], p.position, 2)) throw new Error('要先走到火車站才能搭車');
    if (world!.conversations.some((c) => c.participants.some((m) => m.playerId === args.playerId)))
      throw new Error('聊天中不能搭車，先結束對話');
    const to = here === 'daxue' ? 'hualien' : 'daxue';
    const id = await doBoard(ctx, args.worldId, args.playerId, to);
    if (!id) throw new Error('已經在候車了');
    const t = await ctx.db.get(id);
    return t ? townClock(t.departAt ?? Date.now()) : null;
  },
});

export const arriveTrain = internalMutation({
  args: { travelId: v.id('townTravel') },
  handler: async (ctx, args) => {
    const t = await ctx.db.get(args.travelId);
    if (!t) return;
    await insertInput(ctx, t.worldId, 'arriveTrain', { playerId: t.playerId, to: t.to });
    await ctx.db.delete(t._id);
    await ctx.db.insert('townLog', {
      worldId: t.worldId,
      kind: 'train',
      title: '火車',
      text: `${t.name} 抵達${LOCATION_NAMES[STATION_OF[t.to]]}。`,
    });
  },
});

export const activeTravels = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('townTravel').withIndex('worldId', (q) => q.eq('worldId', args.worldId)).collect();
    return rows.map((r) => ({
      playerId: r.playerId,
      name: r.name,
      to: r.to,
      departAt: r.departAt ?? r.arriveAt - TRAIN_MINUTES * 1000,
      arriveAt: r.arriveAt,
      boarded: r.boarded ?? true,
    }));
  },
});

// ===== 和玩家聊天：直接搭話、婉拒、插話 =====
async function worldAndNames(ctx: MutationCtx, worldId: Id<'worlds'>) {
  const world = await ctx.db.get(worldId);
  if (!world) throw new Error('找不到小鎮');
  const rows = await ctx.db
    .query('playerDescriptions')
    .withIndex('worldId', (q) => q.eq('worldId', worldId))
    .collect();
  const nameOf = new Map(rows.map((r) => [r.playerId as string, r.name]));
  return { world, nameOf };
}

// 點角色「找他聊天」：可能被婉拒（一句話、不呼叫模型）；否則送出邀請，AI 會立刻接受
export const talkTo = mutation({
  args: { worldId: v.id('worlds'), playerId: v.string(), targetId: v.string() },
  handler: async (ctx, args) => {
    const { world, nameOf } = await worldAndNames(ctx, args.worldId);
    const me = world.players.find((p) => p.id === args.playerId);
    const target = world.players.find((p) => p.id === args.targetId);
    if (!me || !target) throw new Error('找不到角色');
    const name = nameOf.get(args.targetId) ?? '對方';
    if (!target.human) {
      const hold = await ctx.db
        .query('townHold')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.targetId))
        .first();
      const busyEvent = hold && hold.until > Date.now() && hold.eventId && !hold.eventId.startsWith('plan:');
      const dest = target.pathfinding?.destination;
      const farAway = dest && Math.abs(dest.x - target.position.x) + Math.abs(dest.y - target.position.y) > 12;
      if (busyEvent && Math.random() < 0.5) {
        return { declined: `${name.slice(-2)}：${declineLine()}` };
      }
      if (farAway && Math.random() < 0.4) {
        const where = SCHEDULE_PLACE(name);
        return { declined: `${name.slice(-2)}：${declineLine(where)}` };
      }
    }
    await insertInput(ctx, args.worldId, 'startConversation', { playerId: args.playerId, invitee: args.targetId });
    return { declined: null };
  },
});

function SCHEDULE_PLACE(name: string) {
  const loc = SCHEDULES[name]?.[slotIndex(Date.now())];
  return loc ? LOCATION_NAMES[loc] : undefined;
}

// 插話：對方正在和別人聊，原本的聊天對象說一句再見後離開，換你和他聊
export const joinTalk = mutation({
  args: { worldId: v.id('worlds'), playerId: v.string(), targetId: v.string() },
  handler: async (ctx, args) => {
    const { world, nameOf } = await worldAndNames(ctx, args.worldId);
    const conv = world.conversations.find((c) => c.participants.some((m) => m.playerId === args.targetId));
    if (!conv) {
      await insertInput(ctx, args.worldId, 'startConversation', { playerId: args.playerId, invitee: args.targetId });
      return { goodbye: null };
    }
    const partner = conv.participants.find((m) => m.playerId !== args.targetId)?.playerId;
    if (partner) {
      await insertInput(ctx, args.worldId, 'leaveConversation', { playerId: partner, conversationId: conv.id });
    }
    await insertInput(ctx, args.worldId, 'startConversation', { playerId: args.playerId, invitee: args.targetId });
    const pname = partner ? nameOf.get(partner) ?? '對方' : '對方';
    return { goodbye: `${pname.slice(-2)}：${goodbyeLine()}` };
  },
});

// ===== 邊想邊說：AI 回覆生成中的草稿 =====
export const setDraft = internalMutation({
  args: { worldId: v.id('worlds'), conversationId: v.string(), playerId: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    const old = await ctx.db
      .query('messageDrafts')
      .withIndex('conversation', (q) => q.eq('worldId', args.worldId).eq('conversationId', args.conversationId))
      .first();
    if (old) await ctx.db.patch(old._id, { text: args.text, playerId: args.playerId });
    else await ctx.db.insert('messageDrafts', args);
  },
});
export const clearDraft = internalMutation({
  args: { worldId: v.id('worlds'), conversationId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('messageDrafts')
      .withIndex('conversation', (q) => q.eq('worldId', args.worldId).eq('conversationId', args.conversationId))
      .collect();
    for (const r of rows) await ctx.db.delete(r._id);
  },
});
export const draft = query({
  args: { worldId: v.id('worlds'), conversationId: v.string() },
  handler: async (ctx, args) => {
    const d = await ctx.db
      .query('messageDrafts')
      .withIndex('conversation', (q) => q.eq('worldId', args.worldId).eq('conversationId', args.conversationId))
      .first();
    return d ? { playerId: d.playerId, text: d.text } : null;
  },
});

// ===== 聊完的回饋：好感變化與「他記住了」 =====
export const convWithHuman = internalQuery({
  args: { worldId: v.id('worlds'), conversationId: v.string(), playerId: v.string() },
  handler: async (ctx, args) => {
    const msgs = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) => q.eq('worldId', args.worldId).eq('conversationId', args.conversationId as any))
      .collect();
    const otherId = msgs.map((m) => m.author as string).find((a) => a !== args.playerId);
    if (!otherId) return null;
    const world = await ctx.db.get(args.worldId);
    const other = world?.players.find((p) => p.id === otherId);
    if (!other?.human) return null;
    const rows = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    const nameOf = new Map(rows.map((r) => [r.playerId as string, r.name]));
    return {
      aiName: nameOf.get(args.playerId) ?? '',
      humanName: nameOf.get(otherId) ?? '',
      transcript: msgs.map((m) => `${nameOf.get(m.author as string) ?? '?'}：${m.text}`).join('\n'),
    };
  },
});

export const recordFeedback = internalMutation({
  args: {
    worldId: v.id('worlds'),
    aiName: v.string(),
    humanName: v.string(),
    delta: v.number(),
    reason: v.string(),
    remembered: v.string(),
    facets: v.optional(v.array(v.string())),
    role: v.optional(v.string()),
    asker: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('townFeedback', args);
    const a = await ctx.db
      .query('townAffinity')
      .withIndex('pair', (q) => q.eq('worldId', args.worldId).eq('humanName', args.humanName).eq('aiName', args.aiName))
      .first();
    if (a) await ctx.db.patch(a._id, { score: Math.max(-10, Math.min(10, a.score + args.delta)) });
    else await ctx.db.insert('townAffinity', { worldId: args.worldId, aiName: args.aiName, humanName: args.humanName, score: args.delta });
  },
});

export const myFeedback = query({
  args: { worldId: v.id('worlds'), humanName: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('townFeedback')
      .withIndex('human', (q) => q.eq('worldId', args.worldId).eq('humanName', args.humanName))
      .order('desc')
      .take(1);
    return rows.map((r) => ({ id: r._id, aiName: r.aiName, delta: r.delta, reason: r.reason, remembered: r.remembered, time: r._creationTime, facets: r.facets, role: r.role, asker: r.asker }))[0] ?? null;
  },
});

// 永信旅人小鎮：練習紀錄（這個玩家扮演的顧問，和客人聊過幾次、平均問到幾個面向、解鎖幾位客人的旅人角色）
export const myPractice = query({
  args: { worldId: v.id('worlds'), humanName: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('townFeedback')
      .withIndex('human', (q) => q.eq('worldId', args.worldId).eq('humanName', args.humanName))
      .collect();
    const mine = rows.filter((r) => r.facets && r.asker === args.humanName);
    if (!mine.length) return null;
    const avg = mine.reduce((s, r) => s + (r.facets?.length ?? 0), 0) / mine.length;
    const unlocked = new Set(mine.filter((r) => r.role).map((r) => r.aiName));
    return { times: mine.length, avgFacets: Math.round(avg * 10) / 10, unlocked: unlocked.size };
  },
});

export const affinityOf = query({
  args: { worldId: v.id('worlds'), humanName: v.string(), aiName: v.string() },
  handler: async (ctx, args) => {
    const a = await ctx.db
      .query('townAffinity')
      .withIndex('pair', (q) => q.eq('worldId', args.worldId).eq('humanName', args.humanName).eq('aiName', args.aiName))
      .first();
    return a?.score ?? 0;
  },
});
