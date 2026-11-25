const fs=require('node:fs');
const path=require('node:path');
const mysql=require('mysql2/promise');
const {randomBytes}=require('node:crypto');
const {config,nombre,pool,transaccion}=require('./base');
const {hash}=require('./reglas');
const {uno,insertar}=require('./consultas');
const carpeta=path.join(__dirname,'../base_datos');
const orden=['AREAS','CARGOS','EMPLEADOS','USUARIOS','SEGMENTOS_CLIENTES','DEPARTAMENTOS','PROVINCIAS','UBIGEO',
  'TIPOS_JUEGO','JUEGOS','METODOS_PAGO','PROMOCIONES','CLIENTES','CLIENTES_PROMOCIONES','VISITAS',
  'DETALLES_VISITAS','PAGOS','ATENCIONES','SEGUIMIENTOS_ATENCIONES','USOS_PROMOCIONES'];
async function preparar() {
  const conexion=await mysql.createConnection({...config,multipleStatements:true});
  const sql=n=>fs.readFileSync(path.join(carpeta,n),'utf8').replace(/\batlantic_city\b/g,nombre);
  try {
    await conexion.query(sql('01_estructura.sql'));
    const datos=JSON.parse(fs.readFileSync(path.join(carpeta,'datos_demostracion.json'),'utf8'));
    const cuentas=await transaccion(async c=>{
      const nuevas=[];
      for(const tabla of orden){
        for(const original of datos[tabla]){
          const fila={...original},pk=Object.keys(fila)[0];
          if(await uno(c,'SELECT '+pk+' FROM '+tabla+' WHERE '+pk+'=?',[fila[pk]]))continue;
          if(tabla==='USUARIOS'){
            const clave=randomBytes(12).toString('base64url'); fila.ClaveHash=await hash(clave);
            nuevas.push([fila.NombreUsuario,fila.Rol,clave]);
          }
          await insertar(c,tabla,fila);
        }
      }
      return nuevas;
    });
    for(const [u,r,k] of cuentas)console.log('Cuenta nueva (%s): %s | contraseña inicial: %s',r,u,k);
    await conexion.query(sql('03_promocion_automatica.sql'));
    console.log('Base preparada. Los registros existentes se conservaron.');
  }finally{await conexion.end();}
}
preparar().catch(e=>{console.error('No se completó la preparación:',e.code||e.message);process.exitCode=1;}).finally(()=>pool.end());
