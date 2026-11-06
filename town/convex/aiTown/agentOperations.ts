import { chatCompletion } from '../util/llm';
import { LOCATION_SPOTS, SCHEDULES, STATION_OF, locRegion, nearSpots, regionOf, slotIndex } from '../../data/town';
import { practiceResult } from '../../data/ystravel';
import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { WorldMap, serializedWorldMap } from './worldMap';
import { rememberConversation } from '../agent/memory';
import { GameId, agentId, conversationId, playerId } from './ids';
import {
  continueConversationMessage,
  leaveConversationMessage,
  startConversationMessage,
} from '../agent/conversation';
import { assertNever } from '../util/assertNever';
import { serializedAgent } from './agent';
import { ACTIVITIES, ACTIVITY_COOLDOWN, CONVERSATION_COOLDOWN } from '../constants';
import { api, internal } from '../_generated/api';
import { sleep } from '../util/sleep';
import { serializedPlayer } from './player';

export const agentRememberConversation = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    const remembered = await rememberConversation(
      ctx,
      args.worldId,
      args.agentId as GameId<'agents'>,
      args.playerId as GameId<'players'>,
      args.conversationId as GameId<'conversations'>,
    );
    // 和玩家聊完，計算好感變化並顯示「他記住了」（背景執行，不擋聊天）
    try {
      const info = await ctx.runQuery(internal.town.convWithHuman, {
        worldId: args.worldId,
        conversationId: args.conversationId,
        playerId: args.playerId,
      });
      if (info) {
        const { content } = await chatCompletion({
          messages: [
            {
              role: 'user',
              content: `以下是${info.aiName}和${info.humanName}的對話：\n${info.transcript}\n\n站在${info.aiName}的角度，這段對話讓他對${info.humanName}的信任改變多少？只輸出一行，格式：「數字｜理由」，數字是 -2 到 3 的整數，理由用繁體中文 15 字以內、從${info.aiName}的角度、用第一人稱寫。`,
            },
          ],
          max_tokens: 40,
        });
        const m = content.match(/([+-]?\d)\s*[｜|]\s*(.+)/);
        const delta = m ? Math.max(-2, Math.min(3, parseInt(m[1], 10))) : 0;
        const reason = (m ? m[2] : '').trim().slice(0, 30);
        const mem = (remembered ?? '').split('｜').slice(1).join('｜').trim().slice(0, 80);
        // 永信旅人小鎮：問到的面向與解鎖的旅人角色（關鍵字判斷，不呼叫模型）
        const pr = practiceResult(info.transcript, info.aiName, info.humanName);
        await ctx.runMutation(internal.town.recordFeedback, {
          worldId: args.worldId,
          aiName: info.aiName,
          humanName: info.humanName,
          delta,
          reason,
          remembered: mem,
          ...(pr ? { facets: pr.facets, role: pr.role, asker: pr.asker } : {}),
        });
      }
    } catch (e: any) {
      console.log('好感回饋失敗', e?.message);
    }
    // 聊完檢查有沒有約定要去哪裡（兩位參與者各跑一次，town.detectPlan 會去重）
    await ctx.runMutation(internal.town.detectPlan, {
      worldId: args.worldId,
      conversationId: args.conversationId,
    });
    await sleep(Math.random() * 1000);
    await ctx.runMutation(api.aiTown.main.sendInput, {
      worldId: args.worldId,
      name: 'finishRememberConversation',
      args: {
        agentId: args.agentId,
        operationId: args.operationId,
      },
    });
  },
});

export const agentGenerateMessage = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    otherPlayerId: playerId,
    operationId: v.string(),
    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
    messageUuid: v.string(),
  },
  handler: async (ctx, args) => {
    let completionFn;
    switch (args.type) {
      case 'start':
        completionFn = startConversationMessage;
        break;
      case 'continue':
        completionFn = continueConversationMessage;
        break;
      case 'leave':
        completionFn = leaveConversationMessage;
        break;
      default:
        assertNever(args.type);
    }
    const text = await completionFn(
      ctx,
      args.worldId,
      args.conversationId as GameId<'conversations'>,
      args.playerId as GameId<'players'>,
      args.otherPlayerId as GameId<'players'>,
      // 邊想邊說，生成中的文字先寫成草稿給畫面顯示
      async (draft: string) => {
        await ctx.runMutation(internal.town.setDraft, {
          worldId: args.worldId,
          conversationId: args.conversationId,
          playerId: args.playerId,
          text: draft,
        });
      },
    );

    await ctx.runMutation(internal.town.clearDraft, { worldId: args.worldId, conversationId: args.conversationId });
    await ctx.runMutation(internal.aiTown.agent.agentSendMessage, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      playerId: args.playerId,
      text,
      messageUuid: args.messageUuid,
      leaveConversation: args.type === 'leave',
      operationId: args.operationId,
    });
  },
});

export const agentDoSomething = internalAction({
  args: {
    worldId: v.id('worlds'),
    player: v.object(serializedPlayer),
    agent: v.object(serializedAgent),
    map: v.object(serializedWorldMap),
    otherFreePlayers: v.array(v.object(serializedPlayer)),
    operationId: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { player, agent } = args;
    // 事件期間去事件地點，否則依作息決定該去的地點
    const hold = await ctx.runQuery(internal.town.getHold, { worldId: args.worldId, playerId: player.id });
    const scheduled = hold ? spotFor(hold.loc) : scheduledSpot(args.name, Date.now());
    const pos = player.position;
    // 花蓮支線：要去的地方在另一個區域 → 先走到車站，到了就搭車
    if (scheduled && !player.pathfinding) {
      const here = regionOf(pos);
      const want = locRegion(scheduled.loc);
      if (here !== 'train' && here !== want) {
        const station = STATION_OF[here];
        if (nearSpots(station, pos, 1)) {
          await ctx.runMutation(internal.town.boardTrain, { worldId: args.worldId, playerId: player.id, to: want });
          await ctx.runMutation(api.aiTown.main.sendInput, {
            worldId: args.worldId,
            name: 'finishDoSomething',
            args: { operationId: args.operationId, agentId: agent.id },
          });
          return;
        }
        const st = LOCATION_SPOTS[station];
        const [x, y] = st[Math.floor(Math.random() * st.length)];
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: { operationId: args.operationId, agentId: agent.id, destination: { x, y } },
        });
        return;
      }
    }
    const atPlace =
      !scheduled ||
      scheduled.spots.some((s) => Math.abs(s[0] - Math.floor(pos.x)) + Math.abs(s[1] - Math.floor(pos.y)) <= 1);
    // 到了事件地點：通知 town.eventArrived，現場有其他相關角色就開聊
    if (hold?.eventId && !hold.eventId.startsWith('plan:') && !hold.met && atPlace && scheduled) {
      await ctx.runMutation(internal.town.eventArrived, { worldId: args.worldId, playerId: player.id });
    }
    if (scheduled && !atPlace && !player.pathfinding) {
      await sleep(Math.random() * 1000);
      await ctx.runMutation(api.aiTown.main.sendInput, {
        worldId: args.worldId,
        name: 'finishDoSomething',
        args: { operationId: args.operationId, agentId: agent.id, destination: scheduled.pick() },
      });
      return;
    }
    const map = new WorldMap(args.map);
    const now = Date.now();
    // Don't try to start a new conversation if we were just in one.
    const justLeftConversation =
      agent.lastConversation && now < agent.lastConversation + CONVERSATION_COOLDOWN;
    // Don't try again if we recently tried to find someone to invite.
    const recentlyAttemptedInvite =
      agent.lastInviteAttempt && now < agent.lastInviteAttempt + CONVERSATION_COOLDOWN;
    const recentActivity = player.activity && now < player.activity.until + ACTIVITY_COOLDOWN;
    // Decide whether to do an activity or wander somewhere.
    if (!player.pathfinding) {
      if (recentActivity || justLeftConversation) {
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            destination: scheduled ? scheduled.pick() : wanderDestination(map, player.position),
          },
        });
        return;
      } else {
        // TODO: have LLM choose the activity & emoji
        const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            activity: {
              description: activity.description,
              emoji: activity.emoji,
              until: Date.now() + activity.duration,
            },
          },
        });
        return;
      }
    }
    const invitee =
      justLeftConversation || recentlyAttemptedInvite
        ? undefined
        : await ctx.runQuery(internal.aiTown.agent.findConversationCandidate, {
            now,
            worldId: args.worldId,
            player: args.player,
            otherFreePlayers: args.otherFreePlayers,
          });

    // TODO: We hit a lot of OCC errors on sending inputs in this file. It's
    // easy for them to get scheduled at the same time and line up in time.
    await sleep(Math.random() * 1000);
    await ctx.runMutation(api.aiTown.main.sendInput, {
      worldId: args.worldId,
      name: 'finishDoSomething',
      args: {
        operationId: args.operationId,
        agentId: args.agent.id,
        invitee,
      },
    });
  },
});

function scheduledSpot(name: string | undefined, now: number) {
  if (!name) return null;
  return spotFor(SCHEDULES[name]?.[slotIndex(now)]);
}

function spotFor(loc: string | undefined) {
  const spots = loc ? LOCATION_SPOTS[loc] : undefined;
  if (!spots || spots.length === 0) return null;
  return {
    loc: loc as string,
    spots,
    pick: () => {
      const [x, y] = spots[Math.floor(Math.random() * spots.length)];
      return { x, y };
    },
  };
}

function wanderDestination(worldMap: WorldMap, pos: { x: number; y: number }) {
  // 只在自己所在的區域裡閒晃
  const half = Math.floor(worldMap.width / 2);
  const x0 = regionOf(pos) === 'hualien' ? half : 0;
  return {
    x: x0 + 1 + Math.floor(Math.random() * (half - 2)),
    y: 1 + Math.floor(Math.random() * (worldMap.height - 2)),
  };
}
