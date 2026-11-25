async function cargarVisitas() {
  const {clientes}=await api('clientes');
  const cliente=id=>nombre(clientes.find(c=>c.IdCliente===id) || {Nombres:id,Apellidos:''});
  if (sel('#lista-visitas')) {
    const {visitas}=await api('visitas');
    filas(sel('#lista-visitas'),visitas,v=>[seguro(cliente(v.IdCliente)),seguro(v.FechaHoraInicio.slice(0,10)),
      seguro(fecha(v.FechaHoraInicio)+' / '+fecha(v.FechaHoraFin)),enlace('detalle-visita',v.IdVisita,'Ver visita')],'No hay visitas registradas.');
    return;
  }
  const cat=await api('catalogos');
  if (sel('#detalle-visita')) {
    const {visita:v}=await api('visitas/'+encodeURIComponent(registroId));
    sel('#detalle-visita').innerHTML=detalle({Cliente:cliente(v.IdCliente),Entrada:fecha(v.FechaHoraInicio),Salida:fecha(v.FechaHoraFin)})+
      v.detalles.map(j=>'<h2>'+seguro(j.Nombre)+'</h2>'+detalle({Partidas:j.CantidadPartidas,Gasto:dinero(j.Gasto),
        Premio:dinero(j.Premio),Resultado:j.Resultado,Inconveniente:j.Inconveniente,
        Pagos:j.pagos.map(p=>p.TipoPago+' '+dinero(p.MontoPagado)+' · '+cat.METODOS_PAGO.find(m=>m.IdMetodoPago===p.IdMetodoPago)?.MetodoPago).join(' / '),
        'Uso de promoción':j.promociones.map(p=>p.IdUso+' · '+fecha(p.FechaUso)).join(', ')})).join('');
    return;
  }
  opciones(sel('#clienteId'),clientes.filter(c=>c.Estado==='A'),'IdCliente',nombre);
  let promociones=[], secuencia=0;
  function cargarOpcionesPromocion(control) {
    opciones(control,promociones,'IdAsignacion',p=>p.Nombre+' · '+p.IdAsignacion,'Sin promoción');
  }
  sel('#clienteId').addEventListener('change',async ()=>{
    const id=sel('#clienteId').value;
    promociones=[];
    document.querySelectorAll('[data-campo=IdAsignacion]').forEach(cargarOpcionesPromocion);
    if(!id)return;
    try {
      const r=await api('clientes/'+encodeURIComponent(id)+'/promociones');
      if(id!==sel('#clienteId').value)return;
      promociones=r.promociones;
      document.querySelectorAll('[data-campo=IdAsignacion]').forEach(cargarOpcionesPromocion);
    } catch(e){aviso(e.message);}
  });
  function agregarJuego() {
    secuencia++;
    const grupo=document.createElement('fieldset');
    grupo.className='juego';
    grupo.innerHTML='<legend>Juego '+secuencia+'</legend><div class="rejilla"></div>';
    function campo(key,titulo,tipo,obligatorio=true) {
      const etiqueta=document.createElement('label');
      etiqueta.textContent=titulo;
      const c=document.createElement(tipo==='select'?'select':'input');
      c.id=key+'-'+secuencia;c.dataset.campo=key;c.required=obligatorio;
      if(c.tagName==='INPUT')c.type=tipo;
      if(tipo==='number'){c.min=key==='CantidadPartidas'?'1':'0';c.step=key==='CantidadPartidas'?'1':'0.01';}
      c.className=tipo==='select'?'form-select':'form-control';
      etiqueta.append(c);grupo.querySelector('.rejilla').append(etiqueta);
      return c;
    }
    opciones(campo('IdJuego','Juego','select'),cat.JUEGOS.filter(j=>j.Estado==='A'),'IdJuego',j=>j.Nombre);
    campo('CantidadPartidas','Cantidad de partidas','number');
    campo('Gasto','Gasto (S/)','number');campo('Premio','Premio (S/)','number');
    opciones(campo('IdMetodoPago','Método de pago','select'),cat.METODOS_PAGO.filter(m=>m.Estado==='A'),'IdMetodoPago',m=>m.MetodoPago);
    campo('Inconveniente','Inconveniente','text',false).maxLength=200;
    cargarOpcionesPromocion(campo('IdAsignacion','Promoción asignada','select',false));
    const quitar=document.createElement('button');quitar.type='button';quitar.textContent='Quitar juego';
    quitar.onclick=()=>{if(document.querySelectorAll('.juego').length>1)grupo.remove();};
    grupo.append(quitar);sel('#juegos').append(grupo);
  }
  agregarJuego();
  sel('#agregar-juego').addEventListener('click',agregarJuego);
  alEnviar(sel('#visita'),async f=>{
    const detalles=Array.from(document.querySelectorAll('.juego'),grupo=>{
      const d=Object.fromEntries(Array.from(grupo.querySelectorAll('[data-campo]'),c=>[c.dataset.campo,c.value]));
      d.CantidadPartidas=Number(d.CantidadPartidas);
      const saldo=Number(d.Premio)-Number(d.Gasto);
      d.Resultado=saldo>0?'Ganó':saldo<0?'Perdió':'Empató';
      return d;
    });
    const r=await api('visitas','POST',{IdCliente:f.clienteId,FechaHoraInicio:f.entrada,FechaHoraFin:f.salida,detalles});
    sessionStorage.setItem('ac_mensaje',r.mensaje);
    location.href='detalle-visita.html?id='+encodeURIComponent(r.IdVisita);
  });
}
cargarVisitas().catch(e=>aviso(e.message));
