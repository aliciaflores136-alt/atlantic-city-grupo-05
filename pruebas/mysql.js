// Ensayo en una base nueva e independiente. Conserva la evidencia para Workbench.
const {spawn,execFileSync}=require('node:child_process');
const {randomBytes}=require('node:crypto');
const {setTimeout:esperar}=require('node:timers/promises');
const net=require('node:net');
async function main(){
  const mysql=require('mysql2/promise');
  const {config,pool}=require('../servidor/base');
  const db='ac_ensayo_'+randomBytes(5).toString('hex');
  const con=await mysql.createConnection(config);
  try {await con.query('CREATE DATABASE '+db+' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');}finally{await con.end();await pool.end();}
  const p=net.createServer();
  await new Promise((ok,err)=>{p.once('error',err);p.listen(0,'127.0.0.1',ok);});
  const puerto=p.address().port;await new Promise(ok=>p.close(ok));
  const env={...process.env,MYSQL_DATABASE:db,PORT:String(puerto)};
  const salida=execFileSync(process.execPath,['servidor/preparar.js'],{env,encoding:'utf8'});
  const clave=/lrojas \| contraseña inicial: (\S+)/.exec(salida)?.[1];
  if(!clave)throw new Error('No se creó la cuenta de ensayo.');
  const servidor=spawn(process.execPath,['servidor/iniciar.js'],{env,stdio:['ignore','ignore','inherit']});
  const base='http://127.0.0.1:'+puerto;
  console.log('Base de ensayo:',db);
  try{
    let listo=false;
    for(let i=0;i<50;i++){try{listo=(await fetch(base+'/api/estado')).ok;}catch{}if(listo)break;await esperar(200);}
    if(!listo)throw new Error('El servidor de ensayo no inició.');
    await require('./recorrido').probar(base,'lrojas',clave);
    console.log('Ensayo en MySQL completado. La base de ensayo queda disponible para consultas.');
  }finally{servidor.kill();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
