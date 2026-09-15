import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {spawn, spawnSync} from 'node:child_process';

const scripts=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function fixture(t) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'eathub startup & recovery '));
 const write=(file,content='')=>{const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content);};
 for(const file of ['dev.mjs','setup.mjs','processes.mjs'])write('scripts/'+file,fs.readFileSync(path.join(scripts,file)));
 for(const dir of ['backend/eathubbackend','frontend/eathubfrontone']){
  write(dir+'/package.json','{}');
  write(dir+'/.env.example','JWT_SECRET=\n');
  write(dir+'/.env','EXISTING_SETTING=keep-me\n');
 }
 for(const file of [
  'frontend/eathubfrontone/node_modules/react-scripts/bin/react-scripts.js',
  'backend/eathubbackend/node_modules/express/package.json',
  'backend/eathubbackend/node_modules/@electric-sql/pglite/package.json',
 ])write(file,'{}');
 write('npm cli & fixture.cjs',`
  const {spawn}=require('node:child_process');
  if(process.argv[2]==='ci'){
   if(process.env.FAIL_FRONT_INSTALL==='1' && process.cwd().includes('eathubfrontone')){
    console.error('npm error network ECONNRESET');process.exit(71);
   }
   process.exit(0);
  }
  const child=spawn(process.execPath,['worker.cjs'],{stdio:'inherit'});
  child.on('error',()=>process.exit(1));
  child.on('exit',code=>process.exit(code ?? 1));
 `);
 write('backend/eathubbackend/worker.cjs',`
  const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
  const server=net.createServer(socket=>socket.end());
  server.listen(0,'127.0.0.1',()=>fs.writeFileSync(path.join(process.env.FIXTURE_ROOT,'backend.json'),JSON.stringify({pid:process.pid,port:server.address().port})));
  setTimeout(()=>process.exit(0),15000).unref();
 `);
 write('frontend/eathubfrontone/worker.cjs',`
  const fs=require('node:fs'),path=require('node:path');
  const timer=setInterval(()=>{if(fs.existsSync(path.join(process.env.FIXTURE_ROOT,'backend.json'))){clearInterval(timer);console.error('Simulated frontend failure');process.exit(23);}},30);
  setTimeout(()=>process.exit(24),10000).unref();
 `);
 const env={...process.env,npm_execpath:path.join(root,'npm cli & fixture.cjs'),FIXTURE_ROOT:root};
 t.after(()=>{
  const record=path.join(root,'backend.json');
  if(fs.existsSync(record)){
   try{process.kill(JSON.parse(fs.readFileSync(record)).pid,'SIGTERM');}catch{}
  }
  fs.rmSync(root,{recursive:true,force:true});
 });
 return {root,env,run:(script,extra={})=>spawnSync(process.execPath,['scripts/'+script,...(script==='dev.mjs'?['--demo']:[])],{cwd:root,env:{...env,...extra},encoding:'utf8',timeout:10000})};
}

test('a failed frontend install blocks demo even if executable files remain',t=>{
 const f=fixture(t);
 const failed=f.run('setup.mjs',{FAIL_FRONT_INSTALL:'1'});
 assert.equal(failed.status,71,failed.stderr);
 assert.match(failed.stderr,/ECONNRESET/);
 assert.match(failed.stderr,/Setup stopped while installing frontend/);
 const blocked=f.run('dev.mjs');
 assert.equal(blocked.status,1,blocked.stderr);
 assert.match(blocked.stderr,/Neither server was started/);
 assert.equal(fs.existsSync(path.join(f.root,'backend.json')),false);
 assert.equal(fs.readFileSync(path.join(f.root,'frontend/eathubfrontone/.env'),'utf8'),'EXISTING_SETTING=keep-me\n');

 const retry=f.run('setup.mjs');
 assert.equal(retry.status,0,retry.stderr);
 assert.match(retry.stdout,/Dependencies ready/);
 assert.equal(fs.existsSync(path.join(f.root,'.eathub-setup-incomplete')),false);
 assert.equal(fs.readFileSync(path.join(f.root,'backend/eathubbackend/.env'),'utf8'),'EXISTING_SETTING=keep-me\n');
 assert.doesNotMatch(retry.stderr,/DEP0190/);
});

test('missing react-scripts from an older interrupted setup starts no API',t=>{
 const f=fixture(t);
 fs.rmSync(path.join(f.root,'frontend/eathubfrontone/node_modules'),{recursive:true});
 const result=f.run('dev.mjs');
 assert.equal(result.status,1,result.stderr);
 assert.match(result.stderr,/Dependencies are incomplete/);
 assert.equal(fs.existsSync(path.join(f.root,'backend.json')),false);
});

test('frontend runtime failure stops the API grandchild and closes its port',async t=>{
 const f=fixture(t);
 const child=spawn(process.execPath,['scripts/dev.mjs','--demo'],{cwd:f.root,env:f.env,stdio:['ignore','pipe','pipe']});
 let output='';
 child.stdout.on('data',data=>output+=data);
 child.stderr.on('data',data=>output+=data);
 const code=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{child.kill();reject(Error('Launcher left a process running: '+output));},12000);
  child.once('error',error=>{clearTimeout(timer);reject(error);});
  child.once('close',code=>{clearTimeout(timer);resolve(code);});
 });
 assert.equal(code,23,output);
 assert.match(output,/Stopping both servers/);
 assert.doesNotMatch(output,/DEP0190/);
 const {port}=JSON.parse(fs.readFileSync(path.join(f.root,'backend.json')));
 const stillListening=await new Promise(resolve=>{
  const socket=net.connect({port,host:'127.0.0.1'});
  socket.once('connect',()=>{socket.destroy();resolve(true);});
  socket.once('error',()=>resolve(false));
 });
 assert.equal(stillListening,false,'The API must not remain running after the frontend fails.');
});
