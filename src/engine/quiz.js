import {HEXAGRAMS} from '../data/hexagrams.js';
import {TRIGRAMS} from '../data/trigrams.js';
import {lineName,casting} from './hexagram.js';
export const QUIZ_TYPES={line:'六爻命名',trigram:'上下卦识别',change:'动爻与变卦',position:'中位与当位'};
function uniqueOptions(answer,others,seed) {const all=[answer,...others.filter(x=>x!==answer)].slice(0,4);return all.sort((a,b)=>((a.length*7+a.charCodeAt(0)+seed)%17)-((b.length*7+b.charCodeAt(0)+seed)%17));}
export function question(type='line',seed=Math.floor(Math.random()*100000)) {
  if(!Number.isInteger(seed)||seed<0)throw new Error('无效题号');
  if(!QUIZ_TYPES[type])throw new Error('未知练习类型');
  const h=HEXAGRAMS[seed%64],i=Math.floor(seed/64)%6;let answer,prompt,others,explanation,values;
  if(type==='line') {answer=lineName(h.bits[i],i);prompt=`${h.title}从下往上第${i+1}爻，应叫什么？`;others=['初九','初六','九二','六二','九三','六三','九四','六四','九五','六五','上九','上六'];explanation=`位置${i+1}是${i===0?'初':i===5?'上':['一','二','三','四','五'][i]}，${h.bits[i]?'阳爻以九命名':'阴爻以六命名'}。经典爻题中的九／六，不代表此次投掷一定为动爻。`;}
  if(type==='trigram') {const upper=i%2===0;answer=upper?h.upper:h.lower;prompt=`${h.title}的${upper?'上卦（四至六爻）':'下卦（初至三爻）'}是什么？`;others=TRIGRAMS.map(t=>t.name);explanation=`下${h.lower}上${h.upper}。显示卦画时上爻在顶端，编号仍从底部开始。`;}
  if(type==='change') {values=h.bits.map((b,k)=>k===i?(b?9:6):(b?7:8));const c=casting(values);answer=c.changed.name;prompt=`${h.title}只有第${i+1}爻动，之卦是什么？`;others=HEXAGRAMS.filter((_,k)=>k%16===seed%16).map(h=>h.name);explanation=`第${i+1}爻${h.bits[i]?'由阳转阴':'由阴转阳'}，其余爻保持不变，得到${c.changed.title}。`;}
  if(type==='position') {answer=i===1||i===4?'中位':'非中位';prompt=`第${i+1}爻是否在上下经卦的中间？`;others=['中位','非中位'];explanation='二、五爻分别是下卦、上卦的中位。当位另看奇数阳位、偶数阴位，不能机械等同吉凶。';}
  return {id:`${type}:${seed}`,type,seed,hexagram:h.number,index:i,prompt,answer,options:uniqueOptions(answer,others,seed),explanation,...(values?{values}:{})};
}
export function grade(q,answer) {if(!q.options.includes(answer))throw new Error('无效答案');return answer===q.answer;}
export function schedule(previous,correct,now=Date.now()) {const box=correct?Math.min(5,(previous?.box||0)+1):0;const days=[0,1,3,7,14,30][box];return {box,dueAt:now+(correct?days*86400000:600000),lastAt:now};}
