import sequelize from './database';
import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';


// Definición de modelos
const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false
  },
  documento: {
    type: DataTypes.STRING,
    allowNull: false
  },
  usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  contraseña: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('panadero', 'administrador'),
    allowNull: false
  },
  ultima_conexion: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

const MateriaPrima = sequelize.define('MateriaPrima', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unidad_medida: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cantidad_stock: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  costo_unitario: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  umbral_minimo: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  fecha_ultima_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

const Receta = sequelize.define('Receta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  tiempo_preparacion: {
    type: DataTypes.INTEGER, // minutos
    allowNull: false
  },
  tiempo_horneado: {
    type: DataTypes.INTEGER, // minutos
    allowNull: false
  },
  temperatura: {
    type: DataTypes.INTEGER, // grados
    allowNull: false
  },
  instrucciones: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  precio_venta: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  imagen: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

const RecetaIngrediente = sequelize.define('RecetaIngrediente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cantidad: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  unidad_medida: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const Produccion = sequelize.define('Produccion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'producciones',
  timestamps: true 
});

const Venta = sequelize.define('Venta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  }
});

const DetalleVenta = sequelize.define('DetalleVenta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

const IngresoMateriaPrima = sequelize.define('IngresoMateriaPrima', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  MateriaPrimaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'MateriaPrimas',
      key: 'id'
    }
  },
  UsuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  fecha_ingreso: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  cantidad: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  unidad_medida: {
    type: DataTypes.STRING,
    allowNull: false
  },
  costo_unitario: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  costo_total: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  proveedor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numero_factura: {
    type: DataTypes.STRING,
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// Definir el modelo MovimientoInventario
const MovimientoInventario = sequelize.define('MovimientoInventario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  MateriaPrimaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'MateriaPrimas',
      key: 'id'
    }
  },
  UsuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('ENTRADA', 'SALIDA', 'AJUSTE'),
    allowNull: false
  },
  cantidad: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  unidad_medida: {
    type: DataTypes.STRING,
    allowNull: false
  },
  motivo: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
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
const createInitialAdmin = async () => {
  try {
    const adminExists = await Usuario.findOne({ where: { usuario: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Usuario.create({
        nombre: 'Administrador',
        apellido: 'Sistema',
        documento: '0000000000',
        usuario: 'admin',
        contraseña: hashedPassword,
        rol: 'administrador'
      });
      console.log('Usuario administrador inicial creado');
    }
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
  }
};

export const initDatabase = async () => {
  try {
    // Comprobar la conexión a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente');
    
    // En modo desarrollo, solo verificar si las tablas existen
    // pero no modificar su estructura (esto lo harán las migraciones)
    if (process.env.NODE_ENV !== 'production') {
      await Usuario.sync({ force: false });
      await MateriaPrima.sync({ force: false });
      await Receta.sync({ force: false });
      await RecetaIngrediente.sync({ force: false });
      await Produccion.sync({ force: false });
      await Venta.sync({ force: false });
      await DetalleVenta.sync({ force: false });
      await IngresoMateriaPrima.sync({ force: false });
      await MovimientoInventario.sync({ force: false });
      console.log('Verificación de tablas completada');
    }
    
    // Crear el usuario administrador si no existe
    await createInitialAdmin();
    console.log('Inicialización de la base de datos completada');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error; // Propagar el error para manejarlo en el nivel superior
  }
};

// Exportar modelos
export const models = {
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