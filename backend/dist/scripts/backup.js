"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackup = createBackup;
exports.restoreBackup = restoreBackup;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
// Cargar variables de entorno
(0, dotenv_1.config)();
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Configuración
const BACKUP_DIR = path_1.default.join(__dirname, '../../backups');
const MAX_BACKUPS = 7; // Mantener 7 días de backups
const DB_NAME = process.env.DB_NAME || 'panaderia';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
// Asegurar que el directorio de backups existe
if (!fs_1.default.existsSync(BACKUP_DIR)) {
    fs_1.default.mkdirSync(BACKUP_DIR, { recursive: true });
}
function createBackup() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path_1.default.join(BACKUP_DIR, `backup_${timestamp}.sql`);
            const compressedFile = `${backupFile}.gz`;
            // Crear backup usando mysqldump
            const command = `mysqldump -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > "${backupFile}"`;
            yield execAsync(command);
            // Comprimir el backup
            yield execAsync(`gzip "${backupFile}"`);
            console.log(`Backup creado exitosamente: ${compressedFile}`);
            // Limpiar backups antiguos
            yield cleanOldBackups();
        }
        catch (error) {
            console.error('Error al crear backup:', error);
            throw error;
        }
    });
}
function cleanOldBackups() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const files = fs_1.default.readdirSync(BACKUP_DIR)
                .filter(file => file.endsWith('.sql.gz'))
                .map(file => ({
                name: file,
                path: path_1.default.join(BACKUP_DIR, file),
                time: fs_1.default.statSync(path_1.default.join(BACKUP_DIR, file)).mtime.getTime()
            }))
                .sort((a, b) => b.time - a.time);
            // Eliminar backups antiguos
            for (let i = MAX_BACKUPS; i < files.length; i++) {
                fs_1.default.unlinkSync(files[i].path);
                console.log(`Backup antiguo eliminado: ${files[i].name}`);
            }
        }
        catch (error) {
            console.error('Error al limpiar backups antiguos:', error);
        }
    });
}
function restoreBackup(backupFile) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const backupPath = path_1.default.join(BACKUP_DIR, backupFile);
            if (!fs_1.default.existsSync(backupPath)) {
                throw new Error('Backup no encontrado');
            }
            // Descomprimir el backup
            yield execAsync(`gunzip -c "${backupPath}" > "${backupPath.replace('.gz', '')}"`);
            // Restaurar la base de datos
            const command = `mysql -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < "${backupPath.replace('.gz', '')}"`;
            yield execAsync(command);
            // Eliminar el archivo descomprimido
            fs_1.default.unlinkSync(backupPath.replace('.gz', ''));
            console.log('Backup restaurado exitosamente');
        }
        catch (error) {
            console.error('Error al restaurar backup:', error);
            throw error;
        }
    });
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
            const files = fs_1.default.readdirSync(BACKUP_DIR)
                .filter(file => file.endsWith('.sql.gz'))
                .map(file => ({
                name: file,
                time: fs_1.default.statSync(path_1.default.join(BACKUP_DIR, file)).mtime
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
//# sourceMappingURL=backup.js.map