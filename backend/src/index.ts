import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/init-db';
import authRoutes from './routes/auth';  // Importar las rutas de autenticación
import materiasPrimasRoutes from './routes/materiasPrimasRoutes';
import recetasRoutes from './routes/recetasRoutes';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use(authRoutes);  // Usar las rutas de autenticación
app.use('/api', materiasPrimasRoutes);
app.use('/api/recetas',recetasRoutes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));


app.get('/', (req, res) => {
  res.send('API del Sistema de Panadería funcionando correctamente');
});

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  await initDatabase();
});
