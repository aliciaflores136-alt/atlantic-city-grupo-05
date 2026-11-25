async function cargarCliente() {
  const ruta = 'clientes/'+encodeURIComponent(registroId);
  const catalogo = await api('catalogos');
  const c = registroId ? (await api(ruta)).cliente : null;
  const ubicacion = u => {
    const p=catalogo.PROVINCIAS.find(p=>p.CodigoProvincia===u.CodigoProvincia);
    const d=catalogo.DEPARTAMENTOS.find(d=>d.CodigoDepartamento===p?.CodigoDepartamento);
    return [u.CodigoUbigeo,d?.Departamento,p?.Provincia,u.Distrito].filter(Boolean).join(' · ');
  };
  const campos = {tipo:'TipoDocumento',documento:'NumeroDocumento',nombres:'Nombres',
    apellidos:'Apellidos',correo:'Correo',telefono:'Telefono',nacionalidad:'Nacionalidad',
    pais:'PaisEmisorDocumento',segmento:'IdSegmento',ubigeo:'CodigoUbigeo',direccion:'Direccion'};
  if (sel('#cliente')) {
    opciones(sel('#segmento'),catalogo.SEGMENTOS_CLIENTES,'IdSegmento',s=>s.Segmento);
    opciones(sel('#ubigeo'),catalogo.UBIGEO,'CodigoUbigeo',ubicacion,'Sin ubigeo');
    if (c) {
      sel('h1').textContent='Actualizar cliente';
      for (const [campo,columna] of Object.entries(campos)) sel('#'+campo).value=c[columna]??'';
    }
    alEnviar(sel('#cliente'),async entrada=>{
      const datos=Object.fromEntries(Object.entries(campos).map(([campo,columna])=>[columna,entrada[campo]]));
      if(c) datos.Estado=c.Estado;
      const r=await api(c?ruta:'clientes',c?'PUT':'POST',datos);
      sessionStorage.setItem('ac_mensaje',r.mensaje);
      location.href='detalle-cliente.html?id='+encodeURIComponent(r.IdCliente);
    });
  } else if (c) {
    const u=catalogo.UBIGEO.find(x=>x.CodigoUbigeo===c.CodigoUbigeo);
    sel('#detalle').innerHTML=detalle({Código:c.IdCliente,Cliente:nombre(c),Documento:c.TipoDocumento+' '+c.NumeroDocumento,
      'País emisor':c.PaisEmisorDocumento,Nacionalidad:c.Nacionalidad,Correo:c.Correo,Teléfono:c.Telefono,
      Segmento:catalogo.SEGMENTOS_CLIENTES.find(x=>x.IdSegmento===c.IdSegmento)?.Segmento,
      Ubigeo:u?ubicacion(u):'',Dirección:c.Direccion});
    sel('#editar').href='cliente.html?id='+encodeURIComponent(c.IdCliente);
    filas(sel('#historial'),c.visitas,v=>[seguro(v.FechaHoraInicio.slice(0,10)),
      seguro(fecha(v.FechaHoraInicio)+' / '+fecha(v.FechaHoraFin)),enlace('detalle-visita',v.IdVisita,'Ver visita')],'Sin visitas registradas.');
  } else noEncontrado();
}
cargarCliente().catch(e=>aviso(e.message));
