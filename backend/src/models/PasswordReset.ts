import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class PasswordReset extends Model {
  public id!: number;
  public email!: string;
  public token!: string;
  public expiresAt!: Date;
  public used!: boolean;
}

PasswordReset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'PasswordReset',
    timestamps: true,
  }
);

export default PasswordReset; 