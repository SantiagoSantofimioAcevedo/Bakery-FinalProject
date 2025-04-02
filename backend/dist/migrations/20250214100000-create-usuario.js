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
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
function up(queryInterface) {
    return __awaiter(this, void 0, void 0, function* () {
        yield queryInterface.createTable('usuarios', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: sequelize_1.DataTypes.INTEGER,
            },
            nombre: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            apellido: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            documento: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            usuario: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            contraseña: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            rol: {
                type: sequelize_1.DataTypes.ENUM('panadero', 'administrador'),
                allowNull: false,
                defaultValue: 'panadero',
            },
            createdAt: {
                allowNull: false,
                type: sequelize_1.DataTypes.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: sequelize_1.DataTypes.DATE,
            },
        });
    });
}
function down(queryInterface) {
    return __awaiter(this, void 0, void 0, function* () {
        yield queryInterface.dropTable('usuarios');
    });
}
