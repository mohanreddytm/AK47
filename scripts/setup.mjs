import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {npmCommand} from './processes.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const incomplete=path.join(root,'.eathub-setup-incomplete');
fs.writeFileSync(incomplete,'Installation has not finished. Run npm run setup again.\n');
for(const dir of ['backend/eathubbackend','frontend/eathubfrontone']){
 const cwd=path.join(root,dir);
 if(!fs.existsSync(path.join(cwd,'package.json')))throw Error('Initialize the code first: git submodule update --init --recursive');
 console.log(`Installing ${dir}...`);
 const [command,args]=npmCommand(['ci','--fetch-retries=5']);
 const run=spawnSync(command,args,{cwd,stdio:'inherit',shell:false,windowsHide:true});
 if(run.error || run.status !== 0){
  if(run.error)console.error(run.error.message);
  console.error(`Setup stopped while installing ${dir}. Fix the npm error above and rerun npm run setup. Servers cannot start until setup completes.`);
  process.exit(run.status || 1);
 }
 const env=path.join(cwd,'.env');
 if(!fs.existsSync(env)){
  let template=fs.readFileSync(path.join(cwd,'.env.example'),'utf8');
  if(dir.startsWith('backend'))template=template.replace(/^JWT_SECRET=.*$/m,'JWT_SECRET='+randomBytes(48).toString('hex'));
  fs.writeFileSync(env,template,{mode:0o600});
 }
}
fs.rmSync(incomplete,{force:true});
console.log('Dependencies ready. Existing settings were preserved.');
console.log('Preview with npm run demo. For your real data, set backend/eathubbackend/.env DATABASE_URL, then npm run db:migrate and npm run dev.');
