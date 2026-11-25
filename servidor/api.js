const {randomBytes}=require('node:crypto');
const {fallo,texto,opcion,momento,ahora,id,cliente,coincide}=require('./reglas');
const {registro,filas,uno,insertar}=require('./consultas');
const visitas=require('./visitas');
const campana='PA04A';

function instalar(app,db) {
  const sesiones=new Map();
  const cookie=req=>(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('ac_sid='))?.slice(7);
  function ruta(metodo,path,fn,{publica=false,estado=200}={}) {
    app[metodo]('/api/'+path,async(req,res,next)=>{
      try {
        const resultado=await db.transaccion(async c=>{
          let usuario;
          if(!publica){
            const s=sesiones.get(cookie(req));
            if(!s||s.fin<Date.now())fallo('Inicia sesión para continuar.',401);
            usuario=await uno(c,"SELECT u.IdUsuario,u.IdEmpleado,u.NombreUsuario,u.Rol FROM USUARIOS u JOIN EMPLEADOS e ON e.IdEmpleado=u.IdEmpleado WHERE u.IdUsuario=? AND u.Estado='A' AND e.Estado='A'",[s.id]);
            if(!usuario)fallo('La cuenta ya no está activa.',401);
          }
          return fn(c,req,usuario,res);
        });
        res.status(estado).json(resultado);
      }catch(e){next(e);}
    });
  }
  ruta('get','estado',()=>({mensaje:'Backend de Atlantic City funcionando'}),{publica:true});
  ruta('post','login',async(c,r,u,res)=>{
    sesiones.delete(cookie(r));
    const nombre=texto(r.body.usuario,50,'usuario'),clave=texto(r.body.clave,255,'contraseña');
    const f=await uno(c,"SELECT u.*,e.Estado AS EstadoEmpleado FROM USUARIOS u JOIN EMPLEADOS e ON e.IdEmpleado=u.IdEmpleado WHERE u.NombreUsuario=?",[nombre]);
    if(!f||f.Estado!=='A'||f.EstadoEmpleado!=='A'||!await coincide(r.body.clave,f.ClaveHash))fallo('Credenciales incorrectas o cuenta inactiva.',401);
    const token=randomBytes(32).toString('hex');
    for(const [k,v] of sesiones)if(v.fin<Date.now())sesiones.delete(k);
    sesiones.set(token,{id:f.IdUsuario,fin:Date.now()+8*3600000});
    res.cookie('ac_sid',token,{httpOnly:true,sameSite:'strict',path:'/',maxAge:8*3600000});
    return {mensaje:'Acceso correcto',usuario:{id:f.IdUsuario,nombre:f.NombreUsuario,rol:f.Rol}};
  },{publica:true});
  ruta('post','logout',(c,r,u,res)=>{sesiones.delete(cookie(r));res.clearCookie('ac_sid',{path:'/'});return {mensaje:'Sesión cerrada'};},{publica:true});
  ruta('get','sesion',(c,r,u)=>({usuario:u}));
  ruta('get','base-datos',async c=>({base_datos:(await uno(c,'SELECT DATABASE() AS nombre')).nombre}));
  ruta('get','reportes',(c,r)=>require('./reportes').reportes(c,r.query));
  ruta('get','dashboard',async c=>({
    clientes:(await uno(c,'SELECT COUNT(*) AS n FROM CLIENTES')).n,
    visitas:(await uno(c,'SELECT COUNT(*) AS n FROM VISITAS')).n,
    casos_pendientes:(await uno(c,"SELECT COUNT(*) AS n FROM ATENCIONES WHERE Estado<>'Resuelto'")).n}));
  ruta('get','catalogos',async c=>{
    const salida={};
    for(const t of ['SEGMENTOS_CLIENTES','DEPARTAMENTOS','PROVINCIAS','UBIGEO','JUEGOS','METODOS_PAGO','PROMOCIONES'])
      salida[t]=await filas(c,'SELECT * FROM '+t);
    salida.EMPLEADOS=await filas(c,'SELECT IdEmpleado,Nombres,Apellidos,Estado FROM EMPLEADOS');return salida;
  });
  ruta('get','clientes',async(c,r)=>{
    const q=texto(r.query.q,100,'búsqueda',true)||'';
    const clientes=await filas(c,"SELECT c.*,s.Segmento FROM CLIENTES c JOIN SEGMENTOS_CLIENTES s ON s.IdSegmento=c.IdSegmento WHERE CONCAT(c.NumeroDocumento,' ',c.Nombres,' ',c.Apellidos) LIKE ? ORDER BY c.Apellidos,c.Nombres",['%'+q+'%']);
    return {clientes,total:clientes.length};
  });
  ruta('get','clientes/:id',async(c,r)=>{
    const f=await registro(c,'CLIENTES','IdCliente',r.params.id);
    f.visitas=await filas(c,'SELECT * FROM VISITAS WHERE IdCliente=? ORDER BY FechaHoraInicio DESC',[f.IdCliente]);
    return {cliente:f};
  });
  async function guardar(c,r,u) {
    const f=cliente(r.body),editar=!!r.params.id;
    if(editar)await registro(c,'CLIENTES','IdCliente',r.params.id,true);
    await registro(c,'SEGMENTOS_CLIENTES','IdSegmento',f.IdSegmento);
    if(f.CodigoUbigeo)await registro(c,'UBIGEO','CodigoUbigeo',f.CodigoUbigeo);
    const k=r.params.id||id('C');
    if(editar)await c.execute('UPDATE CLIENTES SET '+Object.keys(f).map(k=>k+'=?').join(',')+' WHERE IdCliente=?',[...Object.values(f),k]);
    else await insertar(c,'CLIENTES',{IdCliente:k,...f,IdUsuarioRegistro:u.IdUsuario});
    return {IdCliente:k,mensaje:editar?'Cliente actualizado correctamente':'Cliente registrado correctamente'};
  }
  ruta('post','clientes',guardar,{estado:201});ruta('put','clientes/:id',guardar);
  ruta('delete','clientes/:id',async(c,r)=>{
    await registro(c,'CLIENTES','IdCliente',r.params.id,true);
    await c.execute('DELETE FROM CLIENTES WHERE IdCliente=?',[r.params.id]);return {mensaje:'Cliente eliminado correctamente'};
  });
  ruta('get','visitas',async(c,r)=>({visitas:r.query.IdCliente?
    await filas(c,'SELECT * FROM VISITAS WHERE IdCliente=? ORDER BY FechaHoraInicio DESC',[r.query.IdCliente]):
    await filas(c,'SELECT * FROM VISITAS ORDER BY FechaHoraInicio DESC')}));
  ruta('post','visitas',(c,r,u)=>visitas.registrar(c,r.body,u.IdUsuario),{estado:201});
  ruta('get','visitas/:id',async(c,r)=>{
    const v=await registro(c,'VISITAS','IdVisita',r.params.id);
    v.detalles=await filas(c,'SELECT d.*,j.Nombre FROM DETALLES_VISITAS d JOIN JUEGOS j ON j.IdJuego=d.IdJuego WHERE d.IdVisita=?',[v.IdVisita]);
    for(const d of v.detalles){
      d.pagos=await filas(c,'SELECT * FROM PAGOS WHERE IdDetalleVisita=?',[d.IdDetalleVisita]);
      d.promociones=await filas(c,'SELECT * FROM USOS_PROMOCIONES WHERE IdDetalleVisita=?',[d.IdDetalleVisita]);
    }return {visita:v};
  });
  ruta('get','atenciones',async c=>({atenciones:await filas(c,'SELECT * FROM ATENCIONES ORDER BY FechaAtencion DESC')}));
  ruta('get','atenciones/:id',async(c,r)=>{
    const a=await registro(c,'ATENCIONES','IdAtencion',r.params.id);
    a.seguimientos=await filas(c,'SELECT * FROM SEGUIMIENTOS_ATENCIONES WHERE IdAtencion=? ORDER BY FechaSeguimiento,IdSeguimiento',[a.IdAtencion]);
    return {atencion:a};
  });
  ruta('post','atenciones',async(c,r,u)=>{
    const f=r.body,k=id('S'), cli=await registro(c,'CLIENTES','IdCliente',texto(f.IdCliente,10,'cliente'));
    const empleado=await registro(c,'EMPLEADOS','IdEmpleado',f.IdEmpleado||u.IdEmpleado);
    if(cli.Estado!=='A'||empleado.Estado!=='A')fallo('Cliente o empleado inactivo.');
    if(f.IdVisita&&(await registro(c,'VISITAS','IdVisita',f.IdVisita)).IdCliente!==cli.IdCliente)fallo('La visita corresponde a otro cliente.');
    await insertar(c,'ATENCIONES',{IdAtencion:k,IdCliente:cli.IdCliente,IdEmpleado:empleado.IdEmpleado,IdUsuarioRegistro:u.IdUsuario,
      FechaAtencion:f.FechaAtencion?momento(f.FechaAtencion):ahora(),IdVisita:f.IdVisita||null,TipoAtencion:texto(f.TipoAtencion,50,'tipo'),
      Estado:opcion(f.Estado||'Pendiente',['Pendiente','En atención'],'estado'),Asunto:texto(f.Asunto,100,'asunto'),Descripcion:texto(f.Descripcion,600,'descripción')});
    return {IdAtencion:k,mensaje:'Atención registrada correctamente'};
  },{estado:201});
  ruta('post','atenciones/:id/seguimientos',async(c,r,u)=>{
    const a=await registro(c,'ATENCIONES','IdAtencion',r.params.id,true),f=r.body, k=id('SA');
    const fecha=momento(f.FechaSeguimiento),respuesta=texto(f.Respuesta,600,'respuesta');
    const anterior=await uno(c,'SELECT MAX(FechaSeguimiento) AS ultima FROM SEGUIMIENTOS_ATENCIONES WHERE IdAtencion=?',[a.IdAtencion]);
    if(fecha<a.FechaAtencion||(anterior.ultima&&fecha<anterior.ultima))fallo('La fecha es anterior al caso o al último seguimiento.');
    const estado=opcion(f.Estado,['Pendiente','En atención','Resuelto'],'estado');
    await insertar(c,'SEGUIMIENTOS_ATENCIONES',{IdSeguimiento:k,IdAtencion:a.IdAtencion,FechaSeguimiento:fecha,Estado:estado,Respuesta:respuesta,IdUsuarioRegistro:u.IdUsuario});
    await c.execute('UPDATE ATENCIONES SET Estado=?,FechaSolucion=?,Solucion=? WHERE IdAtencion=?',[estado,estado==='Resuelto'?fecha:null,estado==='Resuelto'?respuesta:null,a.IdAtencion]);
    return {IdSeguimiento:k,mensaje:'Seguimiento registrado correctamente'};
  },{estado:201});
  async function regla(c,r,u) {
    if(u.Rol!=='Administrador')fallo('Se requiere el rol Administrador.',403);
    const p=await registro(c,'PROMOCIONES','IdPromocion',campana,true);
    let s=await registro(c,'REGLAS_SEGMENTO_PROMOCION','IdPromocion',campana);
    if(r.method==='PUT'){
      const segmento=await registro(c,'SEGMENTOS_CLIENTES','IdSegmento',texto(r.body.IdSegmento,10,'segmento'));
      await c.execute('UPDATE REGLAS_SEGMENTO_PROMOCION SET IdSegmento=? WHERE IdPromocion=?',[segmento.IdSegmento,campana]);s=segmento;
    }
    return {nombre:p.Nombre,IdSegmento:s.IdSegmento,segmentos:await filas(c,'SELECT * FROM SEGMENTOS_CLIENTES ORDER BY Segmento')};
  }
  ruta('get','marketing/campana',regla);ruta('put','marketing/campana',regla);
  ruta('get','clientes/:id/promociones',async(c,r)=>({promociones:await filas(c,'SELECT a.*,p.Nombre,p.FechaInicio,p.FechaFin,p.Estado,p.MaxUsosPorCliente FROM CLIENTES_PROMOCIONES a JOIN PROMOCIONES p ON p.IdPromocion=a.IdPromocion WHERE a.IdCliente=?',[r.params.id])}));
  ruta('post','promociones/asignaciones',async(c,r)=>{
    const f=r.body;if(f.IdPromocion===campana)fallo('La campaña se asigna automáticamente.',409);
    const cli=await registro(c,'CLIENTES','IdCliente',texto(f.IdCliente,10,'cliente'));
    const p=await registro(c,'PROMOCIONES','IdPromocion',texto(f.IdPromocion,10,'promoción'),true);
    if(cli.Estado!=='A'||p.Estado!=='A')fallo('Cliente o promoción inactivos.');
    if(await uno(c,'SELECT IdAsignacion FROM CLIENTES_PROMOCIONES WHERE IdCliente=? AND IdPromocion=?',[cli.IdCliente,p.IdPromocion]))fallo('Ya asignada.',409);
    const k=id('CP');await insertar(c,'CLIENTES_PROMOCIONES',{IdAsignacion:k,IdCliente:cli.IdCliente,IdPromocion:p.IdPromocion,FechaAsignacion:momento(f.FechaAsignacion)});
    return {IdAsignacion:k,mensaje:'Promoción asignada'};
  },{estado:201});
  async function beneficio(c,r,aceptar) {
    const p=await registro(c,'PROMOCIONES','IdPromocion',campana,true);
    const cli=await registro(c,'CLIENTES','IdCliente',r.params.id),hoy=ahora();
    const regla=await registro(c,'REGLAS_SEGMENTO_PROMOCION','IdPromocion',campana);
    if(cli.Estado!=='A'||p.Estado!=='A'||cli.IdSegmento!==regla.IdSegmento||hoy.slice(0,10)<p.FechaInicio||hoy.slice(0,10)>p.FechaFin){
      if(aceptar)fallo('El cliente no tiene una oferta vigente.',409);
      return {estado:'sin_oferta',mensaje:'Sin promoción disponible para este cliente.'};
    }
    let a=await uno(c,'SELECT IdAsignacion FROM CLIENTES_PROMOCIONES WHERE IdCliente=? AND IdPromocion=?',[cli.IdCliente,campana]);
    if(!a){
      if(aceptar)fallo('Primero busca al cliente.',409);
      a={IdAsignacion:id('CP')};
      await insertar(c,'CLIENTES_PROMOCIONES',{...a,IdCliente:cli.IdCliente,IdPromocion:campana,FechaAsignacion:hoy});
    }
    let estado='asignada';
    if(await uno(c,'SELECT IdUso FROM USOS_PROMOCIONES WHERE IdAsignacion=?',[a.IdAsignacion]))estado='utilizada';
    else if(await uno(c,'SELECT FechaAceptacion FROM ACEPTACIONES_PROMOCIONES WHERE IdAsignacion=?',[a.IdAsignacion]))estado='aceptada';
    else if(aceptar){await insertar(c,'ACEPTACIONES_PROMOCIONES',{...a,FechaAceptacion:hoy});estado='aceptada';}
    return {...a,estado,nombre:p.Nombre,beneficio:p.Beneficio};
  }
  ruta('post','clientes/:id/beneficio',(c,r)=>beneficio(c,r,false));
  ruta('post','clientes/:id/beneficio/aceptar',(c,r)=>beneficio(c,r,true));
}
module.exports={instalar};
