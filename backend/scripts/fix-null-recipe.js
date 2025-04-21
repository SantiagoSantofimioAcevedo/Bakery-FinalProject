require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  // Crear conexión a la base de datos usando variables de entorno
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });
  
  console.log('Conexión establecida correctamente.');
  
  try {
    // 1. Crear nueva receta para el Pan de 100
    console.log('Creando nueva receta para Pan de 100...');
    
    const [result] = await connection.query(`
      INSERT INTO receta (
        nombre, descripcion, tiempo_preparacion, 
        tiempo_horneado, temperatura, instrucciones, 
        precio_venta, createdAt, updatedAt
      ) VALUES (
        'Pan de 100', 'Pan tradicional de 100 pesos', 30, 
        20, 180, 'Mezclar ingredientes, reposar, hornear', 
        100, NOW(), NOW()
      )
    `);
    
    const nuevaRecetaId = result.insertId;
    console.log(`✓ Nueva receta creada con ID: ${nuevaRecetaId}`);
    
    // 2. Actualizar los registros de ventas que tienen RecetumId NULL
    console.log('\nActualizando registros de ventas con RecetumId NULL...');
    
    const [updateResult] = await connection.query(`
      UPDATE detalleventa
      SET RecetumId = ?
      WHERE RecetumId IS NULL
    `, [nuevaRecetaId]);
    
    console.log(`✓ Se actualizaron ${updateResult.affectedRows} registros de ventas.`);
    
    // 3. Verificar que se haya actualizado correctamente
    const [verificacion] = await connection.query(`
      SELECT COUNT(*) as count
      FROM detalleventa
      WHERE RecetumId IS NULL
    `);
    
    if (verificacion[0].count === 0) {
      console.log('✓ Verificación exitosa: No quedan registros con RecetumId NULL.');
    } else {
      console.log(`⚠️ Aún quedan ${verificacion[0].count} registros con RecetumId NULL.`);
    }
    
    // 4. Verificar los productos más vendidos actualizados
    console.log('\nProductos más vendidos actualizados:');
    const [topProducts] = await connection.query(`
      SELECT 
          dv.RecetumId as id_receta,
          r.nombre as nombre_receta,
          SUM(dv.cantidad) as unidades_vendidas
      FROM detalleventa dv
      LEFT JOIN receta r ON dv.RecetumId = r.id
      GROUP BY dv.RecetumId, r.nombre
      ORDER BY unidades_vendidas DESC
      LIMIT 5
    `);
    
    console.table(topProducts);
    
    console.log('\n✓ Proceso completado. Ahora puedes verificar los cambios en el dashboard.');
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

main(); 