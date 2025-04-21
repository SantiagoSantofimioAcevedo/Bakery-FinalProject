-- Consulta para identificar productos vendidos sin nombre
SELECT 
    dv.RecetumId as id_receta,
    SUM(dv.cantidad) as unidades_vendidas,
    r.nombre as nombre_receta,
    CASE WHEN r.nombre IS NULL THEN 'No existe en tabla Receta' ELSE 'Nombre encontrado' END as estado
FROM DetalleVentas dv
LEFT JOIN Receta r ON dv.RecetumId = r.id
GROUP BY dv.RecetumId, r.nombre
ORDER BY unidades_vendidas DESC;

-- Consulta para mostrar detalles del producto "Sin nombre"
SELECT 
    dv.RecetumId as id_receta,
    dv.cantidad,
    dv.precio_unitario,
    dv.VentumId as id_venta,
    v.fecha_hora as fecha_venta
FROM DetalleVentas dv
JOIN Ventas v ON dv.VentumId = v.id
WHERE dv.RecetumId NOT IN (SELECT id FROM Receta WHERE nombre IS NOT NULL)
ORDER BY v.fecha_hora DESC;

