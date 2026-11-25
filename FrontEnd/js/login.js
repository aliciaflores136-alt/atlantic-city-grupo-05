const formulario = document.querySelector('#login');
const campoClave = document.querySelector('#clave');

formulario.addEventListener('submit', async function (evento) {
  evento.preventDefault();
  if (!validar(formulario)) return;

  const datos = {
    usuario: formulario.elements.usuario.value.trim(),
    clave: campoClave.value
  };

  try {
    const respuesta = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      error(campoClave, resultado.mensaje);
      return;
    }

    location.href = 'paginas/panel.html';
  } catch {
    error(campoClave, 'No se pudo completar el acceso. Revisa la terminal del servidor.');
  }
});