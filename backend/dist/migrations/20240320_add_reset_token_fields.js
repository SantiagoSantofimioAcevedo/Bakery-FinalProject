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
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryInterface.addColumn('Usuarios', 'resetToken', {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        });
        yield queryInterface.addColumn('Usuarios', 'resetTokenExpires', {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        });
    }),
    down: (queryInterface) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryInterface.removeColumn('Usuarios', 'resetToken');
        yield queryInterface.removeColumn('Usuarios', 'resetTokenExpires');
    })
};
//# sourceMappingURL=20240320_add_reset_token_fields.js.map