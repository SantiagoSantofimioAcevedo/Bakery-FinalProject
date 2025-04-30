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
exports.createTeamMember = exports.deleteTeamMember = exports.updateTeamMember = exports.getTeamMember = exports.getTeamMembers = void 0;
const init_db_1 = require("../config/init-db");
const sequelize_1 = require("sequelize");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Obtener todos los miembros del equipo
const getTeamMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const teamMembers = yield init_db_1.models.Usuario.findAll({
            attributes: ['id', 'nombre', 'apellido', 'usuario', 'rol', 'ultima_conexion', 'estado'],
            where: {
                [sequelize_1.Op.or]: [
                    { estado: 'activo' },
                    { estado: null }
                ]
            },
            order: [['nombre', 'ASC']]
        });
        const serializedMembers = teamMembers.map(member => {
            const ultima_conexion = member.get('ultima_conexion');
            console.log(`Usuario ${member.get('usuario')} - última conexión:`, ultima_conexion);
            return {
                id: member.get('id'),
                nombre: member.get('nombre'),
                apellido: member.get('apellido'),
                usuario: member.get('usuario'),
                rol: member.get('rol'),
                ultima_conexion: ultima_conexion instanceof Date ? ultima_conexion.toISOString() : null,
                estado: member.get('estado') || 'activo'
            };
        });
        console.log('Miembros serializados:', serializedMembers);
        return res.status(200).json({
            message: 'Miembros del equipo obtenidos exitosamente',
            teamMembers: serializedMembers
        });
    }
    catch (error) {
        console.error('Error al obtener miembros del equipo:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.getTeamMembers = getTeamMembers;
// Obtener un usuario específico
const getTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield init_db_1.models.Usuario.findByPk(id, {
            attributes: ['id', 'nombre', 'apellido', 'documento', 'usuario', 'rol', 'ultima_conexion', 'createdAt', 'updatedAt']
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const ultima_conexion = user.get('ultima_conexion');
        const serializedUser = {
            id: user.get('id'),
            nombre: user.get('nombre'),
            apellido: user.get('apellido'),
            documento: user.get('documento'),
            usuario: user.get('usuario'),
            rol: user.get('rol'),
            ultima_conexion: ultima_conexion instanceof Date ? ultima_conexion.toISOString() : null,
            createdAt: user.get('createdAt'),
            updatedAt: user.get('updatedAt')
        };
        return res.status(200).json(serializedUser);
    }
    catch (error) {
        console.error('Error al obtener usuario:', error);
        return res.status(500).json({ message: 'Error al obtener usuario' });
    }
});
exports.getTeamMember = getTeamMember;
// Actualizar un miembro del equipo
const updateTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { nombre, apellido, rol } = req.body;
        const user = yield init_db_1.models.Usuario.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        yield user.update({
            nombre,
            apellido,
            rol
        });
        return res.status(200).json({
            message: 'Usuario actualizado exitosamente',
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
        console.error('Error al actualizar usuario:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.updateTeamMember = updateTeamMember;
// Eliminar un miembro del equipo
const deleteTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield init_db_1.models.Usuario.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // En lugar de eliminar físicamente, marcar como inactivo
        yield user.update({
            estado: 'inactivo',
            // Agregar un prefijo al usuario para evitar conflictos de nombre de usuario únicos
            usuario: `inactivo_${Date.now()}_${user.get('usuario')}`
        });
        return res.status(200).json({ message: 'Usuario desactivado exitosamente' });
    }
    catch (error) {
        console.error('Error al desactivar usuario:', error);
        return res.status(500).json({
            message: 'Error en el servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
exports.deleteTeamMember = deleteTeamMember;
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
// Crear un nuevo usuario (solo accesible por administradores)
const createTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        console.error('Error al crear usuario:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
});
exports.createTeamMember = createTeamMember;
//# sourceMappingURL=equipoController.js.map