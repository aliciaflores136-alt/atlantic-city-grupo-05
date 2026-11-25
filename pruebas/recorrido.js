// Ejecutar únicamente en una copia para pruebas. Crea cliente, visita, caso y seguimiento.
const assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');
const {ahora}=require('../servidor/reglas');
async function probar(base,usuario,clave) {
  let cookie='';
  async function api(path,m='GET',body,status=200) {
    const r=await fetch(base+'/api/'+path,{method:m,headers:{'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});
    if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
    const d=await r.json();assert.equal(r.status,status,path+' · '+(d.mensaje||r.status));return d;
  }
  await api('dashboard','GET',null,401);
  await api('login','POST',{usuario,clave});console.log('01 Acceso y protección de sesión: correcto');
  const d0=await api('dashboard');
  const cats=await api('catalogos');
  const bruno=(await api('clientes?q=70000002')).clientes[0];assert.equal(bruno.IdCliente,'C002');
  console.log('02 Búsqueda por documento: C002');
  const f={Nombres:'Ensayo',Apellidos:'De Prueba',TipoDocumento:'Pasaporte',NumeroDocumento:'T'+randomBytes(5).toString('hex').toUpperCase(),
    PaisEmisorDocumento:'Chile',Nacionalidad:'Chilena',Correo:'ensayo@example.org',IdSegmento:'SG01'};
  const c=(await api('clientes','POST',f,201)).IdCliente;
  await api('clientes','POST',f,409);await api('clientes/'+c,'PUT',{...f,Nombres:'Ensayo actualizado'});
  assert.equal((await api('clientes/'+c)).cliente.Nombres,'Ensayo actualizado');
  console.log('03 Alta, rechazo de duplicado y edición: correctos');
  await api('marketing/campana','PUT',{IdSegmento:'SG01'});
  const asignada=await api('clientes/'+c+'/beneficio','POST');
  assert.equal(asignada.estado,'asignada');
  assert.equal((await api('clientes/'+c+'/beneficio/aceptar','POST')).estado,'aceptada');
  assert.equal((await api('clientes/C001/beneficio','POST')).estado,'sin_oferta');
  console.log('04 Marketing, asignación, aceptación y cliente sin oferta: correctos');
  const j={IdJuego:cats.JUEGOS.find(x=>x.Estado==='A').IdJuego,IdMetodoPago:cats.METODOS_PAGO.find(x=>x.Estado==='A').IdMetodoPago,
    CantidadPartidas:2,Gasto:'40.00',Premio:'10.00',Resultado:'Perdió',IdAsignacion:asignada.IdAsignacion};
  const v={IdCliente:c,FechaHoraInicio:ahora(),detalles:[j]};
  const vid=(await api('visitas','POST',v,201)).IdVisita;
  const det=(await api('visitas/'+vid)).visita.detalles[0];
  assert.equal(det.pagos.length,2);assert.equal(det.promociones.length,1);
  await api('visitas','POST',v,409);
  assert.equal((await api('visitas?IdCliente='+c)).visitas.length,1);
  console.log('05 Visita, dos pagos, uso y reversión de uso repetido: correctos');
  const a=(await api('atenciones','POST',{IdCliente:c,IdVisita:vid,Asunto:'Verificar cupón',Descripcion:'Consulta de prueba',TipoAtencion:'Consulta'},201)).IdAtencion;
  await api('atenciones/'+a+'/seguimientos','POST',{FechaSeguimiento:ahora(),Estado:'Resuelto',Respuesta:'Uso confirmado'},201);
  const caso=(await api('atenciones/'+a)).atencion;assert.equal(caso.Estado,'Resuelto');assert.equal(caso.seguimientos.length,1);
  console.log('06 Caso, seguimiento e historial: correctos');
  const d=await api('dashboard');assert.equal(d.clientes,d0.clientes+1);assert.equal(d.visitas,d0.visitas+1);assert.equal(d.casos_pendientes,d0.casos_pendientes);
  const rep=await api('reportes?minimo=1');assert.equal(Number(rep.clientes.find(x=>x.IdCliente===c).Gasto),40);
  assert.ok(rep.promociones.find(x=>x.IdPromocion==='PA04A').Usos>=1);console.log('07 Panel y reportes: correctos');
  await api('logout','POST');await api('sesion','GET',null,401);console.log('08 Cierre de sesión: correcto');
}
module.exports={probar};
