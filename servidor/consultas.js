const {fallo}=require('./reglas');
async function filas(c,sql,args=[]){const [r]=await c.execute(sql,args);return r;}
async function uno(c,sql,args=[]){return (await filas(c,sql,args))[0];}
// Tabla, columna y campos provienen exclusivamente de las rutas y del cargador.
async function registro(c,tabla,columna,id,bloquear=false) {
  const r=await uno(c,'SELECT * FROM '+tabla+' WHERE '+columna+'=?'+(bloquear?' FOR UPDATE':''),[id]);
  if(!r)fallo('Registro no encontrado en '+tabla+'.',404);
  return r;
}
async function insertar(c,tabla,fila){
  const campos=Object.keys(fila);
  await c.execute('INSERT INTO '+tabla+' ('+campos.join(',')+') VALUES ('+campos.map(()=>'?').join(',')+')',Object.values(fila));
}
module.exports={filas,uno,registro,insertar};
