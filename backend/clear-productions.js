const { models } = require('./dist/config/init-db');

async function clearProductions() {
  try {
    // Eliminar todas las producciones
    const result = await models.Produccion.destroy({
      where: {},
      truncate: true
    });
    
    console.log(`Se han eliminado todas las producciones. Registros afectados: ${result}`);
    process.exit(0);
  } catch (error) {
    console.error('Error al eliminar las producciones:', error);
    process.exit(1);
  }
}

clearProductions(); 