// Función para obtener el token de autenticación del localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Función para guardar el token de autenticación en localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Función para eliminar el token de autenticación del localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
}; 