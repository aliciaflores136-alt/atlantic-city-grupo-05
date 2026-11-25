api('dashboard').then(d=>{
  sel('#total-clientes').textContent=d.clientes;
  sel('#total-visitas').textContent=d.visitas;
  sel('#total-atencion').textContent=d.casos_pendientes;
}).catch(e=>aviso(e.message));
async function reportar(f) {
  const d=await api('reportes?'+new URLSearchParams(f));
  filas(sel('#actividad'),d.clientes,c=>[seguro(nombre(c)),seguro(c.Segmento),seguro(c.Visitas),dinero(c.Gasto)],'Sin clientes para este filtro.');
  filas(sel('#usos'),d.promociones,p=>[seguro(p.Nombre),seguro(p.Usos)],'Sin promociones.');
}
alEnviar(sel('#filtros'),reportar);
reportar({}).catch(e=>aviso(e.message));
