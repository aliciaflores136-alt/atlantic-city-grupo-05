const {randomBytes,pbkdf2,timingSafeEqual}=require('node:crypto');
const derivar=require('node:util').promisify(pbkdf2);
function fallo(mensaje,estado=400){throw Object.assign(new Error(mensaje),{estado});}
function texto(v,max,etiqueta,opcional=false) {
  if(opcional && (v==null || v==='')) return null;
  if(typeof v!=='string'||!v.trim()||v.trim().length>max) fallo('Revisa el campo '+etiqueta+'.');
  return v.trim();
}
function opcion(v,permitidos,campo){if(!permitidos.includes(v))fallo('Valor incorrecto en '+campo+'.');return v;}
function momento(v) {
  if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(v))fallo('Fecha u hora incorrecta.');
  const s=v.replace(' ','T').padEnd(19,':00');
  const d=new Date(s+'Z');
  if(!Number.isFinite(d.getTime()) || d.toISOString().slice(0,19)!==s)fallo('Fecha u hora incorrecta.');
  return s.replace('T',' ');
}
function ahora(){return new Date(Date.now()-5*3600000).toISOString().slice(0,19).replace('T',' ');}
function id(prefijo){return (prefijo+randomBytes(5).toString('hex').toUpperCase()).slice(0,10);}
function importe(v){
  if(!/^\d{1,8}(\.\d{1,2})?$/.test(String(v)))fallo('El importe debe ser positivo o cero y tener hasta dos decimales.');
  return Number(v);
}
function cliente(f) {
  const c={};
  for(const [k,n] of Object.entries({Nombres:60,Apellidos:80,TipoDocumento:30,NumeroDocumento:20,
    PaisEmisorDocumento:60,Nacionalidad:50,Correo:100,IdSegmento:10}))c[k]=texto(f[k],n,k);
  c.TipoDocumento=({CE:'Carné de extranjería',PAS:'Pasaporte'})[c.TipoDocumento]||c.TipoDocumento;
  opcion(c.TipoDocumento,['DNI','Carné de extranjería','Pasaporte'],'tipo de documento');
  c.NumeroDocumento=c.NumeroDocumento.toUpperCase();
  if(!(c.TipoDocumento==='DNI'?/^\d{8}$/:/^[A-Z0-9]{3,20}$/).test(c.NumeroDocumento))
    fallo('DNI: 8 dígitos. Carné o pasaporte: de 3 a 20 letras o números.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.Correo))fallo('Escribe un correo válido.');
  for(const [k,n] of Object.entries({Telefono:20,Direccion:150,CodigoUbigeo:6}))c[k]=texto(f[k],n,k,true);
  if(c.Telefono&&!/^\+?[0-9 ()-]{7,20}$/.test(c.Telefono))fallo('Teléfono inválido.');
  if(c.CodigoUbigeo&&!/^\d{6}$/.test(c.CodigoUbigeo))fallo('El ubigeo debe tener seis dígitos.');
  c.Estado=opcion(f.Estado??'A',['A','I'],'estado');return c;
}
async function hash(clave,sal=randomBytes(16).toString('hex')) {
  const claveHash=await derivar(clave,sal,1000000,32,'sha256');
  return 'pbkdf2:sha256:1000000$'+sal+'$'+claveHash.toString('hex');
}
async function coincide(clave,guardado) {
  const [metodo,sal,valor]=String(guardado).split('$');
  if(!/^pbkdf2:sha256:\d+$/.test(metodo)||!sal||!(/^[0-9a-f]{64}$/i.test(valor)))return false;
  const iteraciones=Number(metodo.split(':')[2]);
  if(iteraciones<1||iteraciones>2000000)return false;
  return timingSafeEqual(await derivar(clave,sal,iteraciones,32,'sha256'),Buffer.from(valor,'hex'));
}
module.exports={fallo,texto,opcion,momento,ahora,id,importe,cliente,hash,coincide};
