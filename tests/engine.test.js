import test from 'node:test';
import assert from 'node:assert/strict';
import {HEXAGRAMS} from '../src/data/hexagrams.js';
import {TRIGRAMS} from '../src/data/trigrams.js';
import {identify,fromTrigrams,lineName,casting,relations,lineAnalysis,palace,PALACES,toss} from '../src/engine/hexagram.js';
import {question,grade,schedule,QUIZ_TYPES} from '../src/engine/quiz.js';
test('64 unique structures and all 384 source line titles agree with their positions',()=>{
 assert.equal(HEXAGRAMS.length,64);assert.equal(new Set(HEXAGRAMS.map(h=>h.bits.join(''))).size,64);
 for(const h of HEXAGRAMS){assert.equal(identify(h.bits).number,h.number);assert.equal(fromTrigrams(h.lower,h.upper).number,h.number);assert.equal(h.lines.length,6);assert.ok(h.judgement.length>3);assert.match(h.revision,/^\d+$/);for(let i=0;i<6;i++)assert.equal(h.lines[i].slice(0,2),lineName(h.bits[i],i),h.name+' '+i);}
});
test('known directional pairs, line names and nuclear structures',()=>{
 assert.equal(fromTrigrams('离','坎').number,63);assert.equal(fromTrigrams('坎','离').number,64);
 assert.equal(fromTrigrams('乾','坤').number,11);assert.equal(fromTrigrams('坤','乾').number,12);
 assert.equal(lineName(1,0),'初九');assert.equal(lineName(0,2),'六三');assert.equal(lineName(1,5),'上九');
 assert.equal(relations(HEXAGRAMS[62].bits).nuclear.number,64);
 assert.equal(relations(HEXAGRAMS[0].bits).opposite.number,2);assert.equal(relations(HEXAGRAMS[0].bits).reversed.number,1);
});
test('all 4096 possible coin-result combinations respect stationary and moving lines',()=>{
 for(let code=0;code<4096;code++){const values=Array.from({length:6},(_,i)=>6+((code>>i*2)&3)),c=casting(values);for(let i=0;i<6;i++){assert.equal(c.original.bits[i],values[i]%2);assert.equal(c.changed.bits[i],[6,9].includes(values[i])?1-values[i]%2:values[i]%2);}assert.equal(c.moving.length,values.filter(v=>v===6||v===9).length);}
});
test('opposite and reversed transformations are involutions for every hexagram',()=>{
 for(const h of HEXAGRAMS){const r=relations(h.bits);assert.equal(relations(r.opposite.bits).opposite.number,h.number);assert.equal(relations(r.reversed.bits).reversed.number,h.number);assert.equal(lineAnalysis(h.bits).filter(x=>x.central).length,2);}
 assert.ok(lineAnalysis(HEXAGRAMS[62].bits).every(x=>x.correct));assert.ok(lineAnalysis(HEXAGRAMS[63].bits).every(x=>!x.correct));
});
test('eight palaces partition all hexagrams with expected world and response',()=>{
 assert.equal(new Set(PALACES.flatMap(p=>p[1])).size,64);
 for(const h of HEXAGRAMS){const p=palace(h.number);assert.equal(Math.abs(p.world-p.response),3);}
 assert.deepEqual([palace(1).world,palace(44).world,palace(35).world,palace(14).world],[6,1,4,3]);
});
test('invalid inputs rejected and three-coin simulation covers all 8 outcomes',()=>{
 for(const input of [[],[1,1,1,1,1,2],[1,1,1,1,1]])assert.throws(()=>identify(input));assert.throws(()=>casting([6,7,8,9,0,1]));
 const counts={};for(let n=0;n<8;n++){let i=0;const value=toss(()=>((n>>(i++))&1)?0.75:0.25);counts[value]=(counts[value]||0)+1;}assert.deepEqual(counts,{6:1,7:3,8:3,9:1});
});
test('all question types have distinct valid choices and reproducible answers',()=>{
 for(const type of Object.keys(QUIZ_TYPES))for(let seed=0;seed<384;seed++){const q=question(type,seed);assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options.includes(q.answer));assert.equal(grade(q,q.answer),true);assert.deepEqual(question(type,seed),q);}
 assert.equal(schedule(null,true,0).dueAt,86400000);assert.equal(schedule({box:5},false,0).box,0);assert.equal(schedule({box:5},true,0).dueAt,30*86400000);
});
