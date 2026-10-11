import { HEXAGRAMS } from '../data/hexagrams.js';
import { TRIGRAMS } from '../data/trigrams.js';
const byBits = new Map(HEXAGRAMS.map(h => [h.bits.join(''), h]));
export function validateBits(bits, length=6) {
  if (!Array.isArray(bits) || bits.length!==length || bits.some(b=>b!==0&&b!==1)) throw new Error(`需要${length}条阴阳爻（0或1），由下而上排列`);
  return [...bits];
}
export function identify(bits) { return byBits.get(validateBits(bits).join('')); }
export function trigram(bits) {return TRIGRAMS.find(t=>t.bits.join('')===validateBits(bits,3).join(''));}
export function fromTrigrams(lower,upper) {
  const l=TRIGRAMS.find(t=>t.name===lower),u=TRIGRAMS.find(t=>t.name===upper);
  if(!l||!u)throw new Error('未知经卦');return identify([...l.bits,...u.bits]);
}
export function lineName(bit,index) {
  if((bit!==0&&bit!==1)||!Number.isInteger(index)||index<0||index>5)throw new Error('无效爻位');
  const n=bit?'九':'六'; return index===0?'初'+n:index===5?'上'+n:n+['一','二','三','四','五','六'][index];
}
export function casting(values) {
  if(!Array.isArray(values)||values.length!==6||values.some(v=>![6,7,8,9].includes(v)))throw new Error('须输入六个6、7、8或9');
  const bits=values.map(v=>v%2),moving=values.map((v,i)=>v===6||v===9?i:-1).filter(i=>i>=0);
  return {original:identify(bits),changed:identify(bits.map((b,i)=>moving.includes(i)?1-b:b)),moving,values:[...values]};
}
export function relations(bits) {
  const b=validateBits(bits);
  return {opposite:identify(b.map(v=>1-v)),reversed:identify([...b].reverse()),nuclear:identify([b[1],b[2],b[3],b[2],b[3],b[4]])};
}
export function lineAnalysis(bits) {
  const b=validateBits(bits);
  return b.map((bit,i)=>({position:i+1,name:lineName(bit,i),central:i===1||i===4,correct:bit===(i%2===0?1:0),partner:i<3?i+4:i-2,responds:bit!==b[i<3?i+3:i-3],supportsYang:i<5&&bit===0&&b[i+1]===1,ridesYang:i>0&&bit===0&&b[i-1]===1}));
}
export const PALACES=[['乾',[1,44,33,12,20,23,35,14]],['坎',[29,60,3,63,49,55,36,7]],['艮',[52,22,26,41,38,10,61,53]],['震',[51,16,40,32,46,48,28,17]],['巽',[57,9,37,42,25,21,27,18]],['离',[30,56,50,64,4,59,6,13]],['坤',[2,24,19,11,34,43,5,8]],['兑',[58,47,45,31,39,15,62,54]]];
export function palace(number) {
  const p=PALACES.find(([,nums])=>nums.includes(number)); if(!p)throw new Error('未知卦序');
  const step=p[1].indexOf(number),world=[6,1,2,3,4,5,4,3][step];
  return {name:p[0],stage:['本宫','一世','二世','三世','四世','五世','游魂','归魂'][step],world,response:world<=3?world+3:world-3,numbers:p[1]};
}
export function toss(random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296) {return Array.from({length:3},()=>random()<.5?2:3).reduce((a,b)=>a+b,0);}
