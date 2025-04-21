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
    
    // Fecha de hoy (inicio del día)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('Fecha de hoy (inicio del día):', today.toISOString());
    
    // Consultar ventas de hoy
    const [ventas] = await connection.query(`
      SELECT id, fecha_hora, total, UsuarioId
      FROM venta
      WHERE fecha_hora >= ?
      ORDER BY fecha_hora DESC
    `, [today]);
    
    console.log(`\nVentas de hoy (${ventas.length} registros):`);
    console.table(ventas);
    
    // Total de ventas
    let totalVentas = 0;
    ventas.forEach(venta => {
      totalVentas += venta.total;
    });
    
    console.log(`\nTotal de ventas de hoy: $${totalVentas.toFixed(2)}`);
    
    // Verificar cómo calcula el dashboard las ventas diarias
    console.log('\nVerificando cálculo del Dashboard:');
    const [salesSummary] = await connection.query(`
      SELECT SUM(total) as total
      FROM venta
      WHERE fecha_hora >= ?
    `, [today]);
    
    console.log('Total calculado con SUM():', salesSummary[0].total || 0);
    
    // Verificar si hay ventas con total = 0
    const [ventasCero] = await connection.query(`
      SELECT COUNT(*) as count
      FROM venta
      WHERE fecha_hora >= ? AND total = 0
    `, [today]);
    
    console.log(`\nVentas con total = 0: ${ventasCero[0].count}`);
    
    // Verificar detalles de las ventas
    for (const venta of ventas) {
      const [detalles] = await connection.query(`
        SELECT dv.id, dv.RecetumId, dv.cantidad, dv.precio_unitario, dv.subtotal, r.nombre as nombre_receta
        FROM detalleventa dv
        LEFT JOIN receta r ON dv.RecetumId = r.id
        WHERE dv.VentumId = ?
      `, [venta.id]);
      
      console.log(`\nDetalles de la venta ID ${venta.id} (${detalles.length} productos):`);
      console.table(detalles);
      
      // Calcular el total desde los detalles
      let totalDesdeDetalles = 0;
      detalles.forEach(detalle => {
        totalDesdeDetalles += detalle.subtotal;
      });
      
      console.log(`- Total registrado en venta: $${venta.total.toFixed(2)}`);
      console.log(`- Total calculado desde detalles: $${totalDesdeDetalles.toFixed(2)}`);
      
      if (Math.abs(venta.total - totalDesdeDetalles) > 0.01) {
        console.log('⚠️ Discrepancia encontrada entre el total registrado y el calculado.');
        
        // Corregir el total si es necesario
        if (venta.total === 0 && totalDesdeDetalles > 0) {
          console.log('- La venta tiene total 0 pero sus detalles suman > 0. Se recomienda corregir.');
          const corregir = false; // Cambiar a true para aplicar la corrección
          
          if (corregir) {
            await connection.query(`
              UPDATE venta
              SET total = ?
              WHERE id = ?
            `, [totalDesdeDetalles, venta.id]);
            
            console.log(`✓ Total de venta ID ${venta.id} corregido a $${totalDesdeDetalles.toFixed(2)}`);
          }
        }
      }
    }
    
    await connection.end();
    console.log('\nDiagnóstico completado.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main(); 