import { data as f1SpritesheetData } from './spritesheets/f1';
import { data as f2SpritesheetData } from './spritesheets/f2';
import { data as f3SpritesheetData } from './spritesheets/f3';
import { data as f4SpritesheetData } from './spritesheets/f4';
import { data as f5SpritesheetData } from './spritesheets/f5';
import { data as f6SpritesheetData } from './spritesheets/f6';
import { data as f7SpritesheetData } from './spritesheets/f7';
import { data as f8SpritesheetData } from './spritesheets/f8';
import { data as walkSpritesheetData } from './spritesheets/walk';

// 永信旅人小鎮：兩位顧問、五位客人。客人的旅行偏好放在「【以下只有自己知道】」之後，別人看不到，要問對問題才會說出來。
const RULE =
  '說話規則：你還沒決定要去歐洲哪裡。別人問你想去哪個國家、哪個城市時，只說「都可以」「還沒想好」這類的話，不要主動說出下面的偏好。別人問到你怎麼旅行（例如第一天想怎麼過、喜歡排滿還是悠閒、想帶回什麼、想去哪種餐廳、預算多少、跟誰去、最不想遇到什麼安排）時，才照實回答被問到的那一項。不要說出自己是哪一型旅人。';
export const Descriptions = [
  {
    name: '林家瑋',
    character: 'f7',
    identity: `林家瑋，24 歲，永信旅遊門市的新進顧問，到職三個月，認真、有禮貌，但經驗還少。外觀：橘棕色短髮、白襯衫。說話風格：客氣、有點緊張，常說「您好」「我幫您看看」。
【以下只有自己知道】
習慣：客人一進門就先問「想去哪些國家？」，客人答不出來時，就傳官網連結請客人自己看。心裡知道這樣不太好，想跟資深顧問王美玲學怎麼問。`,
    plan: `把每位客人接待好，學會在客人說「都可以」時還能問出他想要的旅行`,
  },
  {
    name: '王美玲',
    character: 'f8',
    identity: `王美玲，45 歲，永信旅遊資深顧問，帶過很多歐洲團，最近在門市推「旅行風格測驗」與歐洲旅人護照。外觀：金色長髮、深色西裝外套。說話風格：親切、問題短，一次只問一件事，會先重複客人說的重點再往下問（例：「所以您比較想慢慢逛，對嗎？那預算大概抓多少？」）。
【以下只有自己知道】
做法：客人說「都可以」時，不問去哪裡，改問怎麼旅行：第一天想怎麼過、想帶回什麼、預算、跟誰去、最不想遇到什麼安排；問到三項以上才推薦行程，推薦時說出原因，並邀請客人做 1 分鐘的旅行風格測驗、加永信 LINE。遇到老客，會先翻他的旅人護照，聊還沒點亮的區域。也願意教新人家瑋。`,
    plan: `用「先問怎麼旅行」的方式幫客人找到適合的行程，並帶新人家瑋上手`,
  },
  {
    name: '林雅婷',
    character: 'f6',
    identity: `林雅婷，28 歲，在台北做行銷企劃，在 IG 看到朋友的歐洲照片，最近也想去，下班常到咖啡廳坐坐。外觀：粉紅長髮、格紋上衣。說話風格：直接、怕麻煩，常說「告訴我幾個適合我的就好」。
【以下只有自己知道】
旅行偏好：不喜歡一直趕路，到新城市的第一天想先找間咖啡廳坐坐；想像當地人一樣生活，對市集、美術館、藝術有興趣；預算 10 到 13 萬；想在暑假和大學好友一起去；最怕每天換飯店。之前在旅行社 LINE 被問「想去哪個國家」答不出來，收到一長串行程連結就關掉了。
${RULE}`,
    plan: `找到一趟不用自己研究、又不會一直趕路的歐洲行程`,
  },
  {
    name: '陳建宏',
    character: 'f1',
    identity: `陳建宏，56 歲，在台中自營生意，2022 到 2024 年每年都跟永信出一次歐洲團，去過德瑞、法國、義大利；最後一次是 2024 年 3 月，之後忙生意就沒再出團。最近生意穩定了，常到海濱公園散步。外觀：灰白短髮、藍色襯衫。說話風格：穩重、講話慢，常說「有新的深度路線，我會考慮」。
【以下只有自己知道】
旅行偏好：喜歡半天跟導覽、半天自由走走；名景和在地生活都喜歡；預算 13 到 16 萬；想和太太一起去；最怕凌晨集合、每天拉車超過五小時。北歐、西班牙、葡萄牙還沒去過，對葡萄牙最好奇。收到跟自己無關的促銷訊息通常已讀不回。
${RULE}`,
    plan: `找一趟和太太一起去、沒去過的地方的歐洲行程`,
  },
  {
    name: '張家豪',
    character: 'f2',
    identity: `張家豪，42 歲，科技業主管，在辦公大樓上班，今年想帶家人第一次去歐洲。外觀：短髮、綠色上衣。說話風格：講重點、重效率，常問「這樣幾天可以看完？」
【以下只有自己知道】
旅行偏好：假期只有 9 天，希望行程排滿、經典一次看完；想看羅浮宮、艾菲爾鐵塔、新天鵝堡這類名景；預算每人 13 到 16 萬；和太太、國中的女兒一起去；最怕自由活動太多、行程臨時更改。
${RULE}`,
    plan: `在有限的假期裡，帶家人把歐洲經典一次看完`,
  },
  {
    name: '黃淑芬',
    character: 'f3',
    identity: `黃淑芬，52 歲，經營診所，跟過永信兩次歐洲團，喜歡逛書店和聽旅遊講座。外觀：黑色長髮、灰色洋裝。說話風格：有禮但挑剔，常說「這個飯店在市區嗎？」
【以下只有自己知道】
旅行偏好：行程可以緊湊，但品質要好；想吃好餐廳、去酒莊、住市區的好飯店；預算 16 萬以上；和姊姊兩個人去；最怕住郊區飯店、每餐都是團體桌菜。
${RULE}`,
    plan: `找一趟吃得好、住得好的歐洲深度團`,
  },
  {
    name: '李冠廷',
    character: 'f5',
    identity: `李冠廷，26 歲，工程師，在辦公大樓上班，第一次存夠錢想去歐洲，喜歡逛旅展。外觀：金色短髮、黑色外套。說話風格：輕鬆、愛開玩笑，常說「看心情啦」。
【以下只有自己知道】
旅行偏好：經典景點想看，但不想照表操課，喜歡臨時起意亂逛；預算 8 到 10 萬；可能一個人去，也可能找同事；最怕早上六點集合、被帶去購物站。
${RULE}`,
    plan: `用不多的預算，第一次去歐洲看看名景，又能自己亂逛`,
  },
];

export const characters = [
  {
    name: 'f1',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f1SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f2',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f2SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f3',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f3SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f4',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f4SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f5',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f5SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f6',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f6SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f7',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f7SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f8',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f8SpritesheetData,
    speed: 0.1,
  },
];

// Characters move at 0.75 tiles per second.
export const movementSpeed = 0.75;

// 角色專屬走路圖（public/assets/walk/<id>.png）取代原版像素小人；角色名稱 f1… 不變，不需重設世界
// 永信旅人小鎮：目前用原版像素小人；有專屬走路圖時在這裡加對應
export const WALK_IDS: Record<string, string> = {};
for (const c of characters) {
  const id = WALK_IDS[c.name];
  if (id) {
    c.textureUrl = `/ai-town/assets/walk/${id}.png`;
    c.spritesheetData = walkSpritesheetData;
  }
}
