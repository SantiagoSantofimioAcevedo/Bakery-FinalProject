require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  try {
    // Crear conexión a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    
    console.log('Conexión establecida correctamente.');
    
    // Buscar todas las ventas con total = 0
    const [ventasCero] = await connection.query(`
      SELECT id, fecha_hora, total, UsuarioId
      FROM venta
      WHERE total = 0
      ORDER BY fecha_hora DESC
    `);
    
    console.log(`\nSe encontraron ${ventasCero.length} ventas con total = 0:`);
    console.table(ventasCero);
    
    if (ventasCero.length === 0) {
      console.log('No hay ventas que corregir.');
      await connection.end();
      return;
    }
    
    console.log('\nCorrigiendo totales de ventas...');
    
    // Corregir cada venta con total = 0
    for (const venta of ventasCero) {
      // Obtener los detalles de la venta
      const [detalles] = await connection.query(`
        SELECT id, RecetumId, cantidad, precio_unitario, subtotal
        FROM detalleventa
        WHERE VentumId = ?
      `, [venta.id]);
      
      // Calcular el total correcto sumando los subtotales
      let totalCorrecto = 0;
      detalles.forEach(detalle => {
        totalCorrecto += detalle.subtotal;
      });
      
      console.log(`Venta ID ${venta.id}: ${detalles.length} productos, Total calculado: $${totalCorrecto.toFixed(2)}`);
      
      // Actualizar el total de la venta
      if (totalCorrecto > 0) {
        await connection.query(`
          UPDATE venta
          SET total = ?
          WHERE id = ?
        `, [totalCorrecto, venta.id]);
        
        console.log(`✓ Total de venta ID ${venta.id} corregido a $${totalCorrecto.toFixed(2)}`);
      } else {
        console.log(`! La venta ID ${venta.id} no tiene detalles con subtotales. No se corrigió.`);
      }
    }
    
    // Verificar los cambios
    console.log('\nVerificando totales actualizados:');
    
    const [ventasCorregidas] = await connection.query(`
      SELECT id, fecha_hora, total, UsuarioId
      FROM venta
      WHERE id IN (${ventasCero.map(v => v.id).join(',')})
      ORDER BY id
    `);
    
    console.table(ventasCorregidas);
    
    // Verificar el total de ventas de hoy después de la corrección
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [salesSummary] = await connection.query(`
      SELECT SUM(total) as total
      FROM venta
      WHERE fecha_hora >= ?
    `, [today]);
    
    console.log(`\nTotal de ventas de hoy después de la corrección: $${(salesSummary[0].total || 0).toFixed(2)}`);
    
    console.log('\n✅ Proceso completado. Ahora el dashboard debería mostrar correctamente las ventas de hoy.');
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main(); 