import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { models } from '../config/init-db';
import { UsuarioModel } from '../models/types';

const { Usuario } = models;

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { usuario, masterPassword } = req.body;

    // Validar que se proporcionen todos los campos necesarios
    if (!usuario || !masterPassword) {
      return res.status(400).json({ message: 'Usuario y contraseña maestra son requeridos' });
    }

    // Verificar si el usuario existe
    const user = await Usuario.findOne({ where: { usuario } }) as UsuarioModel;
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar la contraseña maestra
    if (masterPassword !== process.env.MASTER_RECOVERY_PASSWORD) {
      return res.status(401).json({ message: 'Contraseña maestra incorrecta' });
    }

    res.json({ 
      message: 'Verificación exitosa',
      usuario: user.usuario
    });

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { usuario, newPassword } = req.body;

    // Validar que se proporcionen todos los campos necesarios
    if (!usuario || !newPassword) {
      return res.status(400).json({ message: 'Usuario y nueva contraseña son requeridos' });
    }

    // Buscar usuario
    const user = await Usuario.findOne({ where: { usuario } }) as UsuarioModel;
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validar longitud mínima de la contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    user.contraseña = hashedPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
}; 