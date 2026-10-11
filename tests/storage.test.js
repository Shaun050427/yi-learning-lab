import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,validate,merge,load,persist,KEY,summary} from '../src/engine/storage.js';
const timestamp='2026-10-11T09:00:00Z';
const note=(id,text='a')=>({id,title:'测试',text,evidence:'原文',type:'原文卡',hexagram:1,date:'2026-10-11',updatedAt:timestamp});
function memory(){const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};}
test('independent changes merge and latest edit wins without duplicate IDs',()=>{
 const a=fresh(),b=fresh();a.notes.push(note('one'));b.notes.push(note('two'));b.notes.push({...note('one','new'),updatedAt:'2026-10-11T10:00:00Z'});
 const c=merge(a,b);assert.equal(c.notes.length,2);assert.equal(c.notes.find(x=>x.id==='one').text,'new');assert.deepEqual(merge(c,b),c);
});
test('deletion tombstone survives older backups',()=>{
 const a=fresh(),b=fresh();a.notes.push({...note('one'),deleted:true,updatedAt:'2026-10-11T11:00:00Z'});b.notes.push(note('one'));assert.equal(merge(a,b).notes[0].deleted,true);
});
test('saving a stale snapshot keeps another tab independent additions',()=>{
 const store=memory(),a=fresh();a.notes.push(note('one'));persist(a,store);const b=fresh();b.notes.push(note('two'));persist(b,store);assert.equal(load(store).notes.length,2);
});
test('invalid backups and damaged stored data fail without clearing originals',()=>{
 assert.throws(()=>validate({schema:999}));const a=fresh();a.notes.push(note('one'),note('one'));assert.throws(()=>validate(a));const store=memory();store.setItem(KEY,'broken');assert.throws(()=>load(store));assert.equal(store.getItem(KEY),'broken');const b=fresh();b.notes.push({...note('one'),hexagram:65});assert.throws(()=>validate(b));
});
test('summary is range bounded, excludes deleted notes and has actual counts',()=>{
 const d=fresh();d.notes.push(note('one'),{...note('two'),deleted:true});d.attempts.push({id:'a',questionId:'line:0',type:'line',date:'2026-10-11',correct:false,updatedAt:timestamp},{id:'b',questionId:'line:1',type:'line',date:'2026-09-01',correct:true,updatedAt:timestamp});d.readings.push({id:'r',hexagram:1,date:'2026-10-11',updatedAt:timestamp});const s=summary(d,'2026-10-05','2026-10-11');assert.deepEqual(s.counts,{attempts:1,correct:0,readings:1,notes:1,practice:0});assert.match(s.text,/六爻命名错1题/);assert.throws(()=>summary(d,'2026-10-12','2026-10-11'));
});
