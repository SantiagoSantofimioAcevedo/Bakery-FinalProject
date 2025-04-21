# Sistema de Backups

Este sistema implementa un robusto sistema de backups para la base de datos de la panadería.

## Características

- Backups automáticos diarios
- Compresión de backups para ahorrar espacio
- Mantenimiento de 7 días de historial de backups
- Restauración fácil de backups
- Listado de backups disponibles

## Uso

### Crear un backup manual

```bash
npm run backup:create
```

### Restaurar un backup

```bash
npm run backup:restore <nombre-del-archivo>
```

### Listar backups disponibles

```bash
npm run backup:list
```

## Configuración de Backups Automáticos

### En Windows

1. Abrir el Programador de tareas de Windows
2. Crear una nueva tarea básica
3. Nombre: "Backup Panadería"
4. Descripción: "Backup diario de la base de datos de la panadería"
5. Trigger: Diario
6. Hora: 00:00 (o la hora que prefieras)
7. Acción: Iniciar un programa
8. Programa: `C:\ruta\a\tu\proyecto\backend\scripts\backup.bat`

### Ubicación de los Backups

Los backups se almacenan en la carpeta `backend/backups/` con el formato:
`backup_YYYY-MM-DDTHH-mm-ss-sssZ.sql.gz`

## Restauración de Emergencia

En caso de pérdida de datos:

1. Detener el servidor de la aplicación
2. Ejecutar el comando de restauración con el backup más reciente
3. Reiniciar el servidor

## Recomendaciones de Seguridad

1. Realizar copias de seguridad de la carpeta `backups` en un dispositivo externo
2. Mantener un registro de las restauraciones realizadas
3. Probar periódicamente la restauración de backups
4. Mantener las credenciales de la base de datos seguras

## Solución de Problemas

Si encuentras errores al crear o restaurar backups:

1. Verificar que las credenciales de la base de datos son correctas
2. Asegurarte de que tienes permisos de escritura en la carpeta de backups
3. Verificar que MySQL está instalado y accesible desde la línea de comandos
4. Revisar los logs de error en la consola

# Sistema de Panadería - Backend

## Configuración de la Base de Datos

### Usando Migraciones (Recomendado)

Este proyecto utiliza Sequelize CLI para gestionar las migraciones y mantener la base de datos. Este enfoque es más robusto que usar `sync()` y evita problemas como el límite de índices en MySQL.

#### Comandos para migraciones

1. **Inicializar la base de datos**:
   ```
   npx sequelize-cli db:migrate
   ```

2. **Revertir la última migración**:
   ```
   npx sequelize-cli db:migrate:undo
   ```

3. **Revertir todas las migraciones**:
   ```
   npx sequelize-cli db:migrate:undo:all
   ```

4. **Crear una nueva migración**:
   ```
   npx sequelize-cli migration:generate --name nombre-descriptivo
   ```

### Ventajas del uso de migraciones

- **Control preciso**: Las migraciones permiten controlar exactamente qué cambios se aplican a la base de datos.
- **Versionamiento**: Cada migración representa una versión de la estructura de la base de datos.
- **Reversibilidad**: Las migraciones pueden revertirse si hay problemas.
- **Evita límites**: Controla manualmente la creación de índices para no superar el límite de 64 índices por tabla en MySQL.

## Desarrollo

Para iniciar el servidor en modo desarrollo:

```
npm run dev
```

## Producción

Para compilar el proyecto para producción:

```
npm run build
```

Para iniciar el servidor en producción:

```
npm start
``` 