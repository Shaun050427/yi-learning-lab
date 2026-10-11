import {cp,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
await rm(path.join(root,'dist'),{recursive:true,force:true});await mkdir(path.join(root,'dist'),{recursive:true});
for(const file of ['index.html','src','service-worker.js','manifest.webmanifest','icon.svg','.nojekyll'])await cp(path.join(root,file),path.join(root,'dist',file),{recursive:true});
console.log('Static application built in dist/');
