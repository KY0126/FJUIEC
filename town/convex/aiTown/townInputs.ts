// 事件投放、搭火車、事件提醒過期
import { v } from 'convex/values';
import { inputHandler } from './inputHandler';
import { Game } from './game';
import { Player } from './player';
import { blocked, movePlayer, stopPlayer } from './movement';
import { Conversation } from './conversation';
import { LOCATION_SPOTS, STATION_OF, TOWN_EVENTS, TownEvent, nearSpots, regionOf, trainSeat } from '../../data/town';
import { parseGameId } from './ids';

const RECENT = '\n【最近發生的事】';

function playerByName(game: Game, name: string) {
  for (const [id, d] of game.playerDescriptions) {
    if (d.name === name) return game.world.players.get(id);
  }
  return undefined;
}

function inConversation(game: Game, p: Player) {
  return [...game.world.conversations.values()].some((c) => c.participants.has(p.id));
}

function agentOf(game: Game, p: Player) {
  return [...game.world.agents.values()].find((a) => a.playerId === p.id);
}

// 讓相關角色記得這件事（寫進對話目標），3 小時後由 expireTownNote 淡忘
function rememberEvent(game: Game, ev: TownEvent, players: Player[]) {
  for (const p of players) {
    const agent = agentOf(game, p);
    if (!agent) continue;
    const desc = game.agentDescriptions.get(agent.id);
    if (!desc) continue;
    desc.plan = desc.plan.split(RECENT)[0] + RECENT + ev.desc + ' 你會依自己的個性回應這件事。';
    agent.lastConversation = undefined;
    agent.lastInviteAttempt = undefined;
  }
  game.descriptionsModified = true;
}

// 讓 a、b 開始聊天（發起者一定是 AI，兩人會自己走向對方）
function startTalk(game: Game, now: number, a: Player, b: Player) {
  if (inConversation(game, a) || inConversation(game, b)) return;
  const inviter = !a.human ? a : !b.human ? b : undefined;
  if (!inviter) return;
  const invitee = inviter === a ? b : a;
  Conversation.start(game, now, inviter, invitee);
}

function eventPlayers(game: Game, ev: TownEvent) {
  return ev.involved.map((n) => playerByName(game, n)).filter((p): p is Player => !!p);
}

export const townInputs = {
  triggerTownEvent: inputHandler({
    args: { eventId: v.string() },
    handler: (game: Game, now: number, args) => {
      const ev = TOWN_EVENTS.find((e) => e.id === args.eventId);
      if (!ev) throw new Error(`找不到事件 ${args.eventId}`);
      const players = eventPlayers(game, ev);
      rememberEvent(game, ev, players);
      if (ev.kind === 'call' || !ev.loc) {
        // 家人來電：不移動角色；有兩個人以上時，第一位會去找第二位聊
        if (players.length >= 2 && regionOf(players[0].position) === regionOf(players[1].position)) {
          startTalk(game, now, players[0], players[1]);
        }
        return null;
      }
      // 同一區的 AI 角色走去事件地點（不再瞬移）；不同區的角色由作息邏輯帶去搭火車
      const spots = [...(LOCATION_SPOTS[ev.loc] ?? [])].sort(() => Math.random() - 0.5);
      const evRegion = regionOf({ x: spots[0]?.[0] ?? 0, y: spots[0]?.[1] ?? 1 });
      const here = players.filter((p) => regionOf(p.position) === evRegion);
      for (const p of here) {
        if (p.human || inConversation(game, p)) continue;
        while (spots.length) {
          const [x, y] = spots.pop()!;
          if (!blocked(game, now, { x, y }, p.id)) {
            movePlayer(game, now, p, { x, y });
            break;
          }
        }
      }
      // 不在這裡開聊：角色走到事件地點後，由 town.eventArrived 觸發 eventMeet
      return null;
    },
  }),

  // 角色走到事件地點後，找已在現場（或同區）的事件相關角色聊天
  eventMeet: inputHandler({
    args: { eventId: v.string(), playerId: v.string() },
    handler: (game: Game, now: number, args) => {
      const ev = TOWN_EVENTS.find((e) => e.id === args.eventId);
      const me = game.world.players.get(parseGameId('players', args.playerId));
      if (!ev || !me) return null;
      const region = regionOf(me.position);
      const others = eventPlayers(game, ev).filter(
        (p) => p.id !== me.id && regionOf(p.position) === region && !inConversation(game, p),
      );
      const atPlace = others.filter((p) => nearSpots(ev.loc, p.position, 2));
      const partner = atPlace[0] ?? others[0];
      if (partner) startTalk(game, now, me, partner);
      return null;
    },
  }),

  // 「最近發生的事」3 小時後淡忘（如果沒有被新事件蓋掉）
  expireTownNote: inputHandler({
    args: { eventId: v.string() },
    handler: (game: Game, _now: number, args) => {
      const ev = TOWN_EVENTS.find((e) => e.id === args.eventId);
      if (!ev) return null;
      for (const p of eventPlayers(game, ev)) {
        const agent = agentOf(game, p);
        const desc = agent && game.agentDescriptions.get(agent.id);
        if (desc && desc.plan.includes(RECENT + ev.desc)) {
          desc.plan = desc.plan.split(RECENT)[0];
          game.descriptionsModified = true;
        }
      }
      return null;
    },
  }),

  // 花蓮支線：上車（角色暫時離開地圖）
  boardTrain: inputHandler({
    args: { playerId: v.string(), seat: v.number() },
    handler: (game: Game, now: number, args) => {
      const p = game.world.players.get(parseGameId('players', args.playerId));
      if (!p) return null;
      const conv = game.world.playerConversation(p);
      if (conv) conv.leave(game, now, p);
      stopPlayer(p);
      delete p.activity;
      p.position = trainSeat(args.seat);
      return null;
    },
  }),

  // 花蓮支線：到站（出現在目的地車站）
  arriveTrain: inputHandler({
    args: { playerId: v.string(), to: v.string() },
    handler: (game: Game, now: number, args) => {
      const p = game.world.players.get(parseGameId('players', args.playerId));
      if (!p) return null;
      const spots = [...(LOCATION_SPOTS[STATION_OF[args.to]] ?? [])].sort(() => Math.random() - 0.5);
      stopPlayer(p);
      for (const [x, y] of spots) {
        if (!blocked(game, now, { x, y }, p.id)) {
          p.position = { x, y };
          break;
        }
      }
      return null;
    },
  }),
};
