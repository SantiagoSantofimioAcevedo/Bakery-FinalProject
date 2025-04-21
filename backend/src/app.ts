import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import equipoRoutes from './routes/equipo';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/auth', authRoutes);
app.use('/equipo', equipoRoutes);

export default app; 