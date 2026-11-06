// 永信旅人小鎮：顧問練習用的角色分類、旅人角色、問到的面向與客戶資料卡（全部用關鍵字判斷，不呼叫模型）

export const TOWN_TITLE = '永信旅人小鎮';

export type CustomerInfo = { role: string; title: string; emoji: string; status: string };
export const CUSTOMERS: Record<string, CustomerInfo> = {
  林雅婷: { role: '柴郡貓型', title: '慢遊生活家', emoji: '🐈', status: '新客 N' },
  陳建宏: { role: '愛麗絲型', title: '從容探索家', emoji: '👧', status: '老客・S2 半睡・銀等級' },
  張家豪: { role: '白兔型', title: '經典收藏家', emoji: '🐇', status: '新客 N' },
  黃淑芬: { role: '紅心皇后型', title: '嚴選鑑賞家', emoji: '👑', status: '老客・E0 主力・金等級' },
  李冠廷: { role: '瘋帽匠型', title: '隨興巡禮者', emoji: '🎩', status: '新客 N' },
};
export const STAFF: Record<string, string> = { 林家瑋: '新進顧問', 王美玲: '資深顧問' };
export const isCustomer = (name?: string) => !!name && name in CUSTOMERS;
export const isStaff = (name?: string) => !!name && name in STAFF;

// 封面選角的一句話身分
export const COVER_ROLES: Record<string, string> = {
  林家瑋: '新進顧問・可扮演：練習引導',
  王美玲: '資深顧問・示範新流程',
  林雅婷: '28 歲・新客・可扮演：體驗新流程',
  陳建宏: '56 歲・老客',
  張家豪: '42 歲・新客',
  黃淑芬: '52 歲・老客',
  李冠廷: '26 歲・新客',
};
// 角色顯示順序
export const ORDER_YS = ['林家瑋', '王美玲', '林雅婷', '陳建宏', '張家豪', '黃淑芬', '李冠廷'];

// 32x32folk.png 上各角色的位置（每位 96×128，正面站立格在 +32, 0）
export const SPRITE_OF: Record<string, [number, number]> = {
  陳建宏: [0, 0],
  張家豪: [96, 0],
  黃淑芬: [192, 0],
  李冠廷: [0, 128],
  林雅婷: [96, 128],
  林家瑋: [192, 128],
  王美玲: [288, 128],
};

// ===== 問到的面向：從提問者說的話判斷 =====
export const FACETS: { id: string; label: string; re: RegExp }[] = [
  { id: 'pace', label: '節奏', re: /(節奏|趕|排滿|排好|自由時間|自由活動|悠閒|慢慢|第一天|鬆|緊|休息|放空|效率)/ },
  { id: 'focus', label: '取向', re: /(名景|景點|地標|經典|在地|生活|帶回|體驗|餐廳|美食|藝術|美術館|市集|購物|想看什麼)/ },
  { id: 'budget', label: '預算', re: /(預算|多少錢|價格|價位|費用|團費|\d+\s*萬)/ },
  { id: 'mate', label: '旅伴', re: /(跟誰|和誰|同行|一起去|旅伴|幾個人|幾位|家人|朋友|另一半|一個人去)/ },
  { id: 'avoid', label: '避雷', re: /(不想|不要|避開|討厭|怕|最不|雷|不喜歡|不能接受)/ },
];
export const PASS_FACETS = 3; // 問到 3 個以上面向，就解鎖客人的旅人角色

export function facetsAsked(lines: string[]): string[] {
  const asked = lines.filter((t) => /[？?嗎呢]|怎麼|哪|多少|什麼/.test(t)).join('\n');
  return FACETS.filter((f) => f.re.test(asked)).map((f) => f.label);
}

// ===== 客戶資料卡：從客人說的話整理 =====
export type Profile = { pace?: string; focus?: string; budget?: string; mate?: string; avoid?: string };
export function extractProfile(lines: string[]): Profile {
  const p: Profile = {};
  for (const t of lines) {
    if (!p.pace) {
      if (/(不想趕|不要趕|不喜歡趕|悠閒|慢慢|放空|隨興|咖啡廳|不想照表|自由時間多)/.test(t)) p.pace = '留白';
      else if (/(排滿|排好|一次看完|效率|時間有限|都要去|行程緊)/.test(t)) p.pace = '精準';
      else if (/(半天|一半|適中|剛剛好)/.test(t)) p.pace = '均衡';
    }
    if (!p.focus) {
      if (/(在地|當地|生活|市集|小店|藝術|美術館|酒莊|米其林|好餐廳|深度)/.test(t)) p.focus = '深度體驗';
      else if (/(名景|地標|經典|鐵塔|羅浮宮|城堡|必去|打卡)/.test(t)) p.focus = '經典名景';
    }
    if (!p.budget) {
      const m = t.match(/(\d+(?:\.\d+)?)\s*(?:到|至|–|-|~)?\s*(\d+(?:\.\d+)?)?\s*萬/);
      if (m) p.budget = m[2] ? `${m[1]}–${m[2]} 萬` : `約 ${m[1]} 萬`;
    }
    if (!p.mate) {
      const m = t.match(/(一個人|自己去|朋友|閨蜜|同事|姊妹|姐妹|爸媽|家人|太太|老婆|先生|老公|另一半|女兒|兒子|小孩)/);
      if (m) p.mate = m[1];
    }
  }
  // 避雷：「最怕／最不想」優先；和趕路有關的話算節奏，不算避雷
  const strong = /(?:最怕|最不想|最討厭|不能接受)([^，。！？,.!?]{2,12})/;
  const weak = /(?:不想|不要|討厭|不喜歡|怕)([^，。！？,.!?]{2,12})/;
  for (const re of [strong, weak]) {
    for (const t of lines) {
      const m = t.match(re);
      if (m && !/趕/.test(m[1])) {
        p.avoid = m[1];
        break;
      }
    }
    if (p.avoid) break;
  }
  return p;
}

// ===== 聊完的練習結果 =====
// 顧問練習：AI 是客人，玩家是提問者；客人體驗：AI 是顧問，看顧問問到哪些面向
export function practiceResult(transcript: string, aiName: string, humanName: string) {
  const lines = transcript.split('\n').map((l) => {
    const i = l.indexOf('：');
    return { who: l.slice(0, i), text: l.slice(i + 1) };
  });
  const customer = isCustomer(aiName) ? aiName : isCustomer(humanName) ? humanName : undefined;
  if (!customer) return null;
  const asker = customer === aiName ? humanName : aiName;
  const facets = facetsAsked(lines.filter((l) => l.who === asker).map((l) => l.text));
  const unlocked = facets.length >= PASS_FACETS;
  const info = CUSTOMERS[customer];
  return {
    asker,
    customer,
    facets,
    role: unlocked ? `${info.emoji} ${info.role}・${info.title}` : '',
  };
}
