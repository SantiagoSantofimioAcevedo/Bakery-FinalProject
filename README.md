# Sistema de Panadería La Parveria

## Desarrollo local

Para ejecutar el proyecto localmente:

1. Clona el repositorio
2. Configura la base de datos local (MySQL)
3. Copia el archivo `.env.example` a `.env` en el directorio backend y configura las variables
4. Ejecuta los siguientes comandos:

```bash
# Instalar dependencias del backend
cd backend
npm install

# Iniciar el backend en modo desarrollo
npm run dev

# En otra terminal, instalar dependencias del frontend
cd frontend
npm install

# Iniciar el frontend en modo desarrollo
npm start
```

El backend estará disponible en http://localhost:3005 y el frontend en http://localhost:3000. 