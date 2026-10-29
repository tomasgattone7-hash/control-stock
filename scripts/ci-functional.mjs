import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
if(process.env.GITHUB_ACTIONS!=='true')throw Error('Este verificador solo se ejecuta en una máquina temporal de GitHub Actions.');
if(existsSync('.dev.vars'))throw Error('Ya existe una configuración local. No se sobrescribe.');
const runtime=process.execPath;
const testInventory=Array.from({length:21},(_,i)=>['Artículo de prueba '+(i+1),'Pruebas',i===0?30:i===1?25:i<13?3:20,'unidades','Datos ficticios de prueba']);
let server,logs='';
try{
writeFileSync('.dev.vars',`APP_SECRET="${randomBytes(32).toString('hex')}"\nSETUP_KEY="${randomBytes(24).toString('hex')}"\nINITIAL_STOCK_JSON='${JSON.stringify(testInventory)}'\n`,{mode:0o600});
const migration=spawnSync(runtime,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file','drizzle/0000_long_stingray.sql'],{stdio:'inherit',env:process.env});
if(migration.status!==0)throw Error('No se pudo preparar la base local de prueba.');
server=spawn(runtime,['scripts/run-framework.mjs','dev'],{env:process.env,stdio:['ignore','pipe','pipe']});
for(const stream of [server.stdout,server.stderr])stream.on('data',x=>{logs=(logs+x.toString()).slice(-10000);});
let ready=false;
for(let i=0;i<80;i++){if(server.exitCode!==null)break;try{const response=await fetch('http://127.0.0.1:5173/api/stock',{signal:AbortSignal.timeout(1500)});if(response.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
if(!ready)throw Error('La aplicación de prueba no inició.\n'+logs);
const result=spawnSync(runtime,['verify-stock.mjs'],{stdio:'inherit',env:process.env});
if(result.status!==0)throw Error('Fallaron las pruebas funcionales.');
}finally{if(server&&server.exitCode===null){server.kill('SIGTERM');await Promise.race([new Promise(r=>server.once('exit',r)),new Promise(r=>setTimeout(r,5000))]);if(server.exitCode===null)server.kill('SIGKILL');}if(existsSync('.dev.vars'))unlinkSync('.dev.vars');}

