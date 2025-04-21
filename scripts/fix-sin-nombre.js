const { models } = require('../backend/src/config/init-db');
const sequelize = require('../backend/src/config/database');

async function fixSinNombre() {
  try {
    console.log('Buscando productos "Sin nombre" en las ventas...');
    
    // 1. Identificar los productos sin nombre en las ventas
    const topProducts = await models.DetalleVenta.findAll({
      attributes: [
        'RecetumId',
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'cantidad']
      ],
      include: [{
        model: models.Receta,
        attributes: ['nombre', 'id'],
        as: 'Recetum',
        required: false
      }],
      group: ['RecetumId', 'Recetum.id', 'Recetum.nombre'],
      order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
    });

    // Filtrar los productos que no tienen nombre
    const sinNombreProducts = topProducts.filter(product => !(product.Recetum?.nombre));
    
    if (sinNombreProducts.length === 0) {
      console.log('No se encontraron productos "Sin nombre".');
      return;
    }
    
    console.log('Se encontraron productos "Sin nombre":');
    sinNombreProducts.forEach(product => {
      console.log(`- ID de Receta: ${product.RecetumId}, Cantidad vendida: ${product.get('cantidad')}`);
    });
    
    // 2. Verificar si los IDs de receta existen pero no tienen nombre
    for (const product of sinNombreProducts) {
      const recetaId = product.RecetumId;
      
      // Verificar si la receta existe pero no tiene nombre
      const receta = await models.Receta.findByPk(recetaId);
      
      if (receta) {
        console.log(`La receta con ID ${recetaId} existe pero no tiene nombre o tiene nombre nulo.`);
        
        // Preguntar antes de actualizar
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        readline.question(`¿Quieres actualizar el nombre de la receta con ID ${recetaId} a "Pan de 100"? (s/n): `, async (answer) => {
          if (answer.toLowerCase() === 's') {
            // Actualizar el nombre de la receta
            await receta.update({ nombre: 'Pan de 100' });
            console.log(`✓ Se actualizó el nombre de la receta con ID ${recetaId} a "Pan de 100".`);
          } else {
            console.log('No se actualizó el nombre de la receta.');
          }
          readline.close();
        });
      } else {
        console.log(`La receta con ID ${recetaId} no existe en la tabla Receta.`);
        console.log('Necesitas crear esta receta o corregir las referencias en DetalleVenta.');
      }
    }
  } catch (error) {
    console.error('Error al corregir productos "Sin nombre":', error);
  }
}

// Ejecutar la función
fixSinNombre(); 