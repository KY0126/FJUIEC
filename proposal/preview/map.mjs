import fs from 'fs';
import {feature, mesh} from 'topojson-client';
import {geoMercator, geoPath} from 'd3-geo';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-10m.json'));
const fc = feature(topo, topo.objects.countries);
const W = 330, H = 262;
const proj = geoMercator().fitExtent([[8, 8], [W - 8, H - 8]],
  {type: 'MultiPoint', coordinates: [[6.15, 45.62], [10.45, 47.45]]});
const path = geoPath(proj).digits(1);
const names = {756: '瑞士', 250: '法國', 380: '義大利', 276: '德國', 40: '奧地利', 438: ''};
let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
svg += `<rect width="${W}" height="${H}" fill="#E4ECF2"/>`;
for (const f of fc.features) {
  const id = +f.id; if (!(id in names)) continue;
  svg += `<path d="${path(f)}" fill="${id === 756 ? '#F3DFC0' : '#ECE5D8'}" stroke="#B9AE9C" stroke-width="0.8"/>`;
}
const lab = {'法國': [6.45, 46.95], '義大利': [9.9, 45.75], '德國': [8.0, 47.62], '瑞士': [8.5, 46.82]};
for (const [n, p] of Object.entries(lab)) {
  const [x, y] = proj(p);
  svg += `<text x="${x}" y="${y}" font-size="13" fill="${n === '瑞士' ? '#9A6A2A' : '#8C8577'}" font-weight="700" text-anchor="middle" letter-spacing="2">${n}</text>`;
}
const stays = [
  ['霞慕尼', [6.869, 45.924], '住 2 晚', 'b'],
  ['策馬特', [7.749, 46.020], '住 2 晚', 't'],
  ['伯恩', [7.447, 46.948], '', 'l'],
  ['盧森湖一帶', [8.309, 47.050], '', 'r'],
];
const sights = [
  ['少女峰', [7.962, 46.537], 'r'],
  ['藍湖', [7.664, 46.493], 'l'],
  ['蒙投', [6.911, 46.433], 'l'],
  ['盧加諾湖', [8.952, 46.004], 'b'],
  ['伯連那列車', [9.95, 46.40], 'l'],
];
for (const [n, p, side] of sights) {
  const [x, y] = proj(p);
  svg += `<circle cx="${x}" cy="${y}" r="5" fill="#E8A54F" stroke="#fff" stroke-width="1.5"/>`;
  const [tx, ty, an] = side === 'r' ? [x + 8, y + 4.5, 'start'] : side === 'l' ? [x - 8, y + 4.5, 'end'] : [x, y + 19, 'middle'];
  svg += `<text x="${tx}" y="${ty}" font-size="13" fill="#5B4A33" text-anchor="${an}" font-weight="500" paint-order="stroke" stroke="#F7F1E6" stroke-width="3">${n}</text>`;
}
for (const [n, p, nights, side] of stays) {
  const [x, y] = proj(p);
  svg += `<circle cx="${x}" cy="${y}" r="8" fill="#2F4C6E" stroke="#fff" stroke-width="2"/>`;
  svg += `<path d="M${x - 4} ${y + 1}l4-4 4 4v3.5h-8z" fill="#fff"/>`;
  const label = nights ? `${n}・${nights}` : n;
  const [tx, ty, an] = side === 'r' ? [x + 12, y + 5, 'start'] : side === 'l' ? [x - 12, y + 5, 'end'] : side === 't' ? [x + 30, y - 14, 'middle'] : [x + 22, y + 24, 'middle'];
  svg += `<text x="${tx}" y="${ty}" font-size="14" fill="#1F3550" font-weight="700" text-anchor="${an}" paint-order="stroke" stroke="#F7F1E6" stroke-width="3.5">${label}</text>`;
}
svg += '</svg>';
fs.writeFileSync('map.svg', svg);
console.log('ok', svg.length);
