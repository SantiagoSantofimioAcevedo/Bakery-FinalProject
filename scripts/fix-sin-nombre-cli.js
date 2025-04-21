// Este script utiliza la CLI de Sequelize para ejecutar consultas directas
// Para ejecutar: node scripts/fix-sin-nombre-cli.js

// Usar la instancia de Sequelize del proyecto existente
const sequelize = require('../backend/src/config/database');

async function main() {
  try {
    // Verificar la conexión
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente.');

    // 1. Identificar los productos sin nombre
    console.log('\n--- PRODUCTOS SIN NOMBRE ---');
    const [sinNombre] = await sequelize.query(`
      SELECT 
          dv.RecetumId as id_receta,
          SUM(dv.cantidad) as unidades_vendidas,
          r.nombre as nombre_receta,
          CASE WHEN r.nombre IS NULL THEN 'No existe en tabla Receta' 
               WHEN r.nombre = '' THEN 'Nombre vacío'
               ELSE 'Nombre encontrado' END as estado
      FROM DetalleVentas dv
      LEFT JOIN Receta r ON dv.RecetumId = r.id
      GROUP BY dv.RecetumId, r.nombre
      ORDER BY unidades_vendidas DESC;
    `);

    console.table(sinNombre);

    // 2. Verificar si existe la receta pero el nombre está vacío o es nulo
    const productosProblema = sinNombre.filter(
      p => p.estado === 'No existe en tabla Receta' || p.estado === 'Nombre vacío'
    );

    if (productosProblema.length === 0) {
      console.log('No se encontraron productos con problemas de nombre.');
      return;
    }

    console.log('\nProductos con problemas de nombre:');
    productosProblema.forEach(p => {
      console.log(`- ID: ${p.id_receta}, Estado: ${p.estado}, Unidades vendidas: ${p.unidades_vendidas}`);
    });

    // 3. Preguntar si se quiere corregir
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askForCorrection = (index) => {
      if (index >= productosProblema.length) {
        readline.close();
        return;
      }

      const producto = productosProblema[index];
      readline.question(
        `¿Quieres actualizar el producto con ID ${producto.id_receta} a "Pan de 100"? (s/n): `, 
        async (answer) => {
          if (answer.toLowerCase() === 's') {
            try {
              // Verificar si la receta existe
              const [recetaExiste] = await sequelize.query(
                `SELECT id FROM Receta WHERE id = ${producto.id_receta}`
              );

              if (recetaExiste.length > 0) {
                // La receta existe, actualizar el nombre
                await sequelize.query(`
                  UPDATE Receta 
                  SET nombre = 'Pan de 100' 
                  WHERE id = ${producto.id_receta}
                `);
                console.log(`✓ Se actualizó el nombre de la receta ID ${producto.id_receta} a "Pan de 100".`);
              } else {
                // La receta no existe, crear una nueva
                console.log(`La receta con ID ${producto.id_receta} no existe. Creando nueva receta...`);
                await sequelize.query(`
                  INSERT INTO Receta (id, nombre, descripcion, tiempo_preparacion, tiempo_horneado, temperatura, instrucciones, precio_venta, createdAt, updatedAt)
                  VALUES (
                    ${producto.id_receta}, 
                    'Pan de 100', 
                    'Pan tradicional de 100 pesos', 
                    30, 20, 180, 
                    'Mezclar ingredientes, reposar, hornear', 
                    100, 
                    NOW(), NOW()
                  )
                `);
                console.log(`✓ Se creó una nueva receta con ID ${producto.id_receta} y nombre "Pan de 100".`);
              }
            } catch (error) {
              console.error(`Error al actualizar/crear receta ID ${producto.id_receta}:`, error.message);
            }
          } else {
            console.log(`No se realizaron cambios para el producto ID ${producto.id_receta}.`);
          }

          // Pasar al siguiente producto
          askForCorrection(index + 1);
        }
      );
    };

    // Iniciar el proceso de corrección
    askForCorrection(0);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main(); 