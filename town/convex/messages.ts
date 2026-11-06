import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { insertInput } from './aiTown/insertInput';
import { conversationId, playerId } from './aiTown/ids';

export const listMessages = query({
  args: {
    worldId: v.id('worlds'),
    conversationId,
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) => q.eq('worldId', args.worldId).eq('conversationId', args.conversationId))
      .collect();
    const out = [];
    for (const message of messages) {
      const playerDescription = await ctx.db
        .query('playerDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', message.author))
        .first();
      if (!playerDescription) {
        throw new Error(`Invalid author ID: ${message.author}`);
      }
      out.push({ ...message, authorName: playerDescription.name });
    }
    return out;
  },
});

export const writeMessage = mutation({
  args: {
    worldId: v.id('worlds'),
    conversationId,
    messageUuid: v.string(),
    playerId,
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      author: args.playerId,
      messageUuid: args.messageUuid,
      text: args.text,
      worldId: args.worldId,
    });
    await insertInput(ctx, args.worldId, 'finishSendingMessage', {
      conversationId: args.conversationId,
      playerId: args.playerId,
      timestamp: Date.now(),
    });
  },
});

// 全鎮最新對話（動態牆用）
export const recentMessages = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const latest = await ctx.db.query('messages').order('desc').take(400);
    const names = new Map<string, string>();
    const out = [];
    for (const m of latest) {
      if (m.worldId !== args.worldId) continue;
      let name = names.get(m.author);
      if (!name) {
        const pd = await ctx.db
          .query('playerDescriptions')
          .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', m.author))
          .first();
        name = pd?.name ?? '路人';
        names.set(m.author, name);
      }
      out.push({ id: m._id, author: name, text: m.text, conversationId: m.conversationId, time: m._creationTime });
      if (out.length >= 200) break;
    }
    return out;
  },
});
