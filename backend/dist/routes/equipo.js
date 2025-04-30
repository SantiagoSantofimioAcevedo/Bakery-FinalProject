"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const equipoController_1 = require("../controllers/equipoController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Rutas protegidas que requieren autenticación y rol de administrador
router.get('/', [auth_1.verifyToken, auth_1.isAdmin], equipoController_1.getTeamMembers);
router.put('/:id', [auth_1.verifyToken, auth_1.isAdmin], equipoController_1.updateTeamMember);
router.delete('/:id', [auth_1.verifyToken, auth_1.isAdmin], equipoController_1.deleteTeamMember);
exports.default = router;
//# sourceMappingURL=equipo.js.map