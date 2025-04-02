import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Usuarios', 'resetToken', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Usuarios', 'resetTokenExpires', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Usuarios', 'resetToken');
    await queryInterface.removeColumn('Usuarios', 'resetTokenExpires');
  }
}; 