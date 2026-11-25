const {filas}=require('./consultas');
const {fallo}=require('./reglas');
async function reportes(c,q){
  const desde=q.desde||'1000-01-01',hasta=q.hasta||'9999-12-31';
  const minimo=Number(q.minimo||0);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(desde)||!/^\d{4}-\d{2}-\d{2}$/.test(hasta)||desde>hasta||
     !Number.isSafeInteger(minimo)||minimo<0)fallo('Revisa las fechas y el mínimo de visitas.');
  const clientes=await filas(c,`SELECT c.IdCliente,c.Nombres,c.Apellidos,s.Segmento,COUNT(DISTINCT v.IdVisita) AS Visitas,
    COALESCE(SUM(d.Gasto),0) AS Gasto FROM CLIENTES c JOIN SEGMENTOS_CLIENTES s ON s.IdSegmento=c.IdSegmento
    LEFT JOIN VISITAS v ON v.IdCliente=c.IdCliente AND DATE(v.FechaHoraInicio) BETWEEN ? AND ?
    LEFT JOIN DETALLES_VISITAS d ON d.IdVisita=v.IdVisita GROUP BY c.IdCliente,c.Nombres,c.Apellidos,s.Segmento
    HAVING COUNT(DISTINCT v.IdVisita)>=? ORDER BY Visitas DESC,Gasto DESC,c.IdCliente`,[desde,hasta,minimo]);
  const promociones=await filas(c,`SELECT p.IdPromocion,p.Nombre,COUNT(u.IdUso) AS Usos FROM PROMOCIONES p
    LEFT JOIN CLIENTES_PROMOCIONES a ON a.IdPromocion=p.IdPromocion
    LEFT JOIN USOS_PROMOCIONES u ON u.IdAsignacion=a.IdAsignacion AND DATE(u.FechaUso) BETWEEN ? AND ?
    GROUP BY p.IdPromocion,p.Nombre ORDER BY Usos DESC,p.IdPromocion`,[desde,hasta]);
  return {clientes,promociones};
}
module.exports={reportes};
