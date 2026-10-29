import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base='http://127.0.0.1:5173', setupKey=readFileSync('.dev.vars','utf8').match(/SETUP_KEY="([^"]+)"/)[1];
let cookie='';
async function call(body,c=cookie){const r=await fetch(base+'/api/stock',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...(c?{Cookie:c}:{})},body:JSON.stringify(body)});const d=await r.json();return {status:r.status,d,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function state(c=cookie){const r=await fetch(base+'/api/stock',{headers:c?{Cookie:c}:{}});return r.json();}
let d=await state();assert.equal(d.user,null);assert.equal(d.products,undefined);
assert.equal((await call({action:'product'},'')).status,401);
let login=await call({action:'setup',setupKey,name:'Administrador de prueba',email:'admin@example.test',password:'PruebaLocal2026!'});assert.equal(login.status,200,JSON.stringify(login.d));cookie=login.cookie;d=await state();assert.equal(d.products.length,21);assert.equal(d.products.find(x=>x.name==='Artículo de prueba 1').quantity,30);assert.equal(d.products.find(x=>x.name==='Artículo de prueba 2').quantity,25);assert.equal(d.products.filter(x=>x.quantity<10).length,11);console.log('OK inventario inicial y acceso protegido');
assert.equal((await call({action:'register',name:'Empleado de prueba',email:'empleado@example.test',password:'EmpleadoLocal2026!'},'')).status,200);
assert.equal((await call({action:'login',email:'empleado@example.test',password:'EmpleadoLocal2026!'},'')).status,403);
d=await state();const employee=d.users.find(x=>x.email==='empleado@example.test');assert.equal((await call({action:'user',id:employee.id,role:'employee',active:true})).status,200);
const employeeLogin=await call({action:'login',email:'empleado@example.test',password:'EmpleadoLocal2026!'},'');const employeeCookie=employeeLogin.cookie;assert.equal(employeeLogin.status,200);
assert.equal((await call({action:'mail',from:'stock@example.test',key:'invalid'},employeeCookie)).status,403);assert.equal((await state(employeeCookie)).users.length,0);console.log('OK registro, aprobación y permisos de empleado');
d=await state();let p=d.products.find(x=>x.name==='Artículo de prueba 2');const op=crypto.randomUUID();const move={action:'move',id:p.id,version:p.version,operation:op,kind:'out',amount:16,reason:'Prueba de salida'};let out=await call(move,employeeCookie);assert.equal(out.status,200,JSON.stringify(out.d));assert.equal((await call(move,employeeCookie)).status,200);assert.equal((await call({...move,operation:crypto.randomUUID()},employeeCookie)).status,409);
d=await state();p=d.products.find(x=>x.id===p.id);assert.equal(p.quantity,9);assert.equal(d.movements.filter(x=>x.id===op).length,1);assert.equal(d.alerts.filter(x=>x.id===op).length,1);assert.equal((await call({...move,operation:crypto.randomUUID(),version:p.version,amount:100},employeeCookie)).status,400);console.log('OK salida, alerta, repetición segura y rechazo de stock negativo');
const parallel=await Promise.all([1,2].map(n=>call({...move,operation:crypto.randomUUID(),version:p.version,kind:'in',amount:n},employeeCookie)));assert.deepEqual(parallel.map(x=>x.status).sort(),[200,409]);console.log('OK dos empleados en simultáneo no sobrescriben stock');
const plate={action:'product',name:'Placa de prueba 18 mm',category:'Placas',unit:'placas',quantity:2.5,minimum:1,warning:2,location:'Estante de prueba',notes:''};assert.equal((await call(plate,employeeCookie)).status,200);d=await state();p=d.products.find(x=>x.name===plate.name);assert.equal((await call({action:'move',id:p.id,version:p.version,operation:crypto.randomUUID(),kind:'count',amount:0,reason:'Recuento físico de prueba'},employeeCookie)).status,200);console.log('OK alta de placas, cantidades decimales y recuento cero');
const csrf=await fetch(base+'/api/stock',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://otro-sitio.test',Cookie:cookie},body:JSON.stringify({action:'logout'})});assert.equal(csrf.status,403);
assert.equal((await call({action:'logout'},employeeCookie)).status,200);assert.equal((await state(employeeCookie)).user,null);console.log('OK protección de formularios y cierre de sesión');
console.log('Todas las verificaciones funcionales pasaron. Base local de prueba; producción intacta.');

