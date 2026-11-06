import { useEffect, useState } from 'react';

const IDS: Record<string, string> = {};

// 角色穿搭圖：/ai-town/assets/outfits/<角色>/<穿搭>.png；還沒有圖時顯示角色原始造型
export default function OutfitImage({ name, preset, size }: { name: string; preset?: string; size: number }) {
  const id = IDS[name];
  const portrait = id ? `/ai-town/assets/avatars/${id}.png` : undefined;
  const wanted = id && preset && preset !== 'signature' ? `/ai-town/assets/outfits/${id}/${preset}.png` : portrait;
  const [src, setSrc] = useState(wanted);
  useEffect(() => setSrc(wanted), [wanted]);
  if (!src) return <div style={{ width: size, height: size }} className="rounded-full bg-clay-700" />;
  return (
    <img
      src={src}
      alt={`${name}的穿搭`}
      onError={() => portrait && src !== portrait && setSrc(portrait)}
      style={{ width: size, height: size }}
      className="rounded-full"
    />
  );
}

export function hasOutfitImage(preset?: string) {
  return !!preset && preset !== 'signature';
}
