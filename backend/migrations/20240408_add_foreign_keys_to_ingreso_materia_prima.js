'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('IngresoMateriaPrimas', 'materia_prima_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'MateriaPrimas',
          key: 'id'
        }
      });

      await queryInterface.addColumn('IngresoMateriaPrimas', 'usuario_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id'
        }
      });
    } catch (error) {
      console.error('Error en la migración:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('IngresoMateriaPrimas', 'materia_prima_id');
      await queryInterface.removeColumn('IngresoMateriaPrimas', 'usuario_id');
    } catch (error) {
      console.error('Error al revertir la migración:', error);
      throw error;
    }
  }
}; 