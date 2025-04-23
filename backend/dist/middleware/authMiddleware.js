"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: 'Token no proporcionado' });
        return; // Agrega return para evitar continuar la ejecución
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'panaderia_secret_key');
        req.user = decoded;
        next(); // Continua con la siguiente función
    }
    catch (error) {
        res.status(401).json({ message: 'Token inválido' });
        return; // Agrega return para evitar continuar la ejecución
    }
};
exports.authMiddleware = authMiddleware;
