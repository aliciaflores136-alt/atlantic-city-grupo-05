-- Ejecutar una vez en la base del piloto, después de cargar los datos del proyecto.
USE atlantic_city;
CREATE TABLE IF NOT EXISTS REGLAS_SEGMENTO_PROMOCION (
    IdPromocion VARCHAR(10) PRIMARY KEY,
    IdSegmento VARCHAR(10) NOT NULL,
    FOREIGN KEY (IdPromocion) REFERENCES PROMOCIONES(IdPromocion),
    FOREIGN KEY (IdSegmento) REFERENCES SEGMENTOS_CLIENTES(IdSegmento)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS ACEPTACIONES_PROMOCIONES (
    IdAsignacion VARCHAR(10) PRIMARY KEY,
    FechaAceptacion DATETIME NOT NULL,
    FOREIGN KEY (IdAsignacion) REFERENCES CLIENTES_PROMOCIONES(IdAsignacion)
) ENGINE=InnoDB;

START TRANSACTION;
INSERT INTO PROMOCIONES (IdPromocion, Nombre, Descripcion, FechaInicio, FechaFin,
    Estado, Beneficio, Condiciones, Restricciones, MaxUsosPorCliente)
SELECT 'PA04A', 'Cortesía del piloto', 'Campaña de prueba de la sesión 18',
    '2026-11-01', '2027-12-31', 'A', 'Un cupón de cortesía',
    'Cliente activo del segmento configurado', 'Un uso por cliente', 1
WHERE NOT EXISTS (SELECT 1 FROM PROMOCIONES WHERE IdPromocion='PA04A');
INSERT INTO REGLAS_SEGMENTO_PROMOCION (IdPromocion, IdSegmento)
SELECT 'PA04A', 'SG01'
WHERE NOT EXISTS (SELECT 1 FROM REGLAS_SEGMENTO_PROMOCION WHERE IdPromocion='PA04A');
COMMIT;
