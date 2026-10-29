import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const id=process.env.CLOUDFLARE_DATABASE_ID??'';
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||id==='00000000-0000-4000-8000-000000000000')throw Error('Configurá CLOUDFLARE_DATABASE_ID con el ID de tu base D1.');
const name=process.env.CLOUDFLARE_WORKER_NAME||'zarpado-stock';
if(!/^[a-z][a-z0-9-]{0,61}$/.test(name))throw Error('CLOUDFLARE_WORKER_NAME debe ser un nombre simple, por ejemplo zarpado-stock.');
const file=path.resolve('dist/server/wrangler.json');
const config=JSON.parse(readFileSync(file,'utf8'));
config.name=name;
config.workers_dev=true;
config.d1_databases=[{binding:'DB',database_name:'zarpado-stock',database_id:id,migrations_dir:path.resolve('drizzle')}];
config.r2_buckets=[];
writeFileSync(file,JSON.stringify(config,null,2)+'\n');
console.log('Configuración de publicación preparada. No se incluyeron secretos en el archivo.');

