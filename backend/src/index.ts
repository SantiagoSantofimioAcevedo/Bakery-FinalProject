import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/init-db';
import authRoutes from './routes/auth';
import materiasPrimasRoutes from './routes/materiasPrimasRoutes';
import recetasRoutes from './routes/recetasRoutes';
import ventasRoutes from './routes/ventasRoutes';
import produccionesRoutes from './routes/produccionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportesRoutes from './routes/reportesRoutes';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para registrar todas las peticiones entrantes
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  console.log(`📥 ${req.method} ${req.originalUrl} - Inicio: ${new Date().toISOString()}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duración: ${duration}ms`);
  });
  
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api', materiasPrimasRoutes);
app.use('/api/recetas', recetasRoutes);
app.use('/api', ventasRoutes);
app.use('/api/producciones', produccionesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.get('/', (req, res) => {
  res.send('API del Sistema de Panadería funcionando correctamente');
});

// Middleware para manejar errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error en la aplicación:', err);
  
  // Determinar el código de estado
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  await initDatabase();
});

