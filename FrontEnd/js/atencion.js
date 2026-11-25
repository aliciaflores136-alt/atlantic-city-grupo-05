async function cargarAtencion() {
  const {clientes}=await api('clientes');
  const cliente=id=>nombre(clientes.find(c=>c.IdCliente===id) || {Nombres:id,Apellidos:''});
  if (sel('#lista-casos')) {
    const {atenciones}=await api('atenciones');
    filas(sel('#lista-casos'),atenciones,c=>[seguro(cliente(c.IdCliente)),seguro(c.Asunto),seguro(c.Estado),
      enlace('seguimiento',c.IdAtencion,'Ver seguimiento')],'No hay casos registrados.');
  } else if (sel('#caso')) {
    const {visitas}=await api('visitas');
    opciones(sel('#clienteId'),clientes.filter(c=>c.Estado==='A'),'IdCliente',nombre);
    function cargarVisitas() {
      opciones(sel('#visitaId'),visitas.filter(v=>v.IdCliente===sel('#clienteId').value),'IdVisita',
        v=>v.IdVisita+' · '+fecha(v.FechaHoraInicio),'Sin visita relacionada');
    }
    sel('#clienteId').addEventListener('change',cargarVisitas);
    cargarVisitas();
    sel('#estado').value='Pendiente';
    alEnviar(sel('#caso'),async f=>{
      await api('atenciones','POST',{IdCliente:f.clienteId,IdVisita:f.visitaId,Asunto:f.asunto,
        Estado:f.estado,Descripcion:f.descripcion,TipoAtencion:f.tipo});
      confirmar('Caso registrado correctamente','atencion');
    });
  } else {
    const ruta='atenciones/'+encodeURIComponent(registroId);
    const {atencion:c}=await api(ruta);
    sel('#datos-caso').innerHTML=detalle({Cliente:cliente(c.IdCliente),Asunto:c.Asunto,Descripción:c.Descripcion,
      'Visita relacionada':c.IdVisita,Estado:c.Estado});
    sel('#estado').value=c.Estado;
    sel('#historial-caso').innerHTML='<h2>Seguimientos</h2>'+c.seguimientos.map(s=>
      detalle({Fecha:fecha(s.FechaSeguimiento),Estado:s.Estado,Respuesta:s.Respuesta})).join('');
    alEnviar(sel('#seguimiento'),async f=>{
      await api(ruta+'/seguimientos','POST',{FechaSeguimiento:f.fecha,Respuesta:f.respuesta,Estado:f.estado});
      confirmar('Seguimiento guardado correctamente','atencion');
    });
  }
}
cargarAtencion().catch(e=>aviso(e.message));
