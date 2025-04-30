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
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const equipoController_1 = require("../controllers/equipoController");
const router = express_1.default.Router();
// Todas las rutas requieren autenticación y rol de administrador
router.use(authMiddleware_1.authMiddleware);
router.use(adminMiddleware_1.adminMiddleware);
// Rutas para gestión de equipo
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, equipoController_1.getTeamMembers)(req, res);
}));
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, equipoController_1.getTeamMember)(req, res);
}));
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, equipoController_1.updateTeamMember)(req, res);
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, equipoController_1.deleteTeamMember)(req, res);
}));
// Ruta para crear un nuevo miembro del equipo
router.post('/crear', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, equipoController_1.createTeamMember)(req, res);
}));
exports.default = router;
//# sourceMappingURL=equipoRoutes.js.map