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
exports.models = exports.initDatabase = void 0;
const database_1 = __importDefault(require("./database"));
const sequelize_1 = require("sequelize");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Definición de modelos
const Usuario = database_1.default.define('Usuario', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    apellido: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    documento: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    usuario: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    contraseña: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    rol: {
        type: sequelize_1.DataTypes.ENUM('panadero', 'administrador'),
        allowNull: false
    },
    ultima_conexion: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true
    },
    estado: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'activo'
    }
});
const MateriaPrima = database_1.default.define('MateriaPrima', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    unidad_medida: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    cantidad_stock: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    costo_unitario: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    umbral_minimo: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    fecha_ultima_actualizacion: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    }
});
const Receta = database_1.default.define('Receta', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: sequelize_1.DataTypes.TEXT
    },
    tiempo_preparacion: {
        type: sequelize_1.DataTypes.INTEGER, // minutos
        allowNull: false
    },
    tiempo_horneado: {
        type: sequelize_1.DataTypes.INTEGER, // minutos
        allowNull: false
    },
    temperatura: {
        type: sequelize_1.DataTypes.INTEGER, // grados
        allowNull: false
    },
    instrucciones: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    precio_venta: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    imagen: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    }
});
const RecetaIngrediente = database_1.default.define('RecetaIngrediente', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cantidad: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    unidad_medida: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    }
});
const Produccion = database_1.default.define('Produccion', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cantidad: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    fecha_hora: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    }
}, {
    tableName: 'producciones',
    timestamps: true
});
const Venta = database_1.default.define('Venta', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha_hora: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    total: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    }
});
const DetalleVenta = database_1.default.define('DetalleVenta', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cantidad: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    precio_unitario: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    subtotal: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    }
});
const IngresoMateriaPrima = database_1.default.define('IngresoMateriaPrima', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    MateriaPrimaId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'MateriaPrimas',
            key: 'id'
        }
    },
    UsuarioId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        }
    },
    fecha_ingreso: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    cantidad: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    unidad_medida: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    costo_unitario: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    costo_total: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    proveedor: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    numero_factura: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    observaciones: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    }
});
// Definir el modelo MovimientoInventario
const MovimientoInventario = database_1.default.define('MovimientoInventario', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    MateriaPrimaId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'MateriaPrimas',
            key: 'id'
        }
    },
    UsuarioId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        }
    },
    tipo: {
        type: sequelize_1.DataTypes.ENUM('ENTRADA', 'SALIDA', 'AJUSTE'),
        allowNull: false
    },
    cantidad: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    unidad_medida: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    motivo: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    fecha: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    }
});
// Definir relaciones
Receta.belongsToMany(MateriaPrima, {
    through: RecetaIngrediente,
    foreignKey: 'RecetaId',
    otherKey: 'MateriaPrimaId'
});
MateriaPrima.belongsToMany(Receta, {
    through: RecetaIngrediente,
    foreignKey: 'MateriaPrimaId',
    otherKey: 'RecetaId'
});
// Relaciones de Produccion
Produccion.belongsTo(Receta, {
    foreignKey: 'RecetaId',
    as: 'Recetum',
    onDelete: 'CASCADE'
});
Receta.hasMany(Produccion, {
    foreignKey: 'RecetaId',
    as: 'Producciones'
});
Produccion.belongsTo(Usuario, {
    foreignKey: 'UsuarioId',
    onDelete: 'CASCADE'
});
Usuario.hasMany(Produccion, {
    foreignKey: 'UsuarioId'
});
Venta.belongsTo(Usuario);
Usuario.hasMany(Venta);
DetalleVenta.belongsTo(Venta, {
    foreignKey: 'VentumId',
    as: 'Ventum'
});
Venta.hasMany(DetalleVenta, {
    foreignKey: 'VentumId',
    as: 'DetalleVenta'
});
DetalleVenta.belongsTo(Receta, {
    foreignKey: 'RecetumId',
    as: 'Recetum'
});
Receta.hasMany(DetalleVenta, {
    foreignKey: 'RecetumId',
    as: 'DetalleVenta'
});
// Actualizar las relaciones de IngresoMateriaPrima
IngresoMateriaPrima.belongsTo(MateriaPrima, {
    foreignKey: 'MateriaPrimaId',
    as: 'MateriaPrima'
});
MateriaPrima.hasMany(IngresoMateriaPrima, {
    foreignKey: 'MateriaPrimaId'
});
IngresoMateriaPrima.belongsTo(Usuario, {
    foreignKey: 'UsuarioId',
    as: 'Usuario'
});
Usuario.hasMany(IngresoMateriaPrima, {
    foreignKey: 'UsuarioId'
});
// Relaciones de MovimientoInventario
MovimientoInventario.belongsTo(MateriaPrima, {
    foreignKey: 'MateriaPrimaId',
    as: 'MateriaPrima'
});
MateriaPrima.hasMany(MovimientoInventario, {
    foreignKey: 'MateriaPrimaId'
});
MovimientoInventario.belongsTo(Usuario, {
    foreignKey: 'UsuarioId',
    as: 'Usuario'
});
Usuario.hasMany(MovimientoInventario, {
    foreignKey: 'UsuarioId'
});
// Función para crear usuario administrador inicial
const createInitialAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminExists = yield Usuario.findOne({ where: { usuario: 'admin' } });
        if (!adminExists) {
            const hashedPassword = yield bcrypt_1.default.hash('admin123', 10);
            yield Usuario.create({
                nombre: 'Administrador',
                apellido: 'Sistema',
                documento: '0000000000',
                usuario: 'admin',
                contraseña: hashedPassword,
                rol: 'administrador'
            });
            console.log('Usuario administrador inicial creado');
        }
    }
    catch (error) {
        console.error('Error al crear usuario administrador:', error);
    }
});
const initDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Comprobar la conexión a la base de datos
        yield database_1.default.authenticate();
        console.log('Conexión a la base de datos establecida correctamente');
        // En modo desarrollo, solo verificar si las tablas existen
        // pero no modificar su estructura (esto lo harán las migraciones)
        if (process.env.NODE_ENV !== 'production') {
            yield Usuario.sync({ force: false });
            yield MateriaPrima.sync({ force: false });
            yield Receta.sync({ force: false });
            yield RecetaIngrediente.sync({ force: false });
            yield Produccion.sync({ force: false });
            yield Venta.sync({ force: false });
            yield DetalleVenta.sync({ force: false });
            yield IngresoMateriaPrima.sync({ force: false });
            yield MovimientoInventario.sync({ force: false });
            console.log('Verificación de tablas completada');
        }
        // Crear el usuario administrador si no existe
        yield createInitialAdmin();
        console.log('Inicialización de la base de datos completada');
    }
    catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error; // Propagar el error para manejarlo en el nivel superior
    }
});
exports.initDatabase = initDatabase;
// Exportar modelos
exports.models = {
    Usuario,
    MateriaPrima,
    Receta,
    RecetaIngrediente,
    Produccion,
    Venta,
    DetalleVenta,
    IngresoMateriaPrima,
    MovimientoInventario
};
//# sourceMappingURL=init-db.js.map