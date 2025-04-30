"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    var _a;
    if (((_a = req.usuario) === null || _a === void 0 ? void 0 : _a.rol) !== 'administrador') {
        res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
        return;
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=adminMiddleware.js.map