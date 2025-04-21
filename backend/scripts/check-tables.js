require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  try {
    // Crear conexión a la base de datos usando variables de entorno
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    
    console.log('Conexión establecida correctamente.');
    
    // Obtener todas las tablas
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tablas en la base de datos:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main(); 