import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import closeImg from '../../assets/close.svg';
import { SelectElement } from './Player';
import { Messages } from './Messages';
import { toastOnError } from '../toasts';
import { useSendInput } from '../hooks/sendInput';
import { Player } from '../../convex/aiTown/player';
import { GameId } from '../../convex/aiTown/ids';
import { ServerGame } from '../hooks/serverGame';
import { publicIntro } from './CharacterSelect';
import { CUSTOMERS, extractProfile, isCustomer, isStaff } from '../../data/ystravel';

export default function PlayerDetails({
  worldId,
  engineId,
  game,
  playerId,
  setSelectedElement,
  scrollViewRef,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  game: ServerGame;
  playerId?: GameId<'players'>;
  setSelectedElement: SelectElement;
  scrollViewRef: React.RefObject<HTMLDivElement>;
}) {
  const humanTokenIdentifier = useQuery(api.world.userStatus, { worldId });

  const players = [...game.world.players.values()];
  const humanPlayer = players.find((p) => p.human === humanTokenIdentifier);
  const humanConversation = humanPlayer ? game.world.playerConversation(humanPlayer) : undefined;
  // Always select the other player if we're in a conversation with them.
  if (humanPlayer && humanConversation) {
    const otherPlayerIds = [...humanConversation.participants.keys()].filter(
      (p) => p !== humanPlayer.id,
    );
    playerId = otherPlayerIds[0];
  }

  const player = playerId && game.world.players.get(playerId);
  const playerConversation = player && game.world.playerConversation(player);

  const previousConversation = useQuery(
    api.world.previousConversation,
    playerId ? { worldId, playerId } : 'skip',
  );

  const playerDescription = playerId && game.playerDescriptions.get(playerId);

  const startConversation = useSendInput(engineId, 'startConversation');
  const acceptInvite = useSendInput(engineId, 'acceptInvite');
  const rejectInvite = useSendInput(engineId, 'rejectInvite');
  const leaveConversation = useSendInput(engineId, 'leaveConversation');
  // 直接搭話、插話、好感
  const talkTo = useMutation(api.town.talkTo);
  const joinTalk = useMutation(api.town.joinTalk);
  const [reply, setReply] = useState<string | null>(null);
  const myName = humanPlayer ? game.playerDescriptions.get(humanPlayer.id)?.name : undefined;
  const theirName = playerId ? game.playerDescriptions.get(playerId)?.name : undefined;
  const affinity = useQuery(
    api.town.affinityOf,
    myName && theirName && myName !== theirName ? { worldId, humanName: myName, aiName: theirName } : 'skip',
  );
  // 永信旅人小鎮：顧問和客人聊天時，從客人說的話整理客戶資料卡
  const showProfile = !!playerConversation && isStaff(myName) && isCustomer(theirName);
  const convMsgs = useQuery(
    api.messages.listMessages,
    showProfile && playerConversation ? { worldId, conversationId: playerConversation.id } : 'skip',
  );

  if (!playerId) {
    return (
      <div className="h-full text-xl flex text-center items-center p-4">
        點地圖上的角色，查看他的資料與對話。
      </div>
    );
  }
  if (!player) {
    return null;
  }
  const isMe = humanPlayer && player.id === humanPlayer.id;
  const canInvite = !isMe && !playerConversation && humanPlayer && !humanConversation;
  const sameConversation =
    !isMe &&
    humanPlayer &&
    humanConversation &&
    playerConversation &&
    humanConversation.id === playerConversation.id;

  const humanStatus =
    humanPlayer && humanConversation && humanConversation.participants.get(humanPlayer.id)?.status;
  const playerStatus = playerConversation && playerConversation.participants.get(playerId)?.status;

  const haveInvite = sameConversation && humanStatus?.kind === 'invited';
  const waitingForAccept =
    sameConversation && playerConversation.participants.get(playerId)?.status.kind === 'invited';
  const waitingForNearby =
    sameConversation && playerStatus?.kind === 'walkingOver' && humanStatus?.kind === 'walkingOver';

  const inConversationWithMe =
    sameConversation &&
    playerStatus?.kind === 'participating' &&
    humanStatus?.kind === 'participating';

  const busyWithOther =
    !isMe && !!humanPlayer && !!playerConversation && !sameConversation;
  const otherInConv =
    busyWithOther && playerConversation
      ? [...playerConversation.participants.keys()].find((id) => id !== playerId)
      : undefined;
  const otherName = otherInConv ? game.playerDescriptions.get(otherInConv)?.name : undefined;

  const onStartConversation = async () => {
    if (!humanPlayer || !playerId) {
      return;
    }
    setReply(null);
    try {
      const r = await talkTo({ worldId, playerId: humanPlayer.id, targetId: playerId });
      if (r.declined) setReply(r.declined);
    } catch (e: any) {
      toast.error(e?.message ?? String(e));
    }
  };
  const onJoin = async () => {
    if (!humanPlayer || !playerId) return;
    setReply(null);
    try {
      const r = await joinTalk({ worldId, playerId: humanPlayer.id, targetId: playerId });
      if (r.goodbye) setReply(r.goodbye);
    } catch (e: any) {
      toast.error(e?.message ?? String(e));
    }
  };
  void startConversation;
  const onAcceptInvite = async () => {
    if (!humanPlayer || !humanConversation || !playerId) {
      return;
    }
    await toastOnError(
      acceptInvite({
        playerId: humanPlayer.id,
        conversationId: humanConversation.id,
      }),
    );
  };
  const onRejectInvite = async () => {
    if (!humanPlayer || !humanConversation) {
      return;
    }
    await toastOnError(
      rejectInvite({
        playerId: humanPlayer.id,
        conversationId: humanConversation.id,
      }),
    );
  };
  const onLeaveConversation = async () => {
    if (!humanPlayer || !inConversationWithMe || !humanConversation) {
      return;
    }
    await toastOnError(
      leaveConversation({
        playerId: humanPlayer.id,
        conversationId: humanConversation.id,
      }),
    );
  };
  // const pendingSuffix = (inputName: string) =>
  //   [...inflightInputs.values()].find((i) => i.name === inputName) ? ' opacity-50' : '';

  const pendingSuffix = (s: string) => '';
  return (
    <>
      <div className="flex gap-4">
        <div className="box w-3/4 sm:w-full mr-auto">
          <h2 className="bg-brown-700 p-2 font-display text-2xl sm:text-4xl tracking-wider shadow-solid text-center">
            {playerDescription?.name}
          </h2>
          {affinity !== undefined && !isMe && myName && (
            <div className="bg-brown-800 px-2 py-1 text-center text-sm text-brown-200" title="信任：聊天後會依對話內容變化">
              {theirName?.slice(-2)} 對{myName.slice(-2)}的信任 {'♥'.repeat(Math.max(0, Math.min(10, affinity)))}
              {affinity <= 0 ? '♡' : ''} （{affinity}）
            </div>
          )}
        </div>
        <a
          className="button text-white shadow-solid text-2xl cursor-pointer pointer-events-auto"
          onClick={() => setSelectedElement(undefined)}
        >
          <h2 className="h-full bg-clay-700">
            <img className="w-4 h-4 sm:w-5 sm:h-5" src={closeImg} />
          </h2>
        </a>
      </div>
      {canInvite && (
        <a
          className={
            'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
            pendingSuffix('startConversation')
          }
          onClick={onStartConversation}
        >
          <div className="h-full bg-clay-700 text-center">
            <span>找他聊天</span>
          </div>
        </a>
      )}
      {reply && (
        <div className="mt-3 rounded border-2 border-clay-500 bg-brown-100 p-2 text-sm text-brown-900">💬 {reply}</div>
      )}
      {!humanPlayer && !isMe && (
        <div className="mt-4 rounded bg-brown-700 p-2 text-sm text-brown-100">
          你現在是旁觀者，只能看大家聊天。先按下方「選擇角色」扮演一位角色，才能找人聊天。
        </div>
      )}
      {busyWithOther && (
        <div className="mt-4 rounded bg-brown-700 p-2 text-sm text-brown-100">
          {playerDescription?.name} 正在和 {otherName ?? '別人'} 聊天。
          {!humanConversation && (
            <button onClick={onJoin} className="mt-2 block w-full rounded bg-clay-700 py-1 font-bold hover:bg-clay-500">
              走過去加入他們
            </button>
          )}
        </div>
      )}
      {!isMe && humanPlayer && humanConversation && !sameConversation && !playerConversation && (
        <div className="mt-4 rounded bg-brown-700 p-2 text-sm text-brown-100">
          你正在和別人聊天，先結束那段對話才能找他。
        </div>
      )}
      {waitingForAccept && (
        <a className="mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto opacity-50">
          <div className="h-full bg-clay-700 text-center">
            <span>等待對方回應…</span>
          </div>
        </a>
      )}
      {waitingForNearby && (
        <a className="mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto opacity-50">
          <div className="h-full bg-clay-700 text-center">
            <span>對方走過來中，靠近就能開聊…</span>
          </div>
        </a>
      )}
      {inConversationWithMe && (
        <a
          className={
            'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
            pendingSuffix('leaveConversation')
          }
          onClick={onLeaveConversation}
        >
          <div className="h-full bg-clay-700 text-center">
            <span>結束對話</span>
          </div>
        </a>
      )}
      {haveInvite && (
        <>
          <a
            className={
              'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
              pendingSuffix('acceptInvite')
            }
            onClick={onAcceptInvite}
          >
            <div className="h-full bg-clay-700 text-center">
              <span>接受</span>
            </div>
          </a>
          <a
            className={
              'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
              pendingSuffix('rejectInvite')
            }
            onClick={onRejectInvite}
          >
            <div className="h-full bg-clay-700 text-center">
              <span>拒絕</span>
            </div>
          </a>
        </>
      )}
      {!playerConversation && player.activity && player.activity.until > Date.now() && (
        <div className="box flex-grow mt-6">
          <h2 className="bg-brown-700 text-base sm:text-lg text-center">
            {player.activity.description}
          </h2>
        </div>
      )}
      <div className="desc my-6">
        <p className="leading-tight -m-4 bg-brown-700 text-base sm:text-sm">
          {!isMe && playerDescription && publicIntro(playerDescription.description)}
          {isMe && <i>This is you!</i>}
          {!isMe && inConversationWithMe && (
            <>
              <br />
              <br />(<i>Conversing with you!</i>)
            </>
          )}
        </p>
      </div>
      {showProfile && theirName && convMsgs && (
        <ProfileCard
          name={theirName}
          lines={convMsgs.filter((m) => m.authorName === theirName).map((m) => m.text)}
        />
      )}
      {!isMe && playerConversation && playerStatus?.kind === 'participating' && (
        <Messages
          worldId={worldId}
          engineId={engineId}
          inConversationWithMe={inConversationWithMe ?? false}
          conversation={{ kind: 'active', doc: playerConversation }}
          humanPlayer={humanPlayer}
          scrollViewRef={scrollViewRef}
        />
      )}
      {!playerConversation && previousConversation && (
        <>
          <div className="box flex-grow">
            <h2 className="bg-brown-700 text-lg text-center">Previous conversation</h2>
          </div>
          <Messages
            worldId={worldId}
            engineId={engineId}
            inConversationWithMe={false}
            conversation={{ kind: 'archived', doc: previousConversation }}
            humanPlayer={humanPlayer}
            scrollViewRef={scrollViewRef}
          />
        </>
      )}
    </>
  );
}

// 永信旅人小鎮：客戶資料卡（聊天中自動填入；只整理客人自己說出口的內容）
function ProfileCard({ name, lines }: { name: string; lines: string[] }) {
  const p = extractProfile(lines);
  const rows: [string, string | undefined][] = [
    ['節奏', p.pace],
    ['取向', p.focus],
    ['預算', p.budget],
    ['旅伴', p.mate],
    ['避雷', p.avoid],
  ];
  return (
    <div className="mt-6 rounded bg-brown-700 p-2 text-sm">
      <div className="font-bold text-brown-200">
        客戶資料卡：{name}（{CUSTOMERS[name]?.status ?? '客人'}）
      </div>
      <div className="mt-1 grid grid-cols-[48px_1fr] gap-x-2 gap-y-0.5">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <span className="font-bold text-brown-300">{k}</span>
            <span className={v ? 'text-brown-100' : 'text-clay-300'}>{v ?? '還沒問到'}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 text-xs text-brown-300">聊天中自動填入；正式上線時會同步到 CRM 的客戶資料卡</div>
    </div>
  );
}
