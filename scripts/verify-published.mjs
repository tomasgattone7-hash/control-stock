const raw=process.env.DEPLOYMENT_URL;
if(!raw)throw Error('No se obtuvo la URL publicada.');
const target=new URL('/api/stock',raw);
if(target.protocol!=='https:')throw Error('La publicación debe usar HTTPS.');
let lastError='Sin respuesta';
for(let attempt=1;attempt<=24;attempt++){
  let response,data;
  try{
    response=await fetch(target,{signal:AbortSignal.timeout(8000)});
    data=await response.json();
  }catch(error){
    lastError=error?.cause?.code??error.message;
    console.log('Esperando la disponibilidad HTTPS de la publicación ('+attempt+'/24).');
    if(attempt<24){await new Promise(resolve=>setTimeout(resolve,5000));continue;}
    break;
  }
  if(response.status>=500||response.status===404){
    lastError='HTTP '+response.status;
    if(attempt<24){await new Promise(resolve=>setTimeout(resolve,5000));continue;}
    break;
  }
  if(!response.ok||data.user!==null||Object.hasOwn(data,'products'))throw Error('No se pudo verificar el acceso protegido.');
  console.log('Aplicación publicada y stock protegido: '+new URL(raw).origin);
  process.exit(0);
}
throw Error('La dirección publicada todavía no respondió correctamente por HTTPS: '+lastError);
