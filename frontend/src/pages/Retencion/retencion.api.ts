import type { Retencion, RetencionForm } from "./RetencionTypes";

const API_URL = "http://localhost:3000/api/retenciones";

export const obtenerRetenciones = async (): Promise<Retencion[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener las retenciones");
  }
  return response.json();
};

export const crearRetencion = async (data: RetencionForm): Promise<Retencion> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Error al crear la retención");
  }
  return response.json();
};

export const eliminarRetencion = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Error al eliminar la retención");
  }
};
export const actualizarRetencion = async (id: number, data: RetencionForm): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar la retención");
  }
};
