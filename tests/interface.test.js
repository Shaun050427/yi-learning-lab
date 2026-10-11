/* DOM emulation verifies event wiring, state and markup, not browser layout. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {HEXAGRAMS} from '../src/data/hexagrams.js';
import {TRIGRAMS} from '../src/data/trigrams.js';
import {LESSONS,GLOSSARY} from '../src/data/lessons.js';
import * as hex from '../src/engine/hexagram.js';
import * as quiz from '../src/engine/quiz.js';
import * as store from '../src/engine/storage.js';
function harness(){
 const elements=new Map(),raw=new Map(),listeners={},memory={getItem:k=>raw.get(k)||null,setItem:(k,v)=>raw.set(k,v),removeItem:k=>raw.delete(k)};
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',dataset:{},classList:{add(){},remove(){}},addEventListener(k,f){this[k]=f;},showModal(){this.open=true;},close(){this.open=false;},focus(){},click(){},setSelectionRange(){}});return elements.get(id);};
 const context={HEXAGRAMS,TRIGRAMS,LESSONS,GLOSSARY,...hex,...quiz,...store,load:()=>store.load(memory),persist:d=>store.persist(d,memory),localStorage:memory,crypto:webcrypto,URL,URLSearchParams,Blob,Date,console,confirm:()=>true,setTimeout:()=>1,clearTimeout(){},location:{search:'',hash:''},navigator:{},document:{getElementById:element,addEventListener:(k,f)=>listeners['doc-'+k]=f,body:{classList:{add(){}},append(){}},createElement:()=>({click(){},remove(){}})},window:{addEventListener:(k,f)=>listeners[k]=f}};
 vm.createContext(context);const src=readFileSync(new URL('../src/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.runInContext(src+'\nglobalThis.debug={render,actions,getDB:()=>db,getQuestion:()=>activeQuestion,openNote};',context);
 return {element,raw,context,listeners,debug:context.debug};
}
test('all eight interface routes render and classic reader keeps original and variant notes distinct',()=>{
 const h=harness();for(const route of ['home','workshop','reader','quiz','notes','path','maps','settings']){h.context.location.hash='#'+route;h.debug.render();assert.ok(h.element('content').innerHTML.length>100,route);}
 h.context.location.hash='#reader';h.debug.render();h.debug.actions['read']({dataset:{number:'3'}});assert.match(h.element('content').innerHTML,/初九：磐桓/);assert.match(h.element('content').innerHTML,/异文附记/);assert.match(h.element('content').innerHTML,/一作「盤」/);
});
test('a correct quiz answer is saved once and receives a future review date',()=>{
 const h=harness();h.context.location.hash='#quiz';h.debug.render();const q=h.debug.getQuestion();h.debug.actions.answer({dataset:{answer:q.answer}});h.debug.actions.answer({dataset:{answer:q.answer}});const db=h.debug.getDB();assert.equal(db.attempts.length,1);assert.equal(db.attempts[0].correct,true);assert.ok(db.reviews[0].dueAt>Date.now());
});
test('marking a reading twice in one day counts once; constructing six moving lines saves exact input',()=>{
 const h=harness();h.debug.actions['mark-read']({dataset:{number:'63'}});h.debug.actions['mark-read']({dataset:{number:'63'}});assert.equal(h.debug.getDB().readings.length,1);h.context.location.hash='#workshop';h.debug.render();h.debug.actions['save-practice']();assert.deepEqual(Array.from(h.debug.getDB().practice[0].values),[7,7,7,7,7,7]);
});
test('note draft survives close and saved content is rendered as escaped text',()=>{
 const h=harness();h.debug.openNote({title:'<script>bad</script>',text:'<img onerror=alert(1)>',hexagram:1,type:'原文卡',date:'2026-10-11',evidence:'source'});h.element('note-form').submit({preventDefault(){}});assert.equal(h.debug.getDB().notes.length,1);h.context.location.hash='#notes';h.debug.render();assert.match(h.element('content').innerHTML,/&lt;script&gt;/);assert.ok(!h.element('content').innerHTML.includes('<img onerror'));assert.equal(h.raw.has('yi-learning-lab:draft:v1'),false);
});
test('another window editing the same note rejects stale save and retains draft',()=>{
 const h=harness();h.debug.openNote({title:'first',text:'text',hexagram:1,type:'原文卡',date:'2026-10-11',evidence:''});h.element('note-form').submit({preventDefault(){}});const old=h.debug.getDB().notes[0];h.debug.openNote(old);const incoming=store.load(h.context.localStorage);incoming.notes[0].text='other window';incoming.notes[0].updatedAt=new Date(Date.now()+1000).toISOString();store.persist(incoming,h.context.localStorage);h.element('note-text').value='stale edit';h.element('note-form').submit({preventDefault(){}});assert.equal(store.load(h.context.localStorage).notes[0].text,'other window');assert.equal(h.element('note-dialog').open,true);assert.match(h.element('toast').textContent,/其他窗口/);
});
