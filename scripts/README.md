# Scripts para solucionar el problema "Sin nombre" en el Dashboard

Este directorio contiene scripts para identificar y corregir el problema del producto que aparece como "Sin nombre" en el dashboard de productos más vendidos.

## Problema

En el dashboard, aparece un producto con nombre "Sin nombre" que debería ser "Pan de 100". Este problema ocurre porque:

1. En la tabla `DetalleVenta` hay un `RecetumId` que no tiene nombre asociado en la tabla `Receta`, o
2. La receta existe pero tiene un valor nulo o vacío en el campo `nombre`.

## Soluciones

### 1. Script SQL

El archivo `consulta_sin_nombre.sql` contiene consultas SQL para:
- Identificar todos los productos "Sin nombre" en el dashboard
- Mostrar detalles de las ventas con estos productos
- Actualizar la receta con el nombre correcto

Para usar este script:
1. Abre tu gestor de base de datos (MySQL Workbench, phpMyAdmin, etc.)
2. Ejecuta las consultas SQL una por una
3. Después de identificar el ID de la receta problemática, usa la consulta de actualización sustituyendo `????` por el ID correcto

### 2. Script JavaScript con Modelos

El archivo `fix-sin-nombre.js` usa los modelos de Sequelize de tu aplicación para:
- Identificar productos vendidos sin nombre
- Verificar si la receta existe pero no tiene nombre
- Actualizar interactivamente el nombre de la receta

Para ejecutar este script:
```bash
node scripts/fix-sin-nombre.js
```

### 3. Script JavaScript con CLI

El archivo `fix-sin-nombre-cli.js` usa la CLI de Sequelize para ejecutar consultas directas a la base de datos:
- Muestra una tabla con todos los productos vendidos y su estado (si tienen nombre o no)
- Permite corregir interactivamente los productos con problemas
- Puede crear nuevas recetas si es necesario

Para ejecutar este script:
```bash
node scripts/fix-sin-nombre-cli.js
```

Este es el método más sencillo y recomendado para usuarios no técnicos.

## Después de ejecutar el script

Después de corregir el problema, recarga tu dashboard y el producto "Sin nombre" debería aparecer ahora como "Pan de 100". 