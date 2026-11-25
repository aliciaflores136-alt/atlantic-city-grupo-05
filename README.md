# Atlantic City · Gestión de clientes
Proyecto académico IDAT, Grupo 5. La versión final usa Node.js, Express, Bootstrap, JavaScript y MySQL. Los datos son de demostración.

## Iniciar en Windows
1. Descomprimir todo el ZIP en una carpeta. Tener MySQL Server 8 iniciado, Node.js 22.12 o posterior con npm y conexión a Internet para instalar las dependencias una vez. Workbench sirve para revisar los resultados.
2. Abrir PREPARAR.bat. En el Bloc de notas completar MYSQL_USUARIO y MYSQL_CLAVE con la cuenta de MySQL de esta computadora. Guardar y cerrar. Si la clave contiene # o espacios, encerrarla entre comillas. Se usa la base separada atlantic_city_final. La cuenta de instalación necesita crear la base, sus tablas y filas.
3. La consola crea las tablas, carga los datos y muestra una contraseña distinta para cada cuenta nueva. Guardar en privado la de lrojas (Administrador). rdiaz es Operador. La contraseña de MySQL solo se usa para la conexión del servidor.
4. Abrir INICIAR.bat. Esperar el enlace y abrir http://127.0.0.1:3000/interfaz/index.html. Mantener la ventana abierta. Ingresar con la cuenta del piloto.
5. En Panel principal, abrir Clientes y buscar 70000002. Debe aparecer C002. En Workbench seleccionar atlantic_city_final como esquema predeterminado y abrir base_datos/comprobar.sql.
6. En siguientes sesiones basta con iniciar MySQL y abrir INICIAR.bat. Repetir la preparación conserva las cuentas y registros existentes. Ante un fallo, leer la primera línea de error antes de cerrar la ventana.

## Terminal
Desde la carpeta donde está package.json, copiar .env.example a .env y completar los datos. Ejecutar npm install, npm run preparar, npm start. Para una instalación del grupo conservar package-lock.json generado por npm install. Para usar otro puerto, modificar PORT en .env.

## Pruebas
COMPROBAR.bat ejecuta npm test (reglas aisladas) y npm run verificar:mysql (ensayo HTTP sobre Express y MySQL). El segundo crea una base nueva ac_ensayo_... y conserva los movimientos para revisarlos en Workbench. No altera la base del piloto. El recorrido de campaña necesita una fecha dentro de su vigencia, del 01/11/2026 al 31/12/2027. El acceso caduca a las ocho horas o al reiniciar el servidor.
En el panel se consultan datos, reportes por fechas y clientes con un mínimo de visitas. En Marketing solo el administrador puede modificar el segmento. La aplicación registra una visita, todos sus juegos, pagos y usos en una sola transacción. La fecha de entrada de una visita con cupón debe ser posterior o igual a su aceptación.

## Carpetas
FrontEnd/paginas y FrontEnd/js contienen pantallas y eventos. servidor/iniciar.js configura Express y publica Bootstrap localmente. api.js contiene las rutas. reglas.js valida los campos. visitas.js conserva visitas y pagos. reportes.js calcula resultados desde SQL. base.js controla la conexión y las transacciones. base_datos contiene 20 tablas de base + 2 de campaña, el conjunto de 105 filas de referencia y consultas de comprobación. La preparación incorpora la campaña y su condición inicial por separado. pruebas contiene las verificaciones repetibles.

## Repositorio
El grupo puede abrir esta carpeta en GitHub Desktop y publicar en su repositorio de clase. Mantener .env y las contraseñas fuera del repositorio. El código de las primeras actividades usó Flask; esta entrega se inicia con Node.js. El material histórico de esas actividades permanece en el ZIP original.
