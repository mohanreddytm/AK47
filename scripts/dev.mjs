import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {startNpm,stopTree} from './processes.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const demo=process.argv.includes('--demo');
const required=[
 'frontend/eathubfrontone/node_modules/react-scripts/bin/react-scripts.js',
 'backend/eathubbackend/node_modules/express/package.json',
 ...(demo?['backend/eathubbackend/node_modules/@electric-sql/pglite/package.json']:['backend/eathubbackend/node_modules/nodemon/bin/nodemon.js']),
];
if(fs.existsSync(path.join(root,'.eathub-setup-incomplete')) || required.some(file=>!fs.existsSync(path.join(root,file)))){
 console.error('Dependencies are incomplete. Run npm run setup and wait for "Dependencies ready" before starting the app. Neither server was started.');
 process.exit(1);
}
const children=[];let closing=false;
function stop(code=0){
 if(closing)return;
 closing=true;
 for(const child of children){
  try{stopTree(child);}catch(error){console.error(`Could not stop a server: ${error.message}`);}
 }
 process.exitCode=code;
}
for(const [dir,script] of [['backend/eathubbackend',demo?'demo':'dev'],['frontend/eathubfrontone','start']]){
 try{
  const child=startNpm(['run',script],{cwd:path.join(root,dir),stdio:'inherit',env:{...process.env,...(demo?{REACT_APP_API_BASE_URL:'http://localhost:8000',DEMO_PORT:'8000'}:{})}});
  children.push(child);
  child.on('error',error=>{console.error(error.message);stop(1);});
  child.on('exit',(code,signal)=>{
   if(!closing){
    console.error(`${dir} stopped (${signal || code}). Stopping both servers.`);
    stop(code ?? 1);
   }
  });
 }catch(error){console.error(error.message);stop(1);break;}
}
process.once('SIGINT',()=>stop());process.once('SIGTERM',()=>stop());
