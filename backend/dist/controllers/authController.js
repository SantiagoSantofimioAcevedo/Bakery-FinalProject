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
exports.verifyAdmin = exports.getCurrentUser = exports.register = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const init_db_1 = require("../config/init-db");
// Función para validar la seguridad de una contraseña
const validatePassword = (password) => {
    if (password.length < 8) {
        return 'La contraseña debe tener al menos 8 caracteres';
    }
    // Verificar si la contraseña es una secuencia numérica simple
    if (/^(0123|1234|2345|3456|4567|5678|6789|0987|9876|8765|7654|6543|5432|4321|3210)/.test(password)) {
        return 'La contraseña no puede ser una secuencia numérica simple';
    }
    // Verificar si la contraseña es demasiado común
    const commonPasswords = ['password', 'contraseña', '12345678', 'qwerty', 'admin123'];
    if (commonPasswords.includes(password.toLowerCase())) {
        return 'La contraseña es demasiado común, elige una más segura';
    }
    // Verificar si contiene al menos un número y una letra
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        return 'La contraseña debe contener al menos un número y una letra';
    }
    return null; // La contraseña es válida
};
// Login de usuarios
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usuario, contraseña } = req.body;
        // Validar que se enviaron todos los campos requeridos
        if (!usuario || !contraseña) {
            return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
        }
        // Buscar el usuario en la base de datos
        const user = yield init_db_1.models.Usuario.findOne({ where: { usuario } });
        // Verificar si el usuario existe
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // Verificar la contraseña
        const isValidPassword = yield bcrypt_1.default.compare(contraseña, user.get('contraseña'));
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // Actualizar última conexión
        yield user.update({
            ultima_conexion: new Date()
        });
        // Crear el payload del token
        const payload = {
            id: user.get('id'),
            usuario: user.get('usuario'),
            rol: user.get('rol')
        };
        // Generar el token
        const secretKey = process.env.JWT_SECRET || 'panaderia_secret_key';
        const token = jsonwebtoken_1.default.sign(payload, secretKey, {
            expiresIn: '24h'
        });
        // Responder con el token y datos del usuario
        return res.status(200).json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.get('id'),
                nombre: user.get('nombre'),
                apellido: user.get('apellido'),
                usuario: user.get('usuario'),
                rol: user.get('rol'),
                ultima_conexion: user.get('ultima_conexion')
            }
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.login = login;
// Registro de usuarios (solo para administradores)
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nombre, apellido, documento, usuario, contraseña, rol } = req.body;
        // Validar que se enviaron todos los campos requeridos
        if (!nombre || !apellido || !documento || !usuario || !contraseña || !rol) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }
        // Validar que el rol sea válido
        if (rol !== 'panadero' && rol !== 'administrador') {
            return res.status(400).json({ message: 'Rol inválido' });
        }
        // Validar la seguridad de la contraseña
        const passwordError = validatePassword(contraseña);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }
        // Verificar si el usuario ya existe
        const existingUser = yield init_db_1.models.Usuario.findOne({ where: { usuario } });
        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }
        // Verificar si el documento ya existe
        const existingDocument = yield init_db_1.models.Usuario.findOne({ where: { documento } });
        if (existingDocument) {
            return res.status(400).json({ message: 'El documento ya está registrado' });
        }
        // Hashear la contraseña
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(contraseña, salt);
        // Crear el nuevo usuario
        const newUser = yield init_db_1.models.Usuario.create({
            nombre,
            apellido,
            documento,
            usuario,
            contraseña: hashedPassword,
            rol
        });
        // Responder con los datos del usuario creado (sin la contraseña)
        return res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: {
                id: newUser.get('id'),
                nombre: newUser.get('nombre'),
                apellido: newUser.get('apellido'),
                documento: newUser.get('documento'),
                usuario: newUser.get('usuario'),
                rol: newUser.get('rol')
            }
        });
    }
    catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.register = register;
// Obtener información del usuario actual
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // El middleware de autenticación ya habrá verificado el token
        // y añadido el usuario al objeto request
        const userId = req.user.id;
        // Buscar el usuario en la base de datos
        const user = yield init_db_1.models.Usuario.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // Responder con los datos del usuario
        return res.status(200).json({
            user: {
                id: user.get('id'),
                nombre: user.get('nombre'),
                apellido: user.get('apellido'),
                usuario: user.get('usuario'),
                rol: user.get('rol')
            }
        });
    }
    catch (error) {
        console.error('Error al obtener usuario actual:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.getCurrentUser = getCurrentUser;
// Verificación de credenciales de administrador
const verifyAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminUsuario, adminContraseña } = req.body;
        // Validar que se enviaron todos los campos requeridos
        if (!adminUsuario || !adminContraseña) {
            return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
        }
        // Buscar el usuario en la base de datos
        const admin = yield init_db_1.models.Usuario.findOne({ where: { usuario: adminUsuario } });
        // Verificar si el usuario existe
        if (!admin) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // Verificar la contraseña
        const isValidPassword = yield bcrypt_1.default.compare(adminContraseña, admin.get('contraseña'));
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        // Verificar que sea un administrador
        if (admin.get('rol') !== 'administrador') {
            return res.status(403).json({ message: 'No tiene permisos de administrador' });
        }
        // Responder que es un administrador válido
        return res.status(200).json({
            isAdmin: true,
            message: 'Verificación de administrador exitosa'
        });
    }
    catch (error) {
        console.error('Error en verificación de administrador:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.verifyAdmin = verifyAdmin;
//# sourceMappingURL=authController.js.map