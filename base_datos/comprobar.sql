-- Seleccionar en Workbench la base atlantic_city_final (o la de ensayo).
SELECT DATABASE() AS base_actual;
SELECT c.IdCliente,c.Nombres,c.Apellidos,c.NumeroDocumento,s.Segmento
FROM CLIENTES c JOIN SEGMENTOS_CLIENTES s ON s.IdSegmento=c.IdSegmento
WHERE c.NumeroDocumento='70000002';
SELECT v.IdVisita,v.IdCliente,d.IdDetalleVisita,j.Nombre,d.CantidadPartidas,d.Gasto,d.Premio,
       p.TipoPago,p.MontoPagado,m.MetodoPago
FROM VISITAS v JOIN DETALLES_VISITAS d ON d.IdVisita=v.IdVisita
JOIN JUEGOS j ON j.IdJuego=d.IdJuego LEFT JOIN PAGOS p ON p.IdDetalleVisita=d.IdDetalleVisita
LEFT JOIN METODOS_PAGO m ON m.IdMetodoPago=p.IdMetodoPago ORDER BY v.FechaHoraInicio DESC;
SELECT a.IdCliente,a.IdAsignacion,a.FechaAsignacion,ac.FechaAceptacion,u.IdUso,u.FechaUso,d.IdVisita
FROM CLIENTES_PROMOCIONES a LEFT JOIN ACEPTACIONES_PROMOCIONES ac ON ac.IdAsignacion=a.IdAsignacion
LEFT JOIN USOS_PROMOCIONES u ON u.IdAsignacion=a.IdAsignacion
LEFT JOIN DETALLES_VISITAS d ON d.IdDetalleVisita=u.IdDetalleVisita WHERE a.IdPromocion='PA04A';
SELECT a.IdAtencion,a.Asunto,a.Estado,s.FechaSeguimiento,s.Respuesta FROM ATENCIONES a
LEFT JOIN SEGUIMIENTOS_ATENCIONES s ON s.IdAtencion=a.IdAtencion ORDER BY a.FechaAtencion DESC;
