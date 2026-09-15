import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const dir of ['backend/eathubbackend','frontend/eathubfrontone']){
 const cwd=path.join(root,dir);
 if(!fs.existsSync(path.join(cwd,'package.json')))throw Error('Initialize the code first: git submodule update --init --recursive');
 const run=spawnSync('npm',['ci'],{cwd,stdio:'inherit',shell:process.platform==='win32'});
 if(run.error)throw run.error;if(run.status)process.exit(run.status);
 const env=path.join(cwd,'.env');
 if(!fs.existsSync(env)){
  let template=fs.readFileSync(path.join(cwd,'.env.example'),'utf8');
  if(dir.startsWith('backend'))template=template.replace(/^JWT_SECRET=.*$/m,'JWT_SECRET='+randomBytes(48).toString('hex'));
  fs.writeFileSync(env,template,{mode:0o600});
 }
}
console.log('Dependencies ready. Existing settings were preserved.');
console.log('Preview with npm run demo. For your real data, set backend/eathubbackend/.env DATABASE_URL, then npm run db:migrate and npm run dev.');
