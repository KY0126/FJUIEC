// 試衣間的像素紙娃娃（32x32 半身像，依圖層疊出上衣、外套、配飾）

export type TopId = 'tee' | 'shirt' | 'knit' | 'stripe' | 'turtle' | 'floral';
export type JacketId = 'none' | 'flannel' | 'denim' | 'work' | 'cardigan' | 'track' | 'coat' | 'apron';
export type Outfit = {
  preset?: string;
  top: TopId;
  topColor: string;
  jacket: JacketId;
  acc: { glasses: boolean; headphones: boolean; clip: boolean };
};
type HairStyle = 'messy' | 'bun' | 'updo' | 'bob' | 'sidepart' | 'perm';
type Base = {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  eyes: 'round' | 'sharp' | 'dot' | 'smile';
  mouth: 'small' | 'smile' | 'grin' | 'flat';
  bg: string;
  lash?: boolean;
  blush?: boolean;
  square?: boolean;
  wide?: number;
};

export const ORDER = ['陳子安', '林語晴', '周芷涵', '張以恩', '劉奕翔', '翁承皓', '阿珠媽'];

export const BASES: Record<string, Base> = {
  陳子安: { skin: '#f6d2b4', hair: '#1f1c22', hairStyle: 'messy', eyes: 'round', mouth: 'small', bg: '#cfe5da' },
  林語晴: { skin: '#f6d2b4', hair: '#7a4a2e', hairStyle: 'bun', eyes: 'round', mouth: 'smile', bg: '#f3dcd6', lash: true, blush: true },
  周芷涵: { skin: '#f3cfb0', hair: '#18161c', hairStyle: 'updo', eyes: 'sharp', mouth: 'flat', bg: '#e2d8ee' },
  張以恩: { skin: '#f6d2b4', hair: '#5a3a2a', hairStyle: 'bob', eyes: 'round', mouth: 'small', bg: '#d6ebee', lash: true, blush: true },
  劉奕翔: { skin: '#eec39f', hair: '#2a2420', hairStyle: 'sidepart', eyes: 'round', mouth: 'grin', bg: '#d5e0f0' },
  翁承皓: { skin: '#e7b48f', hair: '#4a3426', hairStyle: 'sidepart', eyes: 'dot', mouth: 'grin', bg: '#f3ecc8', square: true, wide: 3, blush: true },
  阿珠媽: { skin: '#eec39f', hair: '#4a3a34', hairStyle: 'perm', eyes: 'smile', mouth: 'grin', bg: '#f2dcc2', blush: true, wide: 1 },
};

const noAcc = { glasses: false, headphones: false, clip: false };
export const DEFAULTS: Record<string, Outfit> = {
  陳子安: { top: 'tee', topColor: '#f2f0ea', jacket: 'flannel', acc: { ...noAcc, glasses: true } },
  林語晴: { top: 'shirt', topColor: '#f2f0ea', jacket: 'cardigan', acc: { ...noAcc } },
  周芷涵: { top: 'turtle', topColor: '#2b2a33', jacket: 'coat', acc: { ...noAcc, clip: true } },
  張以恩: { top: 'stripe', topColor: '#2f4a7a', jacket: 'none', acc: { ...noAcc } },
  劉奕翔: { top: 'tee', topColor: '#6b6f78', jacket: 'work', acc: { ...noAcc, headphones: true } },
  翁承皓: { top: 'knit', topColor: '#e3d3b0', jacket: 'denim', acc: { ...noAcc } },
  阿珠媽: { top: 'floral', topColor: '#c0453f', jacket: 'apron', acc: { ...noAcc } },
};

export const TOPS: { id: TopId; label: string }[] = [
  { id: 'tee', label: 'T 恤' },
  { id: 'shirt', label: '襯衫' },
  { id: 'knit', label: '針織衫' },
  { id: 'stripe', label: '條紋毛衣' },
  { id: 'turtle', label: '高領' },
  { id: 'floral', label: '碎花上衣' },
];
export const TOP_COLORS = ['#f2f0ea', '#2b2a33', '#e3d3b0', '#7a9cc6', '#2f4a7a', '#c0453f', '#5f8a5a', '#e8b4c0'];
export const JACKETS: { id: JacketId; label: string }[] = [
  { id: 'none', label: '不穿外套' },
  { id: 'flannel', label: '法蘭絨格紋' },
  { id: 'denim', label: '牛仔外套' },
  { id: 'work', label: '工作外套' },
  { id: 'cardigan', label: '開襟衫' },
  { id: 'track', label: '運動外套' },
  { id: 'coat', label: '深色外套' },
  { id: 'apron', label: '圍裙' },
];
export const ACCESSORIES: { id: keyof Outfit['acc']; label: string }[] = [
  { id: 'glasses', label: '眼鏡' },
  { id: 'headphones', label: '耳機' },
  { id: 'clip', label: '鯊魚夾' },
];
export const PRESETS: { id: string; label: string; hint: string }[] = [
  { id: 'signature', label: '角色招牌', hint: '這個角色平常的樣子' },
  { id: 'casual', label: '校園休閒', hint: 'T 恤，輕鬆上課' },
  { id: 'club', label: '社團活動', hint: '運動外套，方便活動' },
  { id: 'date', label: '約會日', hint: '襯衫加開襟衫，乾淨好看' },
  { id: 'rain', label: '雨天', hint: '針織衫加深色外套' },
];

export function presetOutfit(name: string, preset: string): Outfit {
  const base = DEFAULTS[name] ?? DEFAULTS['陳子安'];
  const acc = { ...base.acc };
  switch (preset) {
    case 'casual':
      return { preset, top: 'tee', topColor: '#f2f0ea', jacket: 'none', acc };
    case 'club':
      return { preset, top: 'tee', topColor: '#6b6f78', jacket: 'track', acc };
    case 'date':
      return { preset, top: 'shirt', topColor: '#f2f0ea', jacket: 'cardigan', acc };
    case 'rain':
      return { preset, top: 'knit', topColor: '#e3d3b0', jacket: 'coat', acc };
    default:
      return { ...base, preset: 'signature', acc };
  }
}

export function loadOutfit(name: string): Outfit {
  try {
    const raw = localStorage.getItem(`daxue-outfit:${name}`);
    if (raw) {
      const o = JSON.parse(raw) as Outfit;
      if (o.preset) return o;
    }
  } catch {
    /* 瀏覽器不允許儲存時使用預設 */
  }
  return presetOutfit(name, 'signature');
}
export function saveOutfit(name: string, outfit: Outfit) {
  try {
    localStorage.setItem(`daxue-outfit:${name}`, JSON.stringify(outfit));
  } catch {
    /* 忽略 */
  }
}
// 實際生成的穿搭圖若和預設描述不同，以這裡為準
export const OUTFIT_TEXT: Record<string, Record<string, string>> = {
  陳子安: {
    signature: '格紋法蘭絨外套、白 T，戴眼鏡',
    casual: '白 T，戴眼鏡',
    club: '灰色連帽衫，戴眼鏡',
    date: '白襯衫＋深藍針織背心，戴眼鏡',
    rain: '米色高領毛衣＋黑色大衣，戴眼鏡',
  },
  林語晴: {
    signature: '白襯衫＋鵝黃開襟衫，包頭插木髮簪',
    casual: '白 T，包頭插木髮簪',
    club: '灰 T＋深藍運動外套，包頭插木髮簪',
    date: '白襯衫＋鵝黃開襟衫，包頭插木髮簪',
    rain: '米色針織毛衣＋深色西裝外套，包頭插木髮簪',
  },
  周芷涵: {
    signature: '深色外套，珍珠鯊魚夾盤髮',
    casual: '白 T，珍珠鯊魚夾盤髮',
    club: '灰 T＋深藍運動外套，珍珠鯊魚夾盤髮',
    date: '白襯衫＋鵝黃開襟衫，珍珠鯊魚夾盤髮',
    rain: '米色針織毛衣＋深色西裝外套，珍珠鯊魚夾盤髮',
  },
  張以恩: {
    signature: '深藍條紋毛衣，鮑伯頭',
    casual: '粉色針織上衣，鮑伯頭',
    club: '淺灰連帽衫，鮑伯頭',
    date: '圓領米白襯衫＋淺藍開襟衫，鮑伯頭',
    rain: '深藍高領毛衣＋駝色大衣，鮑伯頭',
  },
  劉奕翔: {
    signature: '棕色工作外套，掛耳機',
    casual: '黑色印花 T，掛耳機',
    club: '跆拳道服，掛耳機',
    date: '墨綠襯衫＋黑色西裝外套，掛耳機',
    rain: '灰色連帽衫＋黑色防風外套，掛耳機',
  },
  翁承皓: {
    signature: '牛仔外套＋米色針織衫',
    casual: '芥末黃 T',
    club: '紅色籃球背心＋白 T',
    date: '淺藍襯衫＋深藍領帶',
    rain: '墨綠連帽衫＋橄欖色鋪棉背心',
  },
  阿珠媽: {
    signature: '碎花上衣＋綠色圍裙，拿鍋鏟',
    casual: '紅碎花上衣＋白圍裙',
    club: '紫色運動外套',
    date: '暗紅旗袍領上衣＋玉珮項鍊',
    rain: '酒紅鋪棉背心＋袖套',
  },
};

export function describeOutfit(o: Outfit, name?: string) {
  const fixed = name && o.preset ? OUTFIT_TEXT[name]?.[o.preset] : undefined;
  if (fixed) return fixed;
  const top = TOPS.find((t) => t.id === o.top)?.label ?? '';
  const jacket = o.jacket === 'none' ? '' : `、${JACKETS.find((j) => j.id === o.jacket)?.label}`;
  const acc = ACCESSORIES.filter((a) => o.acc[a.id]).map((a) => a.label);
  return `${top}${jacket}${acc.length ? `，戴${acc.join('、')}` : ''}`;
}

// ---------- 繪圖（64x64，比舊版多一倍細節）----------
const N = 64;
const C = 31.5;
type Grid = (string | null)[][];
const OUTLINE = '#2a1f1d';

function hexToRgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(h: string, f: number) {
  const [r, g, b] = hexToRgb(h).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}
const inCircle = (x: number, y: number) => (x - C) ** 2 + (y - C) ** 2 <= 31.6 ** 2;

class Canvas {
  g: Grid = Array.from({ length: N }, () => Array<string | null>(N).fill(null));
  put(x: number, y: number, c: string) {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && x < N && y >= 0 && y < N && inCircle(x, y)) this.g[y][x] = c;
  }
  get(x: number, y: number) {
    return x >= 0 && x < N && y >= 0 && y < N ? this.g[y][x] : null;
  }
  ell(cx: number, cy: number, rx: number, ry: number, c: string | ((x: number, y: number) => string), cond = (_x: number, _y: number) => true) {
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++)
        if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1 && cond(x, y))
          this.put(x, y, typeof c === 'string' ? c : c(x, y));
  }
  rect(x0: number, y0: number, x1: number, y1: number, c: string) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.put(x, y, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.put(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
  }
}

export function drawDoll(el: HTMLCanvasElement, name: string, o: Outfit) {
  const b = BASES[name] ?? BASES['陳子安'];
  const cv = new Canvas();
  const wide = (b.wide ?? 0) * 2;
  const halfW = (y: number) => 12 + wide + (y - 48) * 1.5;
  const inBody = (x: number, y: number) => y >= 48 && Math.abs(x + 0.5 - 32) <= halfW(y);
  const hairHi = shade(b.hair, 1.45);
  const hairDk = shade(b.hair, 0.72);
  const hairTex = (x: number, y: number) =>
    y >= 7 && y <= 11 && (x + y) % 6 < 2 ? hairHi : x < 19 || x > 44 ? hairDk : (x * 7 + y * 3) % 23 === 0 ? hairDk : b.hair;
  const skinSh = shade(b.skin, 0.9);

  // ---- 後方頭髮 ----
  if (b.hairStyle === 'bob') cv.ell(32, 30, 19.5, 20, hairTex, (_x, y) => y >= 16 && y <= 43);
  if (b.hairStyle === 'updo') cv.ell(14, 19, 6, 6, hairTex);
  if (b.hairStyle === 'bun') cv.ell(32, 7.5, 6.5, 5.5, hairTex);

  // ---- 上衣 ----
  const c = o.topColor;
  const topColor = (x: number, y: number) => {
    const edge = Math.abs(x + 0.5 - 32) > halfW(y) - 1.5;
    const base = edge ? shade(c, 0.85) : c;
    switch (o.top) {
      case 'tee':
        return y <= 49 && Math.abs(x + 0.5 - 32) <= 6 ? shade(c, 0.82) : base;
      case 'shirt': {
        const dx = Math.abs(x + 0.5 - 32);
        if (y <= 52 && dx <= 7 - (y - 48) && dx >= 1) return '#ffffff';
        if (dx < 1 && y % 3 === 0) return shade(c, 0.7);
        return base;
      }
      case 'knit':
        return Math.floor(y / 2) % 2 ? shade(c, 0.9) : base;
      case 'stripe':
        return Math.floor((y - 48) / 3) % 2 ? '#efe6d6' : base;
      case 'floral':
        return (x * 3 + y * 5) % 11 === 0 ? '#f0d060' : (x * 5 + y * 3) % 13 === 0 ? '#ffffff' : base;
      default:
        return base;
    }
  };
  for (let y = 48; y < N; y++) for (let x = 0; x < N; x++) if (inBody(x, y)) cv.put(x, y, topColor(x, y));

  // ---- 脖子／高領 ----
  if (o.top === 'turtle') {
    cv.rect(25, 41, 38, 49, c);
    for (const y of [43, 46]) cv.line(25, y, 38, y, shade(c, 0.8));
  } else {
    cv.rect(27, 40, 36, 48, shade(b.skin, 0.86));
    cv.line(27, 41, 36, 41, shade(b.skin, 0.78));
  }

  // ---- 外套 ----
  const open = (x: number) => Math.abs(x + 0.5 - 32) >= 5;
  const outer = (x: number, y: number) => Math.abs(x + 0.5 - 32) > halfW(y) - 2.5;
  const jacketColor = (x: number, y: number): string | null => {
    const dx = Math.abs(x + 0.5 - 32);
    const lapel = y <= 56 && dx >= 5 && dx <= 5 + (56 - y) * 0.6;
    switch (o.jacket) {
      case 'flannel': {
        if (!open(x)) return null;
        const big = x % 12 === 0 || y % 12 === 0;
        const small = x % 6 === 0 || y % 6 === 0;
        return big ? '#3f5d45' : small ? '#7a2e22' : lapel ? '#c45a43' : '#b04a35';
      }
      case 'denim':
        if (!open(x)) return null;
        if (x === 20 || x === 43) return '#e0b25a';
        return lapel ? '#5a76a8' : outer(x, y) ? '#2c3f66' : '#3f5a8c';
      case 'work':
        if (!open(x)) return null;
        if (y >= 54 && y <= 58 && ((x >= 19 && x <= 24) || (x >= 39 && x <= 44)))
          return y === 54 ? '#4a3420' : '#5a4128';
        return lapel ? '#94704a' : outer(x, y) ? '#634a2c' : '#7a5a36';
      case 'cardigan':
        if (!open(x)) return null;
        if (dx >= 5 && dx < 6.5 && y % 4 === 1) return '#8a6a3a';
        return Math.floor(y / 2) % 2 ? '#d6b16a' : '#e2c27a';
      case 'track':
        if (!open(x)) return null;
        if (outer(x, y)) return '#f0f0f0';
        return dx < 6 ? '#c9ccd4' : '#2f4a7a';
      case 'coat':
        if (!open(x)) return null;
        return lapel ? '#55545e' : outer(x, y) ? '#29282f' : '#3a3944';
      case 'apron': {
        const strap = (x >= 23 && x <= 25) || (x >= 38 && x <= 40);
        const panel = y >= 53 && x >= 23 && x <= 40;
        if (!strap && !panel) return null;
        return (x * 3 + y * 5) % 11 === 0 ? '#f6e7a8' : (x + y) % 7 === 0 ? '#4c7448' : '#5f8a5a';
      }
      default:
        return null;
    }
  };
  for (let y = 48; y < N; y++)
    for (let x = 0; x < N; x++)
      if (inBody(x, y)) {
        const jc = jacketColor(x, y);
        if (jc) cv.put(x, y, jc);
      }

  // ---- 臉 ----
  const skinAt = (x: number) => (x >= 41 ? skinSh : b.skin);
  if (b.square) {
    for (let y = 15; y <= 42; y++)
      for (let x = 18; x <= 45; x++) {
        const cut = (y < 18 || y > 39) && (x < 21 || x > 42);
        if (!cut) cv.put(x, y, skinAt(x));
      }
  } else cv.ell(32, 29, 13.2, 15, (x) => skinAt(x));
  const earX = b.square ? [16.5, 47.5] : [18.5, 45.5];
  cv.ell(earX[0], 30, 2.3, 3.2, b.skin);
  cv.ell(earX[1], 30, 2.3, 3.2, skinSh);

  // ---- 眉毛 ----
  const brow = hairDk;
  if (b.eyes === 'sharp') {
    cv.line(22, 25, 28, 24, brow);
    cv.line(35, 24, 41, 25, brow);
  } else {
    cv.line(23, 25, 27, 24, brow);
    cv.line(36, 24, 40, 25, brow);
  }

  // ---- 眼睛 ----
  const lid = '#2a1f1d';
  const iris = '#4a3328';
  const pupil = '#1c1412';
  const white = '#ffffff';
  const eyeOpen = (x0: number, narrow: boolean) => {
    const top = narrow ? 29 : 28;
    cv.line(x0 - (narrow ? 1 : 0), top, x0 + 4, top, lid);
    cv.rect(x0, top + 1, x0 + 4, 32, iris);
    cv.rect(x0 + 1, top + 2, x0 + 3, 32, pupil);
    cv.put(x0 + 1, top + 1, white);
    cv.put(x0 + 2, top + 1, white);
    cv.put(x0 + 3, 32, '#9a7a68');
  };
  const eyeClosed = (x0: number) => {
    cv.put(x0, 31, lid);
    cv.put(x0 + 1, 30, lid);
    cv.put(x0 + 2, 29, lid);
    cv.put(x0 + 3, 30, lid);
    cv.put(x0 + 4, 31, lid);
  };
  for (const x0 of [23, 36]) {
    if (b.eyes === 'round') eyeOpen(x0, false);
    if (b.eyes === 'sharp') eyeOpen(x0, true);
    if (b.eyes === 'dot' || b.eyes === 'smile') eyeClosed(x0);
  }
  if (b.eyes === 'sharp') {
    cv.put(21, 28, lid);
    cv.put(42, 28, lid);
  }
  if (b.lash) {
    cv.put(22, 28, lid);
    cv.put(21, 27, lid);
    cv.put(41, 28, lid);
    cv.put(42, 27, lid);
  }

  // ---- 鼻、腮紅、嘴 ----
  cv.put(32, 35, shade(b.skin, 0.8));
  cv.put(31, 36, shade(b.skin, 0.85));
  if (b.blush) {
    cv.ell(23.5, 35.5, 2.6, 1.3, '#f2a7a0');
    cv.ell(40.5, 35.5, 2.6, 1.3, '#eb9d96');
  }
  const lip = '#b5524f';
  if (b.mouth === 'small') {
    cv.line(30, 39, 33, 39, lip);
    cv.put(31, 40, '#d27a72');
    cv.put(32, 40, '#d27a72');
  }
  if (b.mouth === 'smile') {
    cv.put(28, 38, lip);
    cv.line(29, 39, 34, 39, lip);
    cv.put(35, 38, lip);
    cv.line(30, 40, 33, 40, '#d27a72');
  }
  if (b.mouth === 'grin') {
    cv.rect(28, 38, 35, 41, '#7a2b2b');
    cv.line(29, 38, 34, 38, white);
    cv.line(30, 41, 33, 41, '#d27a72');
  }
  if (b.mouth === 'flat') cv.line(29, 39, 34, 39, lip);

  // ---- 前方頭髮 ----
  const cap = (line: (x: number) => number, cy = 22, rx = 16.8, ry = 15.5) => {
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++)
        if (((x + 0.5 - 32) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1 && y < line(x)) cv.put(x, y, hairTex(x, y));
  };
  switch (b.hairStyle) {
    case 'messy':
      cap((x) => (x < 18 || x > 45 ? 31 : 21 + (x % 6 < 3 ? 2 : -1)));
      for (const sx of [25, 35]) {
        cv.line(sx, 9, sx - 1, 6, b.hair);
        cv.line(sx + 1, 9, sx, 6, b.hair);
      }
      break;
    case 'bun':
      cap((x) => (x < 18 || x > 45 ? 36 : x >= 30 && x <= 33 ? 18 : 22));
      cv.line(38, 7, 45, 1, '#a0743c');
      cv.line(38, 8, 45, 2, '#c08a4a');
      break;
    case 'updo':
      cap((x) => (x < 18 || x > 45 ? 27 : 20 + Math.floor((45 - x) * 0.12)));
      break;
    case 'bob':
      cap((x) => (x < 18 || x > 45 ? 42 : 23));
      break;
    case 'sidepart':
      cap(
        (x) => (x < 18 || x > 45 ? 28 : Math.floor(17 + (x - 18) * 0.28)),
        b.square ? 20 : 22,
        b.square ? 16.5 : 16.8,
        b.square ? 12 : 15.5,
      );
      cv.line(24, 8, 22, 18, hairHi);
      break;
    case 'perm':
      for (const [cx2, cy2] of [
        [18, 18],
        [23, 11],
        [32, 9],
        [41, 11],
        [46, 18],
        [16, 26],
        [48, 26],
      ])
        cv.ell(cx2, cy2, 5.6, 5.6, (x, y) => ((x + y) % 4 === 0 ? hairHi : b.hair));
      cap((x) => (x < 18 || x > 45 ? 30 : 19));
      break;
  }

  // ---- 配飾 ----
  if (o.acc.glasses) {
    const g = '#1f1f24';
    for (const [x0, x1] of [
      [21, 29],
      [34, 42],
    ]) {
      cv.line(x0 + 1, 27, x1 - 1, 27, g);
      cv.line(x0 + 1, 34, x1 - 1, 34, g);
      cv.line(x0, 28, x0, 33, g);
      cv.line(x1, 28, x1, 33, g);
    }
    cv.line(30, 29, 33, 29, g);
    cv.line(earX[0] + 1, 29, 20, 29, g);
    cv.line(43, 29, earX[1] - 1, 29, g);
  }
  if (o.acc.headphones) {
    cv.line(21, 46, 42, 46, '#55575e');
    cv.line(21, 47, 42, 47, '#3d3f45');
    cv.ell(20, 46.5, 3.6, 3.2, '#1e1f24');
    cv.ell(43, 46.5, 3.6, 3.2, '#1e1f24');
    cv.put(19, 45, '#6a6d75');
    cv.put(42, 45, '#6a6d75');
  }
  if (o.acc.clip) {
    const [cx3, cy3] = b.hairStyle === 'updo' ? [10, 15] : b.hairStyle === 'bun' ? [27, 11] : [16, 13];
    cv.rect(cx3, cy3, cx3 + 8, cy3 + 2, '#d8b24a');
    cv.line(cx3, cy3 + 3, cx3 + 8, cy3 + 3, '#a8822a');
    for (let i = 0; i <= 8; i += 2) cv.put(cx3 + i, cy3 + 1, '#fff8e8');
  }

  // ---- 輸出（背景圓＋描邊）----
  el.width = N;
  el.height = N;
  const ctx = el.getContext('2d')!;
  ctx.clearRect(0, 0, N, N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (!inCircle(x, y)) continue;
      let col = cv.g[y][x];
      if (!col) {
        col = b.bg;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          if (cv.get(x + dx, y + dy) && y + dy < 60) {
            col = OUTLINE;
            break;
          }
        }
      }
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
}
