import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const execAsync = promisify(exec);

// Configuración
const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_BACKUPS = 7; // Mantener 7 días de backups
const DB_NAME = process.env.DB_NAME || 'panaderia';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

// Asegurar que el directorio de backups existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.sql`);
    const compressedFile = `${backupFile}.gz`;

    // Crear backup usando mysqldump
    const command = `mysqldump -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > "${backupFile}"`;
    await execAsync(command);

    // Comprimir el backup
    await execAsync(`gzip "${backupFile}"`);

    console.log(`Backup creado exitosamente: ${compressedFile}`);

    // Limpiar backups antiguos
    await cleanOldBackups();

  } catch (error) {
    console.error('Error al crear backup:', error);
    throw error;
  }
}

async function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.sql.gz'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // Eliminar backups antiguos
    for (let i = MAX_BACKUPS; i < files.length; i++) {
      fs.unlinkSync(files[i].path);
      console.log(`Backup antiguo eliminado: ${files[i].name}`);
    }
  } catch (error) {
    console.error('Error al limpiar backups antiguos:', error);
  }
}

async function restoreBackup(backupFile: string) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFile);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup no encontrado');
    }

    // Descomprimir el backup
    await execAsync(`gunzip -c "${backupPath}" > "${backupPath.replace('.gz', '')}"`);

    // Restaurar la base de datos
    const command = `mysql -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < "${backupPath.replace('.gz', '')}"`;
    await execAsync(command);

    // Eliminar el archivo descomprimido
    fs.unlinkSync(backupPath.replace('.gz', ''));

    console.log('Backup restaurado exitosamente');
  } catch (error) {
    console.error('Error al restaurar backup:', error);
    throw error;
  }
}

// Si se ejecuta directamente el script
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
      createBackup()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'restore':
      const backupFile = args[1];
      if (!backupFile) {
        console.error('Debe especificar el archivo de backup a restaurar');
        process.exit(1);
      }
      restoreBackup(backupFile)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'list':
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.endsWith('.sql.gz'))
        .map(file => ({
          name: file,
          time: fs.statSync(path.join(BACKUP_DIR, file)).mtime
        }))
        .sort((a, b) => b.time.getTime() - a.time.getTime());
      
      console.log('Backups disponibles:');
      files.forEach(file => {
        console.log(`${file.name} - ${file.time.toLocaleString()}`);
      });
      break;
    default:
      console.log('Uso:');
      console.log('  npm run backup:create  - Crear un nuevo backup');
      console.log('  npm run backup:restore <archivo>  - Restaurar un backup');
      console.log('  npm run backup:list  - Listar backups disponibles');
      process.exit(1);
  }
}

export { createBackup, restoreBackup }; 