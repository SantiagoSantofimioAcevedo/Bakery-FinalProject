"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarFechas = void 0;
const validarFechas = (req, res, next) => {
    return new Promise((resolve) => {
        const { fechaInicio, fechaFin, timeframe } = req.query;
        // Si se proporciona un timeframe, las fechas no son obligatorias
        if (timeframe) {
            // Validar que el timeframe sea válido
            const validTimeframes = ['week', 'month', 'quarter', 'year'];
            if (!validTimeframes.includes(timeframe)) {
                res.status(400).json({
                    message: 'El valor de timeframe no es válido. Valores aceptados: week, month, quarter, year'
                });
                return;
            }
            next();
            resolve();
            return;
        }
        // Si no hay timeframe, se requieren las fechas
        if (!fechaInicio || !fechaFin) {
            res.status(400).json({ message: 'Se requieren las fechas de inicio y fin o un timeframe válido' });
            return;
        }
        const fechaInicioDate = new Date(fechaInicio);
        const fechaFinDate = new Date(fechaFin);
        if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
            res.status(400).json({ message: 'Las fechas proporcionadas no son válidas' });
            return;
        }
        if (fechaInicioDate > fechaFinDate) {
            res.status(400).json({ message: 'La fecha de inicio no puede ser mayor a la fecha de fin' });
            return;
        }
        next();
        resolve();
    });
};
exports.validarFechas = validarFechas;
//# sourceMappingURL=validarFechas.js.map