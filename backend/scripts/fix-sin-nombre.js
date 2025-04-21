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
  console.log('\n--- BUSCANDO PRODUCTOS SIN NOMBRE ---');
  
  try {
    // 1. Buscar productos sin nombre (usando los nombres correctos de las tablas)
    const [productos] = await connection.query(`
      SELECT 
          dv.RecetumId as id_receta,
          SUM(dv.cantidad) as unidades_vendidas,
          r.nombre as nombre_receta,
          CASE 
            WHEN r.id IS NULL THEN 'No existe en tabla Receta' 
            WHEN r.nombre IS NULL OR r.nombre = '' THEN 'Nombre vacío'
            ELSE 'Nombre encontrado' 
          END as estado
      FROM detalleventa dv
      LEFT JOIN receta r ON dv.RecetumId = r.id
      GROUP BY dv.RecetumId, r.nombre, r.id
      ORDER BY unidades_vendidas DESC
    `);
    
    console.table(productos);
    
    // 2. Identificar productos problemáticos
    const productosSinNombre = productos.filter(
      p => p.estado === 'No existe en tabla Receta' || p.estado === 'Nombre vacío'
    );
    
    if (productosSinNombre.length === 0) {
      console.log('No se encontraron productos sin nombre.');
      await connection.end();
      return;
    }
    
    console.log('\nProductos sin nombre encontrados:');
    productosSinNombre.forEach(p => {
      console.log(`- ID: ${p.id_receta}, Estado: ${p.estado}, Unidades vendidas: ${p.unidades_vendidas}`);
    });
    
    // 3. Preguntar por cada producto
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    for (const producto of productosSinNombre) {
      const answer = await new Promise(resolve => {
        readline.question(
          `¿Quieres corregir el producto con ID ${producto.id_receta} a "Pan de 100"? (s/n): `,
          resolve
        );
      });
      
      if (answer.toLowerCase() === 's') {
        try {
          // Verificar si la receta existe
          const [recetaExiste] = await connection.query(
            `SELECT id FROM receta WHERE id = ?`, 
            [producto.id_receta]
          );
          
          if (recetaExiste.length > 0) {
            // Actualizar receta existente
            await connection.query(
              `UPDATE receta SET nombre = 'Pan de 100' WHERE id = ?`,
              [producto.id_receta]
            );
            console.log(`✓ Se actualizó el nombre de la receta ID ${producto.id_receta} a "Pan de 100".`);
          } else {
            // Crear nueva receta
            await connection.query(`
              INSERT INTO receta (
                id, nombre, descripcion, tiempo_preparacion, 
                tiempo_horneado, temperatura, instrucciones, 
                precio_venta, createdAt, updatedAt
              ) VALUES (
                ?, 'Pan de 100', 'Pan tradicional de 100 pesos', 30, 
                20, 180, 'Mezclar ingredientes, reposar, hornear', 
                100, NOW(), NOW()
              )
            `, [producto.id_receta]);
            console.log(`✓ Se creó una nueva receta con ID ${producto.id_receta} y nombre "Pan de 100".`);
          }
        } catch (error) {
          console.error(`Error al actualizar/crear receta ID ${producto.id_receta}:`, error.message);
        }
      } else {
        console.log(`No se realizaron cambios para el producto ID ${producto.id_receta}.`);
      }
    }
    
    readline.close();
    await connection.end();
    console.log('\n✓ Proceso completado. Ahora puedes verificar los cambios en el dashboard.');
    
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

main(); 