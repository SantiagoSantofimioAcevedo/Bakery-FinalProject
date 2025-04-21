-- Paso 1: Verificar qué tablas existen en la base de datos
SHOW TABLES;

-- Paso 2: Encontrar los productos sin nombre 
-- (Ajusta los nombres de las tablas si son diferentes)
SELECT 
    dv.RecetumId as id_receta,
    SUM(dv.cantidad) as unidades_vendidas,
    r.nombre as nombre_receta
FROM DetalleVenta dv
LEFT JOIN Receta r ON dv.RecetumId = r.id
GROUP BY dv.RecetumId, r.nombre
ORDER BY unidades_vendidas DESC;

-- Paso 3: Actualizar el nombre de la receta 
-- (Reemplaza el 3 por el ID correcto de tu receta sin nombre)
UPDATE Receta
SET nombre = 'Pan de 100'
WHERE id = 3;

-- Paso 4: Verificar que se haya actualizado correctamente
SELECT id, nombre
FROM Receta
WHERE id = 3; 