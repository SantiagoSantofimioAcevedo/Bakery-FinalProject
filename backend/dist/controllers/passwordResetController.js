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
exports.resetPassword = exports.requestPasswordReset = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const init_db_1 = require("../config/init-db");
const { Usuario } = init_db_1.models;
const requestPasswordReset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario, masterPassword } = req.body;
        // Validar que se proporcionen todos los campos necesarios
        if (!usuario || !masterPassword) {
            return res.status(400).json({ message: 'Usuario y contraseña maestra son requeridos' });
        }
        // Verificar si el usuario existe
        const user = yield Usuario.findOne({ where: { usuario } });
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
    }
    catch (error) {
        console.error('Error en recuperación de contraseña:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
});
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario, newPassword } = req.body;
        // Validar que se proporcionen todos los campos necesarios
        if (!usuario || !newPassword) {
            return res.status(400).json({ message: 'Usuario y nueva contraseña son requeridos' });
        }
        // Buscar usuario
        const user = yield Usuario.findOne({ where: { usuario } });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // Validar longitud mínima de la contraseña
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }
        // Hashear la nueva contraseña
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        // Actualizar contraseña
        user.contraseña = hashedPassword;
        yield user.save();
        res.json({ message: 'Contraseña actualizada exitosamente' });
    }
    catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
});
exports.resetPassword = resetPassword;
//# sourceMappingURL=passwordResetController.js.map