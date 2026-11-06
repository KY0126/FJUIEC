import clsx from 'clsx';
import { Doc, Id } from '../../convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { MessageInput } from './MessageInput';
import { Player } from '../../convex/aiTown/player';
import { Conversation } from '../../convex/aiTown/conversation';
import { useEffect, useRef } from 'react';

export function Messages({
  worldId,
  engineId,
  conversation,
  inConversationWithMe,
  humanPlayer,
  scrollViewRef,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  conversation:
    | { kind: 'active'; doc: Conversation }
    | { kind: 'archived'; doc: Doc<'archivedConversations'> };
  inConversationWithMe: boolean;
  humanPlayer?: Player;
  scrollViewRef: React.RefObject<HTMLDivElement>;
}) {
  const humanPlayerId = humanPlayer?.id;
  const descriptions = useQuery(api.world.gameDescriptions, { worldId });
  const messages = useQuery(api.messages.listMessages, {
    worldId,
    conversationId: conversation.doc.id,
  });
  // 邊想邊說，顯示 AI 正在生成的文字
  const draft = useQuery(
    api.town.draft,
    conversation.kind === 'active' ? { worldId, conversationId: conversation.doc.id } : 'skip',
  );
  let currentlyTyping = conversation.kind === 'active' ? conversation.doc.isTyping : undefined;
  if (messages !== undefined && currentlyTyping) {
    if (messages.find((m) => m.messageUuid === currentlyTyping!.messageUuid)) {
      currentlyTyping = undefined;
    }
  }
  const currentlyTypingName =
    currentlyTyping &&
    descriptions?.playerDescriptions.find((p) => p.playerId === currentlyTyping?.playerId)?.name;

  const scrollView = scrollViewRef.current;
  const isScrolledToBottom = useRef(true);
  useEffect(() => {
    if (!scrollView) return undefined;

    const onScroll = () => {
      // 最新訊息在最上面，捲在頂端附近時才自動跟著新訊息
      isScrolledToBottom.current = !!(scrollView && scrollView.scrollTop <= 50);
    };
    scrollView.addEventListener('scroll', onScroll);
    return () => scrollView.removeEventListener('scroll', onScroll);
  }, [scrollView]);
  useEffect(() => {
    if (isScrolledToBottom.current) {
      scrollViewRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [messages, currentlyTyping]);

  if (messages === undefined) {
    return null;
  }
  if (messages.length === 0 && !inConversationWithMe) {
    return null;
  }
  const messageNodes: { time: number; node: React.ReactNode }[] = messages.map((m) => {
    const node = (
      <div key={`text-${m._id}`} className="leading-snug mb-2">
        <div className="flex gap-2 text-xs">
          <span className="font-bold flex-grow">{m.authorName}</span>
          <time dateTime={m._creationTime.toString()} className="text-brown-700">
            {new Date(m._creationTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
        <div className={clsx('bubble', m.author === humanPlayerId && 'bubble-mine')}>
          <p className="bg-white -mx-3 -my-1">{m.text}</p>
        </div>
      </div>
    );
    return { node, time: m._creationTime };
  });
  const lastMessageTs = messages.map((m) => m._creationTime).reduce((a, b) => Math.max(a, b), 0);

  const membershipNodes: typeof messageNodes = [];
  if (conversation.kind === 'active') {
    for (const [playerId, m] of conversation.doc.participants) {
      const playerName = descriptions?.playerDescriptions.find((p) => p.playerId === playerId)
        ?.name;
      let started;
      if (m.status.kind === 'participating') {
        started = m.status.started;
      }
      if (started) {
        membershipNodes.push({
          node: (
            <div key={`joined-${playerId}`} className="leading-tight mb-2 text-xs">
              <p className="text-brown-700 text-center">{playerName} 加入對話</p>
            </div>
          ),
          time: started,
        });
      }
    }
  } else {
    for (const playerId of conversation.doc.participants) {
      const playerName = descriptions?.playerDescriptions.find((p) => p.playerId === playerId)
        ?.name;
      const started = conversation.doc.created;
      membershipNodes.push({
        node: (
          <div key={`joined-${playerId}`} className="leading-tight mb-2 text-xs">
            <p className="text-brown-700 text-center">{playerName} 加入對話</p>
          </div>
        ),
        time: started,
      });
      const ended = conversation.doc.ended;
      membershipNodes.push({
        node: (
          <div key={`left-${playerId}`} className="leading-tight mb-2 text-xs">
            <p className="text-brown-700 text-center">{playerName} 離開對話</p>
          </div>
        ),
        // Always sort all "left" messages after the last message.
        // TODO: We can remove this once we want to support more than two participants per conversation.
        time: Math.max(lastMessageTs + 1, ended),
      });
    }
  }
  const nodes = [...messageNodes, ...membershipNodes];
  nodes.sort((a, b) => b.time - a.time); // 最新的在最上面
  return (
    <div className="chats text-base sm:text-sm">
      <div className="bg-brown-200 text-black p-2">
        {humanPlayer && inConversationWithMe && conversation.kind === 'active' && (
          <MessageInput
            worldId={worldId}
            engineId={engineId}
            conversation={conversation.doc}
            humanPlayer={humanPlayer}
          />
        )}
        {currentlyTyping && currentlyTyping.playerId !== humanPlayerId && (
          <div key="typing" className="leading-tight mb-2 text-xs">
            <div className="flex gap-4">
              <span className="uppercase flex-grow">{currentlyTypingName}</span>
              <time dateTime={currentlyTyping.since.toString()}>
                {new Date(currentlyTyping.since).toLocaleString()}
              </time>
            </div>
            <div className={clsx('bubble')}>
              <p className="bg-white -mx-3 -my-1">
                {draft && draft.playerId === currentlyTyping.playerId && draft.text ? (
                  <span>
                    {draft.text}
                    <span className="animate-pulse">▍</span>
                  </span>
                ) : (
                  <i>思考中…</i>
                )}
              </p>
            </div>
          </div>
        )}
        {nodes.length > 0 && nodes.map((n) => n.node)}
      </div>
    </div>
  );
}
