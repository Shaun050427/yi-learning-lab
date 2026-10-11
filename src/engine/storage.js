export const KEY='yi-learning-lab:v1';
export const fresh=()=>({schema:1,notes:[],attempts:[],reviews:[],readings:[],practice:[],completed:[]});
const arrays=['notes','attempts','reviews','readings','practice','completed'];
const dateOK=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;};
function string(s,max){return typeof s==='string'&&s.length<=max;}
export function validate(data){
  if(!data||data.schema!==1||arrays.some(k=>!Array.isArray(data[k])||data[k].length>50000))throw new Error('备份格式或版本不受支持');
  for(const k of arrays) {const ids=new Set();for(const x of data[k]){
    if(!x||!string(x.id,160)||!x.id||ids.has(x.id))throw new Error('记录ID无效或重复');ids.add(x.id);
    if(!string(x.updatedAt,40)||!Number.isFinite(Date.parse(x.updatedAt)))throw new Error('记录时间无效');
    if(k==='notes'&&(!string(x.title,200)||!string(x.text,30000)||!string(x.evidence,12000)||!dateOK(x.date)||!['概念卡','原文卡','实践卡','辨析卡'].includes(x.type)||!Number.isInteger(x.hexagram)||x.hexagram<1||x.hexagram>64))throw new Error('笔记内容无效');
    if(k==='attempts'&&(!string(x.questionId,100)||!['line','trigram','change','position'].includes(x.type)||typeof x.correct!=='boolean'||!dateOK(x.date)))throw new Error('练习记录无效');
    if(k==='reviews'&&(!/^(line|trigram|change|position):\d{1,10}$/.test(x.id)||!Number.isInteger(x.box)||x.box<0||x.box>5||!Number.isFinite(x.dueAt)))throw new Error('复习计划无效');
    if(k==='readings'&&(!Number.isInteger(x.hexagram)||x.hexagram<1||x.hexagram>64||!dateOK(x.date)))throw new Error('阅读记录无效');
    if(k==='practice'&&(!Array.isArray(x.values)||x.values.length!==6||x.values.some(v=>![6,7,8,9].includes(v))||!dateOK(x.date)))throw new Error('构卦记录无效');
    if(k==='completed'&&(!/^lesson-(?:[1-9]|1[0-2])$/.test(x.id)||typeof x.done!=='boolean'))throw new Error('课程进度无效');
  }}
  return Object.fromEntries([['schema',1],...arrays.map(k=>[k,data[k].map(x=>({...x}))])]);
}
export function merge(a,b){a=validate(a);b=validate(b);const out=fresh();for(const k of arrays){const items=new Map(a[k].map(x=>[x.id,x]));for(const x of b[k]){const old=items.get(x.id);if(!old||Date.parse(x.updatedAt)>Date.parse(old.updatedAt))items.set(x.id,x);}out[k]=[...items.values()];}return out;}
export function load(storage=localStorage){const raw=storage.getItem(KEY);if(!raw)return fresh();try{return validate(JSON.parse(raw));}catch{throw new Error('本机学习数据无法读取。请先导出原始数据，再导入正确备份；系统未清空原数据。');}}
export function persist(data,storage=localStorage){const merged=merge(load(storage),data);storage.setItem(KEY,JSON.stringify(merged));return merged;}
export function localDate(d=new Date()){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
export function summary(data,start,end){
  validate(data);if(!dateOK(start)||!dateOK(end)||start>end)throw new Error('请选择有效日期范围');
  const inRange=x=>x.date>=start&&x.date<=end;
  const attempts=data.attempts.filter(inRange),readings=data.readings.filter(inRange),notes=data.notes.filter(x=>!x.deleted&&inRange(x)),practice=data.practice.filter(inRange),correct=attempts.filter(x=>x.correct).length;
  const weak=Object.entries(attempts.reduce((a,x)=>(a[x.type]=(a[x.type]||0)+(x.correct?0:1),a),{})).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
  const text=`易学研习室学习复盘（${start} 至 ${end}）\n练习：${attempts.length}题，正确${correct}题${attempts.length?'，正确率'+Math.round(correct/attempts.length*100)+'%':''}\n阅读：${readings.length}次，涉及${new Set(readings.map(x=>x.hexagram)).size}卦\n构卦实践：${practice.length}次\n学习卡片：${notes.length}张\n薄弱点：${weak.map(([k,n])=>({line:'六爻命名',trigram:'上下卦',change:'变卦',position:'爻位'}[k]+`错${n}题`)).join('、')||'暂无错题记录'}\n本期卡片：${notes.map(x=>x.title).join('、')||'暂无'}\n下次学习：先复习错题，再选一卦完成原文与自己理解的对读。`;
  return {schema:'yi-learning-summary/v1',start,end,counts:{attempts:attempts.length,correct,readings:readings.length,notes:notes.length,practice:practice.length},text};
}
