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
    // 1. Identificar todas las recetas de "Pan de 100"
    console.log('Buscando recetas duplicadas de Pan de 100...');
    
    const [recetas] = await connection.query(`
      SELECT id, nombre, createdAt
      FROM receta
      WHERE nombre = 'Pan de 100'
      ORDER BY id
    `);
    
    if (recetas.length <= 1) {
      console.log('No se encontraron recetas duplicadas de Pan de 100.');
      await connection.end();
      return;
    }
    
    console.log(`Se encontraron ${recetas.length} recetas de Pan de 100:`);
    console.table(recetas);
    
    // 2. Verificar las ventas asociadas a cada receta
    console.log('\nVerificando ventas asociadas a cada receta...');
    
    const ventasPorReceta = [];
    
    for (const receta of recetas) {
      const [ventas] = await connection.query(`
        SELECT COUNT(*) as total, SUM(cantidad) as unidades
        FROM detalleventa
        WHERE RecetumId = ?
      `, [receta.id]);
      
      ventasPorReceta.push({
        id: receta.id,
        ventas: ventas[0].total || 0,
        unidades: ventas[0].unidades || 0
      });
    }
    
    console.log('Ventas por receta:');
    console.table(ventasPorReceta);
    
    // 3. Decidir qué receta conservar (la que tenga más ventas o la primera)
    const recetasConVentas = ventasPorReceta.filter(r => r.ventas > 0);
    let recetaAConservar;
    
    if (recetasConVentas.length > 0) {
      // Ordenar por número de ventas (de mayor a menor)
      recetasConVentas.sort((a, b) => b.ventas - a.ventas);
      recetaAConservar = recetasConVentas[0].id;
      console.log(`\nSe conservará la receta con ID ${recetaAConservar} porque tiene más ventas asociadas.`);
    } else {
      // Si ninguna tiene ventas, conservar la primera
      recetaAConservar = recetas[0].id;
      console.log(`\nNinguna receta tiene ventas. Se conservará la primera con ID ${recetaAConservar}.`);
    }
    
    // 4. Actualizar las ventas para que todas apunten a la receta que conservaremos
    console.log('\nReasignando ventas a la receta que se conservará...');
    
    for (const receta of recetas) {
      if (receta.id !== recetaAConservar) {
        const [updateResult] = await connection.query(`
          UPDATE detalleventa
          SET RecetumId = ?
          WHERE RecetumId = ?
        `, [recetaAConservar, receta.id]);
        
        console.log(`- Se actualizaron ${updateResult.affectedRows} registros de la receta ID ${receta.id} a la ID ${recetaAConservar}`);
      }
    }
    
    // 5. Verificar si hay producciones asociadas y reasignarlas
    console.log('\nVerificando y reasignando producciones...');
    
    for (const receta of recetas) {
      if (receta.id !== recetaAConservar) {
        const [updateResult] = await connection.query(`
          UPDATE producciones
          SET RecetaId = ?
          WHERE RecetaId = ?
        `, [recetaAConservar, receta.id]);
        
        console.log(`- Se actualizaron ${updateResult.affectedRows} registros de producción de la receta ID ${receta.id} a la ID ${recetaAConservar}`);
      }
    }
    
    // 6. Verificar asociaciones en RecetaIngredientes
    console.log('\nVerificando ingredientes asociados...');
    
    for (const receta of recetas) {
      if (receta.id !== recetaAConservar) {
        const [ingredientes] = await connection.query(`
          SELECT COUNT(*) as total 
          FROM recetaingredientes
          WHERE RecetaId = ?
        `, [receta.id]);
        
        if (ingredientes[0].total > 0) {
          console.log(`⚠️ La receta ID ${receta.id} tiene ${ingredientes[0].total} ingredientes asociados.`);
          
          // Opcionalmente mover los ingredientes si la receta principal no los tiene
          const [ingredientesPrincipales] = await connection.query(`
            SELECT COUNT(*) as total 
            FROM recetaingredientes
            WHERE RecetaId = ?
          `, [recetaAConservar]);
          
          if (ingredientesPrincipales[0].total === 0) {
            const [updateIngredientes] = await connection.query(`
              UPDATE recetaingredientes
              SET RecetaId = ?
              WHERE RecetaId = ?
            `, [recetaAConservar, receta.id]);
            
            console.log(`- Se movieron ${updateIngredientes.affectedRows} ingredientes a la receta principal`);
          } else {
            console.log(`- No se movieron ingredientes porque la receta principal ya tiene ${ingredientesPrincipales[0].total} ingredientes`);
          }
        }
      }
    }
    
    // 7. Eliminar las recetas duplicadas
    console.log('\nEliminando recetas duplicadas...');
    
    let eliminacionExitosa = true;
    
    for (const receta of recetas) {
      if (receta.id !== recetaAConservar) {
        try {
          // Intentar eliminar la receta
          await connection.query(`
            DELETE FROM receta
            WHERE id = ?
          `, [receta.id]);
          
          console.log(`✓ Receta ID ${receta.id} eliminada correctamente.`);
        } catch (error) {
          eliminacionExitosa = false;
          console.error(`❌ Error al eliminar receta ID ${receta.id}: ${error.message}`);
          
          // Verificar si hay restricciones de clave foránea impidiendo la eliminación
          console.log(`\nVerificando referencias a la receta ID ${receta.id}...`);
          
          const tablas = [
            { nombre: 'detalleventa', campo: 'RecetumId' },
            { nombre: 'producciones', campo: 'RecetaId' },
            { nombre: 'recetaingredientes', campo: 'RecetaId' }
          ];
          
          for (const tabla of tablas) {
            const [referencias] = await connection.query(`
              SELECT COUNT(*) as total
              FROM ${tabla.nombre}
              WHERE ${tabla.campo} = ?
            `, [receta.id]);
            
            console.log(`- Referencias en ${tabla.nombre}: ${referencias[0].total}`);
          }
        }
      }
    }
    
    // 8. Verificar el resultado final
    console.log('\nRecetas de Pan de 100 después de la limpieza:');
    
    const [recetasFinales] = await connection.query(`
      SELECT id, nombre, createdAt
      FROM receta
      WHERE nombre = 'Pan de 100'
      ORDER BY id
    `);
    
    console.table(recetasFinales);
    
    if (eliminacionExitosa) {
      console.log('✅ Proceso completado. Se eliminaron todas las recetas duplicadas.');
    } else {
      console.log('⚠️ Proceso completado con advertencias. Algunas recetas no pudieron ser eliminadas.');
      console.log('\nPara forzar la eliminación, ejecuta el siguiente SQL desde phpMyAdmin o MySQL Workbench:');
      
      for (const receta of recetas) {
        if (receta.id !== recetaAConservar) {
          console.log(`
-- Eliminar receta ID ${receta.id}
SET FOREIGN_KEY_CHECKS=0;
DELETE FROM receta WHERE id = ${receta.id};
SET FOREIGN_KEY_CHECKS=1;
          `);
        }
      }
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

main(); 