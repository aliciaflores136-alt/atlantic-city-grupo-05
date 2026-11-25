const path=require('node:path');
const express=require('express');
const db=require('./base');
const app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'1mb'}));
app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');next();});
require('./api').instalar(app,db);
app.use('/vendor',express.static(path.dirname(require.resolve('bootstrap/dist/css/bootstrap.min.css'))));
app.use('/interfaz',express.static(path.join(__dirname,'../FrontEnd')));
app.get('/',(req,res)=>res.redirect('/interfaz/index.html'));
app.use('/api',(req,res)=>res.status(404).json({mensaje:'Ruta no encontrada.'}));
app.use((e,req,res,next)=>{
  if(e.errno===1062)return res.status(409).json({mensaje:'Ya existe un registro con estos datos.'});
  if([1451,1452].includes(e.errno))return res.status(409).json({mensaje:'Revisa los registros relacionados.'});
  if(!e.estado&&!e.status)console.error('Error del servidor:',e.code||e.name);
  res.status(e.estado||e.status||500).json({mensaje:e.estado?e.message:'Revisa la solicitud y la conexión con MySQL.'});
});
const puerto=Number(process.env.PORT||3000);
db.pool.execute('SELECT IdPromocion FROM REGLAS_SEGMENTO_PROMOCION LIMIT 1').then(()=>{
  app.listen(puerto,'127.0.0.1',()=>console.log('Abre http://127.0.0.1:'+puerto+'/interfaz/index.html'));
}).catch(async e=>{console.error('MySQL no está preparado:',e.code||e.message);await db.pool.end();process.exitCode=1;});
