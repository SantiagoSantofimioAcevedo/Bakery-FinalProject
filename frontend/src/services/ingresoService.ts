import api from './api';
import { IngresoMateriaPrima, RegistroIngresoData } from '../types/inventory';

// Registrar un nuevo ingreso
export const registrarIngreso = async (data: RegistroIngresoData): Promise<IngresoMateriaPrima> => {
  // Transform the data to match backend expectations
  const transformedData = {
    materia_prima_id: data.MateriaPrimaId,
    cantidad: data.cantidad,
    costo_unitario: data.costo_unitario,
    costo_total: data.costo_total,
    unidad_medida: data.unidad_medida || 'Unidades (u)',
    proveedor: data.proveedor || 'Sin especificar',
    numero_factura: data.numero_factura || '',
    observaciones: data.observaciones || ''
  };
  
  console.log('Datos a enviar:', transformedData); // Para debugging
  
  const response = await api.post<IngresoMateriaPrima>('/api/ingresos', transformedData);
  return response.data;
};

// Editar un ingreso existente
export const editarIngreso = async (id: number, data: Partial<RegistroIngresoData>): Promise<IngresoMateriaPrima> => {
  // Transform the data to match backend expectations
  const transformedData = {
    ...(data.MateriaPrimaId && { materia_prima_id: data.MateriaPrimaId }),
    ...(data.cantidad !== undefined && { cantidad: data.cantidad }),
    ...(data.costo_unitario !== undefined && { costo_unitario: data.costo_unitario }),
    ...(data.costo_total !== undefined && { costo_total: data.costo_total }),
    ...(data.unidad_medida && { unidad_medida: data.unidad_medida }),
    ...(data.proveedor && { proveedor: data.proveedor }),
    ...(data.numero_factura && { numero_factura: data.numero_factura }),
    ...(data.observaciones !== undefined && { observaciones: data.observaciones })
  };
  
  console.log('Datos a enviar para edición:', transformedData); // Para debugging
  
  const response = await api.put<IngresoMateriaPrima>(`/api/ingresos/${id}`, transformedData);
  return response.data;
};

// Eliminar un ingreso
export const eliminarIngreso = async (id: number): Promise<{ message: string; eliminado: boolean }> => {
  const response = await api.delete(`/api/ingresos/${id}`);
  return response.data;
};

// Obtener historial de ingresos de una materia prima
export const obtenerHistorialIngresos = async (
  materiaPrimaId: number,
  fechaInicio?: string,
  fechaFin?: string
): Promise<IngresoMateriaPrima[]> => {
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fechaInicio', fechaInicio);
  if (fechaFin) params.append('fechaFin', fechaFin);

  const response = await api.get<IngresoMateriaPrima[]>(
    `/api/ingresos/materia-prima/${materiaPrimaId}?${params.toString()}`
  );
  return response.data;
};

// Obtener todos los ingresos con filtros
export const obtenerTodosLosIngresos = async (
  fechaInicio?: string,
  fechaFin?: string,
  proveedor?: string
): Promise<IngresoMateriaPrima[]> => {
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fechaInicio', fechaInicio);
  if (fechaFin) params.append('fechaFin', fechaFin);
  if (proveedor) params.append('proveedor', proveedor);

  const response = await api.get<IngresoMateriaPrima[]>(`/api/ingresos?${params.toString()}`);
  return response.data;
}; 