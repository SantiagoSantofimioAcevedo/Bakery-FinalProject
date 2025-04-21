/**
 * Sistema de conversión de unidades para materias primas
 * 
 * Este módulo permite convertir entre diferentes unidades de medida para 
 * poder descontar correctamente del inventario.
 */

type UnidadMedida = 
  | 'Kilogramos (kg)' 
  | 'Gramos (g)' 
  | 'Libras (lb)' 
  | 'Litros (L)' 
  | 'Mililitros (ml)' 
  | 'Unidades (u)' 
  | 'Onzas (oz)' 
  | 'Tazas' 
  | 'Cucharadas' 
  | 'Cucharaditas';

// Relación de unidades a gramos (factor de conversión)
export const UNIT_TO_GRAMS: Record<UnidadMedida, number | null> = {
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
export const CONVERSION_FACTORS: Record<string, Record<string, number>> = {
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
export function convertirUnidades(
  cantidad: number,
  unidadOrigen: string,
  unidadDestino: string
): number | null {
  // Si las unidades son iguales, no hay conversión necesaria
  if (unidadOrigen === unidadDestino) {
    return cantidad;
  }

  // Convertir a través de gramos si ambas unidades tienen equivalencia
  const gramosPorUnidadOrigen = UNIT_TO_GRAMS[unidadOrigen as UnidadMedida];
  const gramosPorUnidadDestino = UNIT_TO_GRAMS[unidadDestino as UnidadMedida];

  if (gramosPorUnidadOrigen && gramosPorUnidadDestino) {
    return (cantidad * gramosPorUnidadOrigen) / gramosPorUnidadDestino;
  }

  // Si hay un factor de conversión directo
  if (
    CONVERSION_FACTORS[unidadOrigen] &&
    CONVERSION_FACTORS[unidadOrigen][unidadDestino]
  ) {
    return cantidad * CONVERSION_FACTORS[unidadOrigen][unidadDestino];
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
export function calcularCantidadADescontar(
  cantidad: number,
  unidadReceta: string,
  unidadStock: string
): number | null {
  return convertirUnidades(cantidad, unidadReceta, unidadStock);
}

/**
 * Obtiene la descripción de una unidad sin el paréntesis
 * @param unidad Unidad completa, ej: "Kilogramos (kg)"
 * @returns Nombre corto de la unidad, ej: "kg"
 */
export function obtenerAbreviaturaUnidad(unidad: string): string {
  const match = unidad.match(/\(([^)]+)\)/);
  return match ? match[1] : unidad;
} 