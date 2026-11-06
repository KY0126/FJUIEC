import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';
import { aiTownTables } from './aiTown/schema';
import { conversationId, playerId } from './aiTown/ids';
import { engineTables } from './engine/schema';

export default defineSchema({
  music: defineTable({
    storageId: v.string(),
    type: v.union(v.literal('background'), v.literal('player')),
  }),

  messages: defineTable({
    conversationId,
    messageUuid: v.string(),
    author: playerId,
    text: v.string(),
    worldId: v.optional(v.id('worlds')),
  })
    .index('conversationId', ['worldId', 'conversationId'])
    .index('messageUuid', ['conversationId', 'messageUuid']),

  // 事件與 IG 群組紀錄
  townLog: defineTable({
    worldId: v.id('worlds'),
    kind: v.union(v.literal('event'), v.literal('ig'), v.literal('train'), v.literal('call')),
    title: v.string(),
    author: v.optional(v.string()),
    text: v.string(),
  }).index('worldId', ['worldId']),

  // 花蓮支線：搭火車中的角色
  townTravel: defineTable({
    worldId: v.id('worlds'),
    playerId: v.string(),
    name: v.string(),
    to: v.string(),
    departAt: v.optional(v.number()),
    arriveAt: v.number(),
    boarded: v.optional(v.boolean()),
    eventId: v.optional(v.string()),
  }).index('worldId', ['worldId', 'playerId']),

  // 和玩家聊天：AI 回覆生成中的草稿（邊想邊說）
  messageDrafts: defineTable({
    worldId: v.id('worlds'),
    conversationId: v.string(),
    playerId: v.string(),
    text: v.string(),
  }).index('conversation', ['worldId', 'conversationId']),

  // 和玩家聊完後的回饋：好感變化與「他記住了」
  townFeedback: defineTable({
    worldId: v.id('worlds'),
    aiName: v.string(),
    humanName: v.string(),
    delta: v.number(),
    reason: v.string(),
    remembered: v.string(),
    // 永信旅人小鎮：問到的面向、解鎖的旅人角色、提問的人（顧問）
    facets: v.optional(v.array(v.string())),
    role: v.optional(v.string()),
    asker: v.optional(v.string()),
  }).index('human', ['worldId', 'humanName']),
  townAffinity: defineTable({
    worldId: v.id('worlds'),
    aiName: v.string(),
    humanName: v.string(),
    score: v.number(),
  }).index('pair', ['worldId', 'humanName', 'aiName']),

  // 事件期間把角色留在事件地點（取代作息）
  townHold: defineTable({
    worldId: v.id('worlds'),
    playerId: v.string(),
    loc: v.string(),
    until: v.number(),
    eventId: v.optional(v.string()),
    met: v.optional(v.boolean()),
  }).index('worldId', ['worldId', 'playerId']),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,
});
