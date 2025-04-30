"use strict";
/**
 * Sistema de conversión de unidades para materias primas
 *
 * Este módulo permite convertir entre diferentes unidades de medida para
 * poder descontar correctamente del inventario.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONVERSION_FACTORS = exports.UNIT_TO_GRAMS = void 0;
exports.convertirUnidades = convertirUnidades;
exports.calcularCantidadADescontar = calcularCantidadADescontar;
exports.obtenerAbreviaturaUnidad = obtenerAbreviaturaUnidad;
// Relación de unidades a gramos (factor de conversión)
exports.UNIT_TO_GRAMS = {
    'Kilogramos (kg)': 1000,
    'Gramos (g)': 1,
    'Libras (lb)': 453.592, // 1 libra = 453.592 gramos
    'Litros (L)': 1000, // Asumiendo densidad de agua
    'Mililitros (ml)': 1, // Asumiendo densidad de agua
    'Unidades (u)': null, // No se puede convertir automáticamente
    'Onzas (oz)': 28.3495, // 1 onza = 28.3495 gramos
    'Tazas': 240, // 1 taza estándar = 240ml/g (aproximado)
    'Cucharadas': 15, // 1 cucharada = 15g (aproximado)
    'Cucharaditas': 5, // 1 cucharadita = 5g (aproximado)
};
// Factores de conversión entre unidades
exports.CONVERSION_FACTORS = {
    'Kilogramos (kg)': {
        'Gramos (g)': 1000,
        'Libras (lb)': 2.20462,
        'Onzas (oz)': 35.274
    },
    'Gramos (g)': {
        'Kilogramos (kg)': 0.001,
        'Libras (lb)': 0.00220462,
        'Onzas (oz)': 0.035274
    },
    'Libras (lb)': {
        'Kilogramos (kg)': 0.453592,
        'Gramos (g)': 453.592,
        'Onzas (oz)': 16
    },
    'Onzas (oz)': {
        'Kilogramos (kg)': 0.0283495,
        'Gramos (g)': 28.3495,
        'Libras (lb)': 0.0625
    },
    'Litros (L)': {
        'Mililitros (ml)': 1000
    },
    'Mililitros (ml)': {
        'Litros (L)': 0.001
    }
};
/**
 * Convierte una cantidad de una unidad a otra
 * @param cantidad Cantidad a convertir
 * @param unidadOrigen Unidad de origen
 * @param unidadDestino Unidad de destino
 * @returns Cantidad convertida o null si no es posible la conversión
 */
function convertirUnidades(cantidad, unidadOrigen, unidadDestino) {
    // Si las unidades son iguales, no hay conversión necesaria
    if (unidadOrigen === unidadDestino) {
        return cantidad;
    }
    // Convertir a través de gramos si ambas unidades tienen equivalencia
    const gramosPorUnidadOrigen = exports.UNIT_TO_GRAMS[unidadOrigen];
    const gramosPorUnidadDestino = exports.UNIT_TO_GRAMS[unidadDestino];
    if (gramosPorUnidadOrigen && gramosPorUnidadDestino) {
        return (cantidad * gramosPorUnidadOrigen) / gramosPorUnidadDestino;
    }
    // Si hay un factor de conversión directo
    if (exports.CONVERSION_FACTORS[unidadOrigen] &&
        exports.CONVERSION_FACTORS[unidadOrigen][unidadDestino]) {
        return cantidad * exports.CONVERSION_FACTORS[unidadOrigen][unidadDestino];
    }
    // Si no hay conversión posible
    return null;
}
/**
 * Convierte una cantidad a su equivalente en la unidad de stock
 * @param cantidad Cantidad a convertir
 * @param unidadReceta Unidad usada en la receta
 * @param unidadStock Unidad usada en el stock
 * @returns Cantidad a descontar del stock o null si no es posible la conversión
 */
function calcularCantidadADescontar(cantidad, unidadReceta, unidadStock) {
    return convertirUnidades(cantidad, unidadReceta, unidadStock);
}
/**
 * Obtiene la descripción de una unidad sin el paréntesis
 * @param unidad Unidad completa, ej: "Kilogramos (kg)"
 * @returns Nombre corto de la unidad, ej: "kg"
 */
function obtenerAbreviaturaUnidad(unidad) {
    const match = unidad.match(/\(([^)]+)\)/);
    return match ? match[1] : unidad;
}
//# sourceMappingURL=unitConversion.js.map