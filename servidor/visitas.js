const {fallo,texto,opcion,momento,ahora,id,importe}=require('./reglas');
const {registro,uno,insertar}=require('./consultas');
async function usar(c,asignacion,detalle,cliente,fecha) {
  const a=await registro(c,'CLIENTES_PROMOCIONES','IdAsignacion',asignacion,true);
  const p=await registro(c,'PROMOCIONES','IdPromocion',a.IdPromocion,true);
  if(a.IdCliente!==cliente || p.Estado!=='A' || fecha.slice(0,10)<p.FechaInicio || fecha.slice(0,10)>p.FechaFin || fecha<a.FechaAsignacion)
    fallo('La asignación no corresponde al cliente o a la fecha de visita.');
  if(p.IdPromocion==='PA04A'){
    const aceptada=await uno(c,'SELECT FechaAceptacion FROM ACEPTACIONES_PROMOCIONES WHERE IdAsignacion=?',[asignacion]);
    if(!aceptada||aceptada.FechaAceptacion>fecha)fallo('El cliente debe aceptar la promoción antes de utilizarla.',409);
  }
  const usos=await uno(c,'SELECT COUNT(*) AS n FROM USOS_PROMOCIONES u JOIN CLIENTES_PROMOCIONES a ON a.IdAsignacion=u.IdAsignacion WHERE a.IdCliente=? AND a.IdPromocion=?',[cliente,p.IdPromocion]);
  if(usos.n>=p.MaxUsosPorCliente)fallo('Se alcanzó el máximo de usos.',409);
  await insertar(c,'USOS_PROMOCIONES',{IdUso:id('UP'),IdAsignacion:asignacion,IdDetalleVisita:detalle,FechaUso:fecha});
}
async function registrar(c,f,usuario) {
  const cliente=await registro(c,'CLIENTES','IdCliente',texto(f.IdCliente,10,'cliente'),true);
  if(cliente.Estado!=='A')fallo('Cliente inactivo.');
  const inicio=momento(f.FechaHoraInicio),fin=f.FechaHoraFin?momento(f.FechaHoraFin):null;
  if(fin&&fin<inicio)fallo('La salida debe ser posterior o igual a la entrada.');
  if(!Array.isArray(f.detalles)||f.detalles.length<1||f.detalles.length>50)fallo('Agrega entre 1 y 50 juegos.');
  const visita=id('V');
  await insertar(c,'VISITAS',{IdVisita:visita,IdCliente:cliente.IdCliente,IdUsuarioRegistro:usuario,
    FechaHoraInicio:inicio,FechaHoraFin:fin,Observacion:texto(f.Observacion,250,'observación',true)});
  for(const j of f.detalles){
    const juego=await registro(c,'JUEGOS','IdJuego',texto(j.IdJuego,10,'juego'));
    const metodo=await registro(c,'METODOS_PAGO','IdMetodoPago',texto(j.IdMetodoPago,10,'método de pago'));
    if(juego.Estado!=='A'||metodo.Estado!=='A')fallo('Juego o método de pago inactivo.');
    if(!Number.isInteger(j.CantidadPartidas)||j.CantidadPartidas<1||j.CantidadPartidas>1000000)fallo('Revisa la cantidad de partidas.');
    const gasto=importe(j.Gasto),premio=importe(j.Premio),detalle=id('VD');
    const resultado=premio>gasto?'Ganó':premio<gasto?'Perdió':'Empató';
    if(resultado!==j.Resultado)fallo('El resultado debe coincidir con los importes.');
    await insertar(c,'DETALLES_VISITAS',{IdDetalleVisita:detalle,IdVisita:visita,IdJuego:juego.IdJuego,
      CantidadPartidas:j.CantidadPartidas,Gasto:gasto,Premio:premio,Resultado:resultado,Inconveniente:texto(j.Inconveniente,200,'inconveniente',true)});
    for(const [tipo,monto,fecha] of [['GASTO',gasto,inicio],['PREMIO',premio,fin||inicio]]){
      if(monto>0)await insertar(c,'PAGOS',{IdPago:id('PG'),IdDetalleVisita:detalle,TipoPago:tipo,FechaHoraPago:fecha,
        MontoPagado:monto,IdMetodoPago:metodo.IdMetodoPago,IdUsuarioRegistro:usuario,ReferenciaOperacion:texto(j.ReferenciaOperacion,100,'referencia',true)});
    }
    if(j.IdAsignacion){
      const fecha=j.FechaUso?momento(j.FechaUso):inicio;
      if(fecha<inicio||(fin&&fecha>fin))fallo('El uso debe ocurrir durante la visita.');
      await usar(c,j.IdAsignacion,detalle,cliente.IdCliente,fecha);
    }
  }
  return {IdVisita:visita,mensaje:'Visita registrada correctamente'};
}
module.exports={registrar};
