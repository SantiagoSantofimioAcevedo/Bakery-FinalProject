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
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const init_db_1 = require("../config/init-db");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'No se proporcionó token de autenticación' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
        // Buscar el usuario en la base de datos
        const usuario = yield init_db_1.models.Usuario.findByPk(decoded.id);
        if (!usuario) {
            res.status(401).json({ message: 'Usuario no encontrado' });
            return;
        }
        const usuarioData = usuario.get({ plain: true });
        // Agregar el usuario al objeto request
        req.usuario = {
            id: usuarioData.id,
            nombre: usuarioData.nombre,
            apellido: usuarioData.apellido,
            rol: usuarioData.rol
        };
        next();
    }
    catch (error) {
        console.error('Error en autenticación:', error);
        res.status(401).json({ message: 'Token inválido o expirado' });
        return;
    }
});
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map