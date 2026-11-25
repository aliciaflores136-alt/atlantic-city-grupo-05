const formulario = document.querySelector('#campana');
const segmento = document.querySelector('#segmento');
const estado = document.querySelector('#estado');

async function cargarCampana(guardar) {
  const boton = formulario.querySelector('button');
  boton.disabled = true;
  try {
    const opciones = guardar ? {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IdSegmento: segmento.value })
    } : {};
    const respuesta = await fetch('/api/marketing/campana', opciones);
    const datos = await respuesta.json();
    if (!respuesta.ok) {
      estado.textContent = datos.mensaje;
      return;
    }
    document.querySelector('#nombre').textContent = datos.nombre;
    segmento.textContent='';
    for (const s of datos.segmentos) segmento.add(new Option(s.Segmento, s.IdSegmento));
    segmento.value = datos.IdSegmento;
    formulario.hidden = false;
    estado.textContent = guardar ? 'Condición guardada.' : '';
  } catch {
    estado.textContent = 'No se pudo consultar la campaña. Revisa la conexión.';
  } finally {
    boton.disabled = false;
  }
}
formulario.addEventListener('submit', evento => {
  evento.preventDefault();
  cargarCampana(true);
});
cargarCampana(false);
