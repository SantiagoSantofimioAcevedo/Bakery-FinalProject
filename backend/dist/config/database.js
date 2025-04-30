"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Op = void 0;
const sequelize_1 = require("sequelize");
Object.defineProperty(exports, "Op", { enumerable: true, get: function () { return sequelize_1.Op; } });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sequelize = new sequelize_1.Sequelize(process.env.DB_NAME || 'panaderia_db', process.env.DB_USER || 'root', process.env.DB_PASS || '', {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '-05:00', // Ajusta a tu zona horaria
});
exports.default = sequelize;
//# sourceMappingURL=database.js.map