import sequelize from './database';
import { DataTypes } from 'sequelize';

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
Receta.belongsToMany(MateriaPrima, { through: RecetaIngrediente });
MateriaPrima.belongsToMany(Receta, { through: RecetaIngrediente });

Produccion.belongsTo(Receta);
Receta.hasMany(Produccion);

Produccion.belongsTo(Usuario);
Usuario.hasMany(Produccion);

Venta.belongsTo(Usuario);
Usuario.hasMany(Venta);

DetalleVenta.belongsTo(Venta);
Venta.hasMany(DetalleVenta);

DetalleVenta.belongsTo(Receta);
Receta.hasMany(DetalleVenta);

// Función para inicializar la base de datos
export const initDatabase = async () => {
    try {
      // Sincronizar todos los modelos sin eliminar tablas existentes
      await sequelize.sync();
      console.log('Base de datos sincronizada correctamente');
  
      // Verificar si el usuario administrador ya existe
      const adminExistente = await Usuario.findOne({ where: { usuario: 'admin' } });
  
      if (!adminExistente) {
        // Crear usuario administrador por defecto solo si no existe
        await Usuario.create({
          nombre: 'Admin',
          apellido: 'Sistema',
          usuario: 'admin',
          contraseña: '$2b$10$XlPMyvCYEMZRMnZgrSKXe.Qc2ZKjFxUeiKYXBAkHgpij0Ob47ks2m', // contraseña: admin123
          rol: 'administrador'
        });
  
        console.log('Usuario administrador creado correctamente');
      } else {
        console.log('El usuario administrador ya existe');
      }
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