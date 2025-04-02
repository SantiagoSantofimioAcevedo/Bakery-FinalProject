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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const init_db_1 = require("./config/init-db");
const auth_1 = __importDefault(require("./routes/auth"));
const materiasPrimasRoutes_1 = __importDefault(require("./routes/materiasPrimasRoutes"));
const recetasRoutes_1 = __importDefault(require("./routes/recetasRoutes"));
const ventasRoutes_1 = __importDefault(require("./routes/ventasRoutes"));
const produccionRoutes_1 = __importDefault(require("./routes/produccionRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rutas
app.use('/api/auth', auth_1.default);
app.use('/api', materiasPrimasRoutes_1.default);
app.use('/api/recetas', recetasRoutes_1.default);
app.use('/api', ventasRoutes_1.default);
app.use('/api/producciones', produccionRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/images', express_1.default.static(path_1.default.join(__dirname, '../public/images')));
app.get('/', (req, res) => {
    res.send('API del Sistema de Panadería funcionando correctamente');
});
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    yield (0, init_db_1.initDatabase)();
}));
