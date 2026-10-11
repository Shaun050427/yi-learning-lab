import json,hashlib,re
from pathlib import Path
names='乾 坤 屯 蒙 需 讼 师 比 小畜 履 泰 否 同人 大有 谦 豫 随 蛊 临 观 噬嗑 贲 剥 复 无妄 大畜 颐 大过 坎 离 咸 恒 遁 大壮 晋 明夷 家人 睽 蹇 解 损 益 夬 姤 萃 升 困 井 革 鼎 震 艮 渐 归妹 丰 旅 巽 兑 涣 节 中孚 小过 既济 未济'.split()
trad='乾 坤 屯 蒙 需 訟 師 比 小畜 履 泰 否 同人 大有 謙 豫 隨 蠱 臨 觀 噬嗑 賁 剝 復 无妄 大畜 頤 大過 坎 離 咸 恒 遯 大壯 晉 明夷 家人 睽 蹇 解 損 益 夬 姤 萃 升 困 井 革 鼎 震 艮 漸 歸妹 豐 旅 巽 兌 渙 節 中孚 小過 既濟 未濟'.split()
trigrams=[{'name':n,'image':im,'bits':list(map(int,b)),'symbol':sym} for n,im,b,sym in [('乾','天','111','☰'),('兑','泽','110','☱'),('离','火','101','☲'),('震','雷','100','☳'),('巽','风','011','☴'),('坎','水','010','☵'),('艮','山','001','☶'),('坤','地','000','☷')]]
# Rows = lower trigram, columns = upper trigram, both in the order above.
matrix=[[1,43,14,34,9,5,26,11],[10,58,38,54,61,60,41,19],[13,49,30,55,37,63,22,36],[25,17,21,51,42,3,27,24],[44,28,50,32,57,48,18,46],[6,47,64,40,59,29,4,7],[33,31,56,62,53,39,52,15],[12,45,35,16,20,8,23,2]]
raw=json.loads(Path('../src/data/source-transcription.json').read_text())
data=[]
for num,(name,tn) in enumerate(zip(names,trad),1):
 r=raw[tn];assert len(r['lines'])==6,(name,r)
 lower,upper=next((l,u) for l in range(8) for u in range(8) if matrix[l][u]==num)
 bits=trigrams[lower]['bits']+trigrams[upper]['bits']
 full=(trigrams[upper]['image']+'为'+trigrams[lower]['image']) if lower==upper else trigrams[upper]['image']+trigrams[lower]['image']+name
 if lower==upper:full=name+'为'+trigrams[lower]['image']
 variants=[{'position':i+1,'recorded':text} for i,text in enumerate(r['lines']) if '一作' in text]
 cleaned=[re.sub(r'一作[「“][^」”]+[」”]', '',text) for text in r['lines']]
 data.append({'variants':variants,'number':num,'name':name,'traditional':tn,'title':full,'bits':bits,'lower':trigrams[lower]['name'],'upper':trigrams[upper]['name'],'symbol':chr(0x4dc0+num-1),'judgement':r['judgement'],'lines':cleaned,'extra':r['extra'],'source':r['source'],'revision':r['revision'],'edition':'维基文库《周易》逐卦录入本；保留原字与标点，异文附记单列，不附现代译注'})
Path('../src/data/hexagrams.js').write_text('export const HEXAGRAMS = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
Path('../src/data/trigrams.js').write_text('export const TRIGRAMS = '+json.dumps(trigrams,ensure_ascii=False,indent=2)+';\n')
Path('../src/data/source-manifest.json').write_text(json.dumps({'retrievedAt':'2026-10-11','origin':'https://zh.wikisource.org/wiki/周易','basis':'公有领域古籍正文；录入标点保留','hexagrams':[{k:r[k] for k in ['number','traditional','source','revision']} for r in data],'textSha256':hashlib.sha256(json.dumps(data,ensure_ascii=False).encode()).hexdigest()},ensure_ascii=False,indent=2))
print('assembled',len(data),'hexagrams /',sum(len(x['lines']) for x in data),'lines')
