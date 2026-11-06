import fs from 'fs';
import {feature} from 'topojson-client';
import {geoAzimuthalEqualArea, geoPath} from 'd3-geo';
const topo=JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json'));
const fc=feature(topo,topo.objects.countries);
const W=800,H=760;
const proj=geoAzimuthalEqualArea().rotate([-12,-53]);
const box={type:'Polygon',coordinates:[[[-24,35],[-24,71],[38,71],[38,35],[-24,35]]]};
proj.fitExtent([[0,0],[W,H]],{type:'MultiPoint',coordinates:[[-24,64],[-11,33.5],[34,34],[14,34.6],[32,70.5],[22,71],[31,60]]});
proj.clipExtent([[0,0],[W,H]]);
const path=geoPath(proj).digits(1);
const iso={578:'NO',752:'SE',246:'FI',208:'DK',352:'IS',826:'GB',372:'IE',250:'FR',528:'NL',56:'BE',442:'LU',276:'DE',756:'CH',40:'AT',203:'CZ',348:'HU',703:'SK',616:'PL',440:'LT',428:'LV',233:'EE',191:'HR',705:'SI',70:'BA',499:'ME',688:'RS',8:'AL',807:'MK',642:'RO',100:'BG',498:'MD',804:'UA',112:'BY',643:'RU',620:'PT',724:'ES',380:'IT',300:'GR',470:'MT',504:'MA',12:'DZ',788:'TN',792:'TR',196:'CY',438:'LI',20:'AD',492:'MC',674:'SM',336:'VA',304:'GL',434:'LY',818:'EG',760:'SY',368:'IQ',364:'IR',268:'GE',51:'AM',31:'AZ',398:'KZ',422:'LB',376:'IL',400:'JO',682:'SA'};
const out=[];
for(const f of fc.features){const id=+f.id;let code=iso[id];
  if(!code && f.properties.name==='Kosovo')code='XK';
  if(!code && f.properties.name==='N. Cyprus')code='CYN';
  if(!code)continue;
  const d=path(f); if(!d)continue;
  const c=path.centroid(f);
  out.push({c:code,n:f.properties.name,d,x:Math.round(c[0]),y:Math.round(c[1])});}
fs.writeFileSync('europe.json',JSON.stringify(out));
console.log(out.length,(JSON.stringify(out).length/1024).toFixed(0)+'KB');
// projected points for labels: sicily, dolomites
for(const [n,p] of Object.entries({sicily:[14.2,37.5],dolo:[11.9,46.5],malta:[14.4,35.9]}))console.log(n,proj(p).map(Math.round));
