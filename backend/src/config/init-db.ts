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
    allowNull: false,
    unique: true
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

Produccion.belongsTo(Receta, { foreignKey: 'RecetumId', onDelete: 'CASCADE' });
Receta.hasMany(Produccion, { foreignKey: 'RecetumId' });

Produccion.belongsTo(Usuario, { foreignKey: 'UsuarioId', onDelete: 'CASCADE' });
Usuario.hasMany(Produccion, { foreignKey: 'UsuarioId' });

Venta.belongsTo(Usuario);
Usuario.hasMany(Venta);

DetalleVenta.belongsTo(Venta);
Venta.hasMany(DetalleVenta);

DetalleVenta.belongsTo(Receta);
Receta.hasMany(DetalleVenta);

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
    // Primero sincronizar todo excepto RecetaIngrediente
    await sequelize.sync();
    
    // Luego sincronizar la tabla RecetaIngrediente sin forzar su recreación
    await RecetaIngrediente.sync({ alter: true });
    
    console.log('Base de datos sincronizada');
    
    // Crear el usuario administrador
    await createInitialAdmin();
    console.log('Inicialización de la base de datos completada');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
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
  DetalleVenta
};