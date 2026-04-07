const API_BASE = 'https://animeav1-api-server.vercel.app';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const res = await fetch(url, { signal });
  
  if (!res.ok) {
    const status = res.status;
    let message = `API error: ${status}`;
    
    switch (status) {
      case 400:
        message = 'Solicitud inválida';
        break;
      case 404:
        message = 'Recurso no encontrado';
        break;
      case 500:
        message = 'Error del servidor, intenta más tarde';
        break;
      case 0:
        message = 'Sin conexión';
        break;
    }
    
    throw new ApiError(message, status);
  }
  
  return res.json();
}
