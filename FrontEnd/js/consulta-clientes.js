const buscador = document.querySelector('#buscar');
const campoBusqueda = document.querySelector('#busqueda');
const tabla = document.querySelector('#lista-clientes');

const panelPromocion = document.querySelector('#promocion');
const mensajeBeneficio = document.querySelector('#beneficio');
const aceptar = document.querySelector('#aceptar');
let clienteActual = null;
let versionBusqueda = 0;

async function mostrarBeneficio(cliente, confirmar, version) {
  const ruta = '/api/clientes/' + encodeURIComponent(cliente) + '/beneficio';
  try {
    const respuesta = await fetch(ruta + (confirmar ? '/aceptar' : ''), { method: 'POST' });
    const datos = await respuesta.json();
    if (version !== versionBusqueda) return;
    panelPromocion.hidden = false;
    aceptar.hidden = !respuesta.ok || datos.estado !== 'asignada';
    mensajeBeneficio.textContent = datos.mensaje ||
      datos.nombre + ' · ' + datos.beneficio + ' · Promoción ' + datos.estado + '.';
  } catch {
    if (version !== versionBusqueda) return;
    panelPromocion.hidden = false;
    aceptar.hidden = true;
    mensajeBeneficio.textContent = 'No se pudo consultar la promoción. Vuelve a buscar el documento.';
  }
}

aceptar.addEventListener('click', async function () {
  aceptar.disabled = true;
  await mostrarBeneficio(clienteActual, true, versionBusqueda);
  aceptar.disabled = false;
});

async function listarClientes() {
  const version = ++versionBusqueda;
  clienteActual = null;
  panelPromocion.hidden = true;
  aceptar.hidden = true;
  const consulta = campoBusqueda.value.trim();
  const parametros = new URLSearchParams({ q: consulta });
  const boton = buscador.querySelector('button');
  boton.disabled = true;

  try {
    const respuesta = await fetch('/api/clientes?' + parametros);
    const resultado = await respuesta.json();

    if (version !== versionBusqueda) return;
    tabla.textContent='';

    if (!respuesta.ok) {
      mostrarMensaje(resultado.mensaje);
      return;
    }

    if (resultado.total === 0) {
      mostrarMensaje('No se encontraron clientes.');
      return;
    }

    for (const cliente of resultado.clientes) {
      const fila = tabla.insertRow();
      fila.insertCell().textContent = cliente.IdCliente;
      fila.insertCell().textContent = cliente.TipoDocumento;
      fila.insertCell().textContent = cliente.NumeroDocumento;
      fila.insertCell().textContent = cliente.Nombres + ' ' + cliente.Apellidos;
      fila.insertCell().textContent = cliente.Segmento;
      const enlace = document.createElement('a');
      enlace.href = 'detalle-cliente.html?id=' + encodeURIComponent(cliente.IdCliente);
      enlace.textContent = 'Ver detalle';
      fila.insertCell().append(enlace);
    }
    if (resultado.total === 1 && consulta && consulta === resultado.clientes[0].NumeroDocumento) {
      clienteActual = resultado.clientes[0].IdCliente;
      await mostrarBeneficio(clienteActual, false, version);
    }
  } catch {
    if (version !== versionBusqueda) return;
    tabla.textContent='';
    mostrarMensaje('No se pudo consultar la lista. Revisa la terminal del servidor.');
  } finally {
    if (version === versionBusqueda) boton.disabled = false;
  }
}

function mostrarMensaje(texto) {
  const celda = tabla.insertRow().insertCell();
  celda.colSpan = 6;
  celda.textContent = texto;
}

buscador.addEventListener('submit', function (evento) {
  evento.preventDefault();
  listarClientes();
});

listarClientes();
fetch('/api/sesion').then(respuesta => respuesta.json()).then(datos => {
  document.querySelector('#marketing').hidden = datos.usuario?.Rol !== 'Administrador';
}).catch(() => {});
