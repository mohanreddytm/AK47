import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const demo=process.argv.includes('--demo');
const children=[];let closing=false;
function stop(code=0){if(closing)return;closing=true;for(const child of children)child.kill('SIGTERM');process.exitCode=code;}
for(const [dir,script] of [['backend/eathubbackend',demo?'demo':'dev'],['frontend/eathubfrontone','start']]){
 const child=spawn('npm',['run',script],{cwd:path.join(root,dir),stdio:'inherit',shell:process.platform==='win32',env:{...process.env,...(demo?{REACT_APP_API_BASE_URL:'http://localhost:8000',DEMO_PORT:'8000'}:{})}});
 children.push(child);child.on('error',e=>{console.error(e.message);stop(1);});child.on('exit',code=>{if(!closing)stop(code||0);});
}
process.once('SIGINT',()=>stop());process.once('SIGTERM',()=>stop());
