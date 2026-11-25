const mysql = require('mysql2/promise');
const nombre = process.env.MYSQL_DATABASE || 'atlantic_city';
if (!/^[a-zA-Z0-9_]+$/.test(nombre)) throw new Error('Nombre de base inválido.');
const config = {host:process.env.MYSQL_HOST || '127.0.0.1',port:Number(process.env.MYSQL_PORT || 3306),
  user:process.env.MYSQL_USUARIO,password:process.env.MYSQL_CLAVE,charset:'utf8mb4',dateStrings:true};
const pool=mysql.createPool({...config,database:nombre,connectionLimit:6});
async function transaccion(fn) {
  const c=await pool.getConnection();
  try { await c.beginTransaction(); const r=await fn(c); await c.commit(); return r; }
  catch(e) { await c.rollback(); throw e; }
  finally { c.release(); }
}
module.exports={pool,config,nombre,transaccion};
