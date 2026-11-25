// Evita interpretar los datos escritos por el usuario como etiquetas HTML.
function seguro(texto){return String(texto??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fecha(valor){return valor?valor.replace('T',' '):'Sin salida registrada';}
function dinero(valor){return 'S/ '+Number(valor).toFixed(2);}
function aviso(texto){const a=document.querySelector('#aviso');if(a){a.textContent=texto;a.hidden=false;}}
function confirmar(texto,destino){sessionStorage.setItem('ac_mensaje',texto+'.');location.href=destino+'.html';}
function error(campo,mensaje){campo.setAttribute('aria-invalid',mensaje?'true':'false');campo.setAttribute('aria-describedby','error-'+campo.id);const e=document.getElementById('error-'+campo.id);if(e)e.textContent=mensaje;}
function validar(formulario){
 let correcto=true;
 for(const campo of formulario.querySelectorAll('input,select,textarea')){
  let mensaje='';
  if(campo.required&&!campo.value.trim())mensaje='Completa este campo.';
  else if(campo.validity.typeMismatch)mensaje='Escribe un correo válido, por ejemplo nombre@correo.com.';
  else if(!campo.validity.valid)mensaje='Revisa el formato o el rango permitido.';
  error(campo,mensaje);if(mensaje)correcto=false;
 }
 if(!correcto)formulario.querySelector('[aria-invalid=true]').focus();
 return correcto;
}
function datosFormulario(formulario){return Object.fromEntries([...new FormData(formulario)].map(([k,v])=>[k,v.trim()]));}
function detalle(datos){return '<dl>'+Object.entries(datos).map(([k,v])=>'<dt>'+seguro(k)+'</dt><dd>'+seguro(v??'No registrado')+'</dd>').join('')+'</dl>';}
function noEncontrado(){document.querySelector('main').innerHTML='<h1>Registro no encontrado</h1><p>El registro no está disponible en esta demostración.</p><a class="boton" href="panel.html">Volver al panel</a>';}
const mensaje=sessionStorage.getItem('ac_mensaje');if(mensaje&&document.querySelector('#aviso')){aviso(mensaje);sessionStorage.removeItem('ac_mensaje');}
for(const a of document.querySelectorAll('nav a'))if(location.pathname.endsWith('/'+a.getAttribute('href')))a.setAttribute('aria-current','page');

const sel = selector => document.querySelector(selector);
const registroId = new URLSearchParams(location.search).get('id');
async function api(ruta, metodo = 'GET', datos) {
  const opciones = {method: metodo, cache: 'no-store'};
  if (datos !== undefined) {
    opciones.headers = {'Content-Type': 'application/json'};
    opciones.body = JSON.stringify(datos);
  }
  const respuesta = await fetch('/api/' + ruta, opciones);
  if (respuesta.status === 401) location.replace('../index.html');
  const resultado = await respuesta.json();
  if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo completar la operación.');
  return resultado;
}
function alEnviar(formulario, operacion) {
  formulario.querySelector('button:not([type=button])').disabled=false;
  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (!validar(formulario)) return;
    const boton = formulario.querySelector('button:not([type=button])');
    boton.disabled = true;
    try { await operacion(datosFormulario(formulario)); }
    catch (e) { aviso(e.message); }
    finally { boton.disabled = false; }
  });
}
function opciones(control, filas, valor, rotulo, inicial='Selecciona una opción') {
  control.options.length=0; control.add(new Option(inicial,''));
  for (const fila of filas) control.add(new Option(rotulo(fila),fila[valor]));
}
function nombre(c) { return c.Nombres+' '+c.Apellidos; }
function enlace(pagina,id,texto) {
  return '<a href="'+pagina+'.html?id='+encodeURIComponent(id)+'">'+texto+'</a>';
}
function filas(tabla, datos, columnas, vacio) {
  tabla.textContent='';
  for (const fila of datos) {
    const tr=tabla.insertRow();
    for (const celda of columnas(fila)) tr.insertCell().innerHTML=celda;
  }
  if (!datos.length) {
    const celda=tabla.insertRow().insertCell();
    celda.colSpan=tabla.closest('table').querySelectorAll('thead th').length;
    celda.textContent=vacio;
  }
}
if (location.pathname.includes('/paginas/')) {
  api('sesion').catch(e=>aviso(e.message));
  sel('#salir')?.addEventListener('click',async e=>{
    e.preventDefault();
    try { await api('logout','POST'); location.replace('../index.html'); }
    catch (err) { aviso(err.message); }
  });
}
